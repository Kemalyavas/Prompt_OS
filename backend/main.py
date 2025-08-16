from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from clerk_client import ClerkClient

# Kendi oluşturduğumuz modülleri import ediyoruz
import models, schemas
from database import SessionLocal, engine

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=engine)

load_dotenv()

# Clerk istemcisini başlat (server-side secret key kullan)
clerk_client = ClerkClient()


app = FastAPI()

# CORS Ayarları
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency: Veritabanı oturumu oluşturmak için
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Dependency: Kullanıcı kimliğini doğrulamak ve kullanıcıyı getirmek için
async def get_current_user(req: Request, db: Session = Depends(get_db)) -> models.User:
    try:
        auth_header = req.headers.get('Authorization')
        if not auth_header:
            raise HTTPException(status_code=401, detail="Authorization header missing")

        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0] != 'Bearer':
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        token = parts[1]
        decoded_token = await clerk_client.verify_token(token)
        user_id = decoded_token.get('sub')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: user ID not found")

    except Exception as e:
        # HATA AYIKLAMA: Orijinal hatayı terminale yazdır
        print(f"!!! CLERK AUTHENTICATION ERROR: {e}") 
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        new_user = models.User(id=user_id)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    return user

# --- API Endpoints ---

@app.get("/api/hello")
def read_root():
    return {"message": "Backend çalışıyor!"}

@app.post("/api/projects", response_model=schemas.Project)
async def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_project = models.Project(**project.dict(), owner_id=current_user.id)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

# BU FONKSİYONU ASYNC OLARAK GÜNCELLE
@app.get("/api/projects", response_model=list[schemas.Project])
async def read_projects(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    projects = db.query(models.Project).filter(models.Project.owner_id == current_user.id).all()
    return projects

