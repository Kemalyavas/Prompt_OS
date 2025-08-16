import os
from typing import Any, Dict

# Gerekli kütüphaneleri import ediyoruz. Bunların yüklü olduğundan emin ol:
# pip install httpx "PyJWT[crypto]"
import httpx
import jwt
from jwt import algorithms

class ClerkClient:
    """Clerk'ten gelen JWT token'larını JWKS kullanarak doğrulamak için bir istemci."""

    def __init__(self):
        # Bu istemcinin artık API anahtarına ihtiyacı yok, çünkü doğrulama yerel olarak yapılıyor.
        self.issuer = os.getenv("CLERK_ISSUER_URL")
        if not self.issuer:
            raise RuntimeError("CLERK_ISSUER_URL ortam değişkeni .env dosyasında ayarlanmamış.")
        self.jwks_url = self.issuer.rstrip("/") + "/.well-known/jwks.json"
        self._jwks_cache = None

    async def _get_jwks(self) -> Dict[str, Any]:
        """Clerk'in JWKS (JSON Web Key Set) verisini getirir ve cache'ler."""
        if self._jwks_cache:
            return self._jwks_cache
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self.jwks_url)
            response.raise_for_status() # Hata varsa exception fırlat
            self._jwks_cache = response.json()
            return self._jwks_cache

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verilen JWT'yi Clerk'in public key'lerini kullanarak doğrular."""
        try:
            jwks = await self._get_jwks()
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                raise ValueError("Token header'ında 'kid' (Key ID) bulunamadı.")

            public_key = None
            for key_data in jwks.get("keys", []):
                if key_data.get("kid") == kid:
                    public_key = algorithms.RSAAlgorithm.from_jwk(key_data)
                    break
            
            if public_key is None:
                # Cache'i temizleyip tekrar deneyelim, belki key'ler güncellenmiştir.
                self._jwks_cache = None 
                jwks = await self._get_jwks()
                for key_data in jwks.get("keys", []):
                    if key_data.get("kid") == kid:
                        public_key = algorithms.RSAAlgorithm.from_jwk(key_data)
                        break
                if public_key is None:
                    raise RuntimeError(f"Token'ı doğrulayacak uygun bir public key bulunamadı (kid: {kid}).")

            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                issuer=self.issuer.rstrip("/")
            )
            
            # 'sub' alanı kullanıcının ID'sini içerir.
            sub = payload.get("sub")
            if not sub:
                raise ValueError("Token payload'ında 'sub' (subject/user ID) alanı bulunamadı.")
            
            return {"sub": sub}

        except jwt.ExpiredSignatureError:
            raise Exception("Token'ın süresi dolmuş.")
        except jwt.InvalidIssuerError:
            raise Exception("Token'ın 'issuer' bilgisi geçersiz.")
        except Exception as e:
            # Diğer tüm JWT hatalarını veya genel hataları yakala
            raise Exception(f"Token doğrulama hatası: {e}")

