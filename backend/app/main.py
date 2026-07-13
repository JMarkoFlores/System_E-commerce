from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, productos, pedidos, usuarios, reportes
from app.seed import seed_database

# Crear tablas y seed inicial
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="TechStore AI API",
    description="Backend para tienda e-commerce con recomendaciones por IA",
    version="1.0.0"
)

# CORS para permitir llamadas desde el frontend React en desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(pedidos.router)
app.include_router(usuarios.router)
app.include_router(reportes.router)


@app.get("/")
def root():
    return {"message": "TechStore AI API funcionando correctamente"}
