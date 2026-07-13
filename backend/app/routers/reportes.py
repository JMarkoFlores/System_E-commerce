from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Optional
from app.database import get_db
from app.models import Pedido, DetallePedido, Producto, User
from app.auth import get_current_admin

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


def parse_fecha(fecha_str: Optional[str]):
    if not fecha_str:
        return None
    try:
        return datetime.strptime(fecha_str, "%Y-%m-%d")
    except ValueError:
        return None


@router.get("/operacional")
def reporte_operacional(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    fi = parse_fecha(fecha_inicio)
    ff = parse_fecha(fecha_fin)

    query = db.query(Pedido)
    if fi:
        query = query.filter(Pedido.fecha >= fi)
    if ff:
        query = query.filter(Pedido.fecha < ff + timedelta(days=1))

    pedidos = query.all()

    # Ventas por día
    ventas_por_dia = {}
    for p in pedidos:
        dia = p.fecha.strftime("%Y-%m-%d")
        if dia not in ventas_por_dia:
            ventas_por_dia[dia] = {"total": 0, "pedidos": 0}
        ventas_por_dia[dia]["total"] += p.total
        ventas_por_dia[dia]["pedidos"] += 1

    ventas_por_dia_lista = [
        {"fecha": k, "total": v["total"], "pedidos": v["pedidos"]}
        for k, v in sorted(ventas_por_dia.items())
    ]

    # Productos top

    productos_top = db.query(
        Producto.id,
        Producto.nombre,
        func.sum(DetallePedido.cantidad).label("cantidad"),
        func.sum(DetallePedido.cantidad * DetallePedido.precio_unitario).label("total")
    ).join(DetallePedido, Producto.id == DetallePedido.producto_id)

    if fi or ff:
        productos_top = productos_top.join(Pedido, DetallePedido.pedido_id == Pedido.id)
        if fi:
            productos_top = productos_top.filter(Pedido.fecha >= fi)
        if ff:
            productos_top = productos_top.filter(Pedido.fecha < ff + timedelta(days=1))

    productos_top = productos_top.group_by(Producto.id).order_by(func.sum(DetallePedido.cantidad).desc()).limit(10).all()

    return {
        "ventas_por_dia": ventas_por_dia_lista,
        "productos_top": [
            {"producto_id": p.id, "nombre": p.nombre, "cantidad": p.cantidad or 0, "total": p.total or 0}
            for p in productos_top
        ],
        "pedidos_recientes": [
            {
                "id": p.id,
                "user_id": p.user_id,
                "total": p.total,
                "metodo_pago": p.metodo_pago,
                "estado": p.estado.value,
                "fecha": p.fecha.isoformat(),
                "cliente_email": p.usuario.email
            }
            for p in pedidos[:20]
        ]
    }


@router.get("/gestion")
def reporte_gestion(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    fi = parse_fecha(fecha_inicio)
    ff = parse_fecha(fecha_fin)

    query = db.query(Pedido)
    if fi:
        query = query.filter(Pedido.fecha >= fi)
    if ff:
        query = query.filter(Pedido.fecha < ff + timedelta(days=1))

    pedidos = query.all()

    total_ingresos = sum(p.total for p in pedidos)
    total_pedidos = len(pedidos)
    total_usuarios = db.query(User).filter(User.role == "cliente").count()

    # Categorías top

    categorias = db.query(
        Producto.categoria,
        func.sum(DetallePedido.cantidad).label("cantidad"),
        func.sum(DetallePedido.cantidad * DetallePedido.precio_unitario).label("total")
    ).join(DetallePedido, Producto.id == DetallePedido.producto_id)

    if fi or ff:
        categorias = categorias.join(Pedido, DetallePedido.pedido_id == Pedido.id)
        if fi:
            categorias = categorias.filter(Pedido.fecha >= fi)
        if ff:
            categorias = categorias.filter(Pedido.fecha < ff + timedelta(days=1))

    categorias = categorias.group_by(Producto.categoria).all()

    return {
        "total_ingresos": total_ingresos,
        "total_pedidos": total_pedidos,
        "total_usuarios": total_usuarios,
        "categorias_top": [
            {"categoria": c.categoria, "cantidad": c.cantidad or 0, "total": c.total or 0}
            for c in categorias
        ]
    }
