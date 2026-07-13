import json
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User, Producto
from app.auth import get_password_hash


def seed_database():
    # Crear tablas
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        # Crear admin si no existe
        admin = db.query(User).filter(User.email == "admin@losportales.com.pe").first()
        if not admin:
            admin = User(
                email="admin@losportales.com.pe",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            print("✅ Usuario admin creado")

        # Seed productos si no hay
        if db.query(Producto).count() == 0:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            seed_path = os.path.join(base_dir, "seed_data.json")

            with open(seed_path, "r", encoding="utf-8") as f:
                productos = json.load(f)

            for p in productos:
                producto = Producto(
                    id=p["id"],
                    nombre=p["nombre"],
                    categoria=p["categoria"],
                    precio=p["precio"],
                    tags=",".join(p.get("tags", [])),
                    imagen=p.get("imagen", ""),
                    stock=p.get("stock", 100)
                )
                db.add(producto)

            print(f"✅ {len(productos)} productos insertados")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Error en seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
