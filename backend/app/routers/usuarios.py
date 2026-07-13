from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User
from app.schemas import UserResponse, UserCreate, UserUpdate
from app.auth import get_current_admin, get_password_hash

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


@router.get("", response_model=List[UserResponse])
def listar_usuarios(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    return db.query(User).all()


@router.post("", response_model=UserResponse)
def crear_usuario(
    data: UserCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def actualizar_usuario(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.email:
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")
        user.email = data.email

    if data.role:
        user.role = data.role

    if data.password:
        user.password_hash = get_password_hash(data.password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado correctamente"}
