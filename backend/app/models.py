from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    cliente = "cliente"


class EstadoPedido(str, enum.Enum):
    pagado = "pagado"
    en_proceso = "en_proceso"
    enviado = "enviado"
    entregado = "entregado"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.cliente, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    pedidos = relationship("Pedido", back_populates="usuario", cascade="all, delete-orphan")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    categoria = Column(String(100), nullable=False)
    precio = Column(Float, nullable=False)
    tags = Column(Text, default="")  # separados por coma
    imagen = Column(Text, default="")
    stock = Column(Integer, default=100)

    detalles = relationship("DetallePedido", back_populates="producto")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total = Column(Float, nullable=False)
    metodo_pago = Column(String(50), nullable=False)
    estado = Column(Enum(EstadoPedido), default=EstadoPedido.pagado, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("User", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


class DetallePedido(Base):
    __tablename__ = "detalles_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, default=1, nullable=False)
    precio_unitario = Column(Float, nullable=False)

    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles")
