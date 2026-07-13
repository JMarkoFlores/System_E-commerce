from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "TechStore AI API funcionando correctamente"


def test_login_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@losportales.com.pe",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    return data["access_token"]


def test_listar_productos():
    token = test_login_admin()
    response = client.get("/api/productos", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    productos = response.json()
    assert len(productos) > 0


def test_reportes():
    token = test_login_admin()
    response = client.get("/api/reportes/operacional", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    response = client.get("/api/reportes/gestion", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_flujo_compra():
    # Registrar cliente
    res_register = client.post("/api/auth/register", json={
        "email": "cliente@test.com",
        "password": "cliente123",
        "role": "cliente"
    })
    assert res_register.status_code == 200
    token_cliente = res_register.json()["access_token"]

    # Obtener productos
    res_productos = client.get("/api/productos", headers={"Authorization": f"Bearer {token_cliente}"})
    assert res_productos.status_code == 200
    productos = res_productos.json()
    assert len(productos) > 0
    producto = productos[0]

    # Crear pedido
    res_pedido = client.post("/api/pedidos", json={
        "metodo_pago": "yape",
        "items": [{"producto_id": producto["id"], "cantidad": 2}]
    }, headers={"Authorization": f"Bearer {token_cliente}"})
    assert res_pedido.status_code == 200
    data_pedido = res_pedido.json()
    assert data_pedido["total"] == producto["precio"] * 2
    assert len(data_pedido["detalles"]) == 1

    # Verificar mis pedidos
    res_mis = client.get("/api/pedidos/mis-pedidos", headers={"Authorization": f"Bearer {token_cliente}"})
    assert res_mis.status_code == 200
    assert len(res_mis.json()) >= 1

    # Verificar pedidos como admin
    token_admin = test_login_admin()
    res_all = client.get("/api/pedidos", headers={"Authorization": f"Bearer {token_admin}"})
    assert res_all.status_code == 200
    assert len(res_all.json()) >= 1


if __name__ == "__main__":
    test_root()
    test_login_admin()
    test_listar_productos()
    test_reportes()
    test_flujo_compra()
    print("✅ Tests básicos pasaron")
