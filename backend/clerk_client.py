import os
from typing import Optional, Any, Dict

try:
    from clerk import Client
except Exception:
    Client = None


class ClerkClient:
    """Small wrapper around the async `clerk.Client` to provide a simple
    `verify_token` async method that returns a dict with a 'sub' key (user id).

    This lets existing code call `await clerk_client.verify_token(token)` and get
    a consistent payload.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        if Client is None:
            raise RuntimeError("clerk package not installed in the environment")

        # Prefer explicit api_key, then CLERK_SECRET_KEY (server-side), then CLERK_API_KEY
        token = api_key or os.getenv("CLERK_SECRET_KEY") or os.getenv("CLERK_API_KEY")
        # Use Clerk REST API base. Do NOT use issuer URL here.
        base = base_url or "https://api.clerk.dev/v1/"

        # Client expects (token, base_url=...)
        self._client = Client(token, base_url=base)

    async def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify a Clerk frontend token and return a dict with 'sub' (user id).

        Strategy:
        1) Try JWT verification against Clerk JWKS (works with useAuth().getToken()).
        2) Fallback to Clerk REST verification API (works with session token).
        """
        # 1) Try JWT verification via JWKS
        try:
            import httpx  # type: ignore
            import jwt  # type: ignore
            from jwt import algorithms  # type: ignore

            issuer = os.getenv("CLERK_ISSUER_URL")
            if not issuer:
                raise RuntimeError("CLERK_ISSUER_URL not set")

            jwks_url = issuer.rstrip("/") + "/.well-known/jwks.json"
            async with httpx.AsyncClient(timeout=5.0) as client:
                jwks = (await client.get(jwks_url)).json()

            # Build key set
            key = algorithms.RSAAlgorithm.from_jwk
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            public_key = None
            for k in jwks.get("keys", []):
                if k.get("kid") == kid:
                    public_key = key(k)
                    break
            if public_key is None:
                raise RuntimeError("Matching JWKS key not found")

            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=None,  # adjust if you enforce aud
                options={"verify_aud": False},
                issuer=issuer.rstrip("/")
            )
            sub = payload.get("sub")
            return {"sub": sub}
        except Exception:
            # 2) Fallback to Clerk REST verification (expects a session token)
            session = await self._client.verification.verify(token)
            return {"sub": getattr(session, "user_id", None)}
