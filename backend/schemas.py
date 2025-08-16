from pydantic import BaseModel

# Proje oluştururken kullanıcıdan alınacak bilgiler
class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

# Kullanıcıya proje bilgisini dönerken kullanılacak yapı
class Project(BaseModel):
    id: int
    name: str
    description: str | None = None
    owner_id: str

    class Config:
        orm_mode = True # SQLAlchemy modelleriyle uyumlu çalışmasını sağlar
