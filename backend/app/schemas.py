from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from app.models import UserRole, EstadoPedido


# ============== Usuario ==============
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.cliente


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============== Auth ==============
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============== Producto ==============
class ProductoBase(BaseModel):
    nombre: str
    categoria: str
    precio: float
    tags: Optional[str] = ""
    imagen: Optional[str] = ""
    stock: Optional[int] = 100


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    precio: Optional[float] = None
    tags: Optional[str] = None
    imagen: Optional[str] = None
    stock: Optional[int] = None


class ProductoResponse(ProductoBase):
    id: int

    class Config:
        from_attributes = True


# ============== Pedido ==============
class DetallePedidoCreate(BaseModel):
    producto_id: int
    cantidad: int = 1


class PedidoCreate(BaseModel):
    metodo_pago: str
    items: List[DetallePedidoCreate]


class DetallePedidoResponse(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    producto: ProductoResponse

    class Config:
        from_attributes = True


class PedidoResponse(BaseModel):
    id: int
    user_id: int
    total: float
    metodo_pago: str
    estado: EstadoPedido
    fecha: datetime
    detalles: List[DetallePedidoResponse]

    class Config:
        from_attributes = True


# ============== Reportes ==============
class ReporteFiltro(BaseModel):
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None


class VentaPorDia(BaseModel):
    fecha: str
    total: float
    pedidos: int


class ProductoTop(BaseModel):
    producto_id: int
    nombre: str
    cantidad: int
    total: float


class CategoriaTop(BaseModel):
    categoria: str
    cantidad: int
    total: float


class ReporteOperacional(BaseModel):
    ventas_por_dia: List[VentaPorDia]
    productos_top: List[ProductoTop]
    pedidos_recientes: List[PedidoResponse]


class ReporteGestion(BaseModel):
    total_ingresos: float
    total_pedidos: int
    total_usuarios: int
    categorias_top: List[CategoriaTop]
