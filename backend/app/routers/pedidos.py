from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models import Pedido, DetallePedido, Producto, User
from app.schemas import PedidoCreate, PedidoResponse
from app.auth import get_current_user, get_current_admin, get_current_cliente

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])


@router.post("", response_model=PedidoResponse)
def crear_pedido(
    data: PedidoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_cliente)
):
    if not data.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un producto")

    total = 0
    detalles = []

    for item in data.items:
        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not producto:
            raise HTTPException(
                status_code=404,
                detail=f"Producto con id {item.producto_id} no encontrado"
            )
        if producto.stock < item.cantidad:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para {producto.nombre}"
            )

        subtotal = producto.precio * item.cantidad
        total += subtotal

        detalles.append({
            "producto": producto,
            "cantidad": item.cantidad,
            "precio_unitario": producto.precio
        })

        producto.stock -= item.cantidad

    pedido = Pedido(
        user_id=current_user.id,
        total=total,
        metodo_pago=data.metodo_pago,
        fecha=datetime.utcnow()
    )
    db.add(pedido)
    db.flush()

    for d in detalles:
        detalle = DetallePedido(
            pedido_id=pedido.id,
            producto_id=d["producto"].id,
            cantidad=d["cantidad"],
            precio_unitario=d["precio_unitario"]
        )
        db.add(detalle)

    db.commit()
    db.refresh(pedido)
    return pedido


@router.get("/mis-pedidos", response_model=List[PedidoResponse])
def mis_pedidos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_cliente)
):
    pedidos = db.query(Pedido).filter(Pedido.user_id == current_user.id).order_by(Pedido.fecha.desc()).all()
    return pedidos


@router.get("", response_model=List[PedidoResponse])
def listar_pedidos(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    return db.query(Pedido).order_by(Pedido.fecha.desc()).all()
