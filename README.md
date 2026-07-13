# 🛍️ TechStore AI

Tienda e-commerce con sistema de recomendación basado en Inteligencia Artificial. El proyecto está dividido en dos áreas:

- **Área Cliente:** catálogo de productos, recomendaciones con IA, carrito de compras, historial de compras y pasarela de pago simulada.
- **Área Administrador:** dashboard con KPIs, gestión de productos, gestión de usuarios, gráficas, métricas de IA, reportes operacionales/de gestión y módulo de pruebas.

---

## 📚 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Frontend | React | 18.2.0 |
| Routing | React Router DOM | 6.x / 7.x |
| Build tool | Vite | 4.3.9 |
| Estilos | Tailwind CSS | 3.3.2 |
| HTTP Client | Axios | ^1.x |
| IA (frontend) | TensorFlow.js | 4.22.0 |
| Gráficas | Recharts | 3.6.0 |
| Iconos | Lucide React | 0.263.1 |
| Reportes PDF | jsPDF + jspdf-autotable | ^4.x / ^5.x |
| Reportes Excel | xlsx (SheetJS) | ^0.18 |
| Backend | FastAPI | 0.115.0 |
| Servidor ASGI | Uvicorn | 0.30.6 |
| ORM | SQLAlchemy | 2.0.35 |
| Validación | Pydantic | 2.9.2 |
| Auth | JWT (python-jose) + bcrypt | 3.3.0 / 4.1.2 |
| Base de datos | SQLite | — |

---

## ⚙️ Requisitos Previos

- **Node.js** (versión 16 o superior)
- **npm** o **yarn**
- **Python** 3.10 o superior

---

## 🚀 Instalación y Ejecución desde Cero

### 1. Clonar o descargar el proyecto

```bash
cd Tienda_E-Commerce
```

### 2. Instalar dependencias del Frontend

```bash
npm install
```

### 3. Configurar y levantar el Backend

El backend utiliza un entorno virtual de Python.

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\pip.exe install -r requirements.txt

# Windows CMD
# venv\Scripts\pip.exe install -r requirements.txt
```

Levantar el servidor backend:

```bash
# Windows PowerShell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Windows CMD
# venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

El backend quedará disponible en `http://localhost:8000`.

> **Nota:** Si el puerto 8000 está ocupado, usa otro puerto (por ejemplo `--port 8001`). Si cambias el puerto, crea un archivo `.env` en la raíz del proyecto con:
> ```
> VITE_API_URL=http://localhost:8001
> ```

### 4. Levantar el Frontend

En otra terminal, desde la carpeta raíz del proyecto:

```bash
npm run dev
```

El frontend quedará disponible en `http://localhost:5173`.

### 5. Abrir la aplicación

- Navega a `http://localhost:5173`
- Usa las credenciales de abajo para iniciar sesión

---

## 🔐 Credenciales de Autenticación

### Administrador

```
Email:    admin@losportales.com.pe
Contraseña: admin123
```

### Cliente de prueba

```
Email:    cliente@test.com
Contraseña: cliente123
```

> También puedes registrar nuevos clientes desde la pantalla de login.

---

## 🧪 Scripts Disponibles

### Frontend (desde la raíz del proyecto)

```bash
npm run dev      # Servidor de desarrollo en http://localhost:5173
npm run build    # Build de producción en dist/
npm run preview  # Previsualizar build
```

### Backend (desde la carpeta backend)

```bash
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Tests del backend

```bash
cd backend
.\venv\Scripts\python.exe -m pytest app/test_api.py -v
```

---

## 📁 Estructura del Proyecto

```
Tienda_E-Commerce/
├── backend/                       # FastAPI
│   ├── app/
│   │   ├── main.py                # Entry point + CORS + routers
│   │   ├── database.py            # Conexión SQLite + SessionLocal
│   │   ├── models.py              # Tablas SQLAlchemy
│   │   ├── schemas.py             # Pydantic schemas
│   │   ├── auth.py                # Hash bcrypt, JWT, dependencias de auth
│   │   ├── seed.py                # Seed de admin + 100 productos
│   │   ├── seed_data.json         # Productos del catálogo
│   │   ├── test_api.py            # Tests básicos con TestClient
│   │   └── routers/
│   │       ├── auth.py            # Login y registro
│   │       ├── productos.py       # CRUD productos
│   │       ├── pedidos.py         # Crear pedido, listar pedidos
│   │       ├── usuarios.py        # CRUD usuarios (admin)
│   │       └── reportes.py        # Reportes operacional y gestión
│   ├── venv/                      # Entorno virtual Python
│   ├── requirements.txt
│   └── ecommerce.db               # Base de datos SQLite (generada al ejecutar)
├── src/                           # React frontend
│   ├── main.jsx                   # Punto de entrada
│   ├── App.jsx                    # Router principal y estado global
│   ├── index.css                  # Tailwind + estilos globales
│   ├── contexts/
│   │   └── AuthContext.jsx        # Auth con JWT
│   ├── services/
│   │   └── api.js                 # Axios configurado + endpoints
│   ├── components/
│   │   ├── common/
│   │   │   ├── PaymentModal.jsx   # Pasarela Yape/Plin QR + Tarjeta
│   │   │   └── ProductImage.jsx   # Componente unificado de imágenes
│   │   ├── customer/
│   │   │   ├── CustomerLayout.jsx # Header + navegación cliente
│   │   │   └── ProductCard.jsx    # Tarjeta de producto
│   │   └── admin/
│   │       └── AdminLayout.jsx    # Sidebar dashboard admin
│   ├── views/
│   │   ├── customer/              # Vistas del área cliente
│   │   │   ├── Login.jsx
│   │   │   ├── Catalogo.jsx
│   │   │   ├── Carrito.jsx
│   │   │   ├── Recomendaciones.jsx
│   │   │   └── Historial.jsx
│   │   └── admin/                 # Vistas del área administrador
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminProductos.jsx
│   │       ├── AdminUsuarios.jsx
│   │       ├── AdminGraficas.jsx
│   │       ├── AdminMetricas.jsx
│   │       ├── AdminReportes.jsx
│   │       └── AdminPruebas.jsx
│   └── utils/
│       ├── productos.js           # Catálogo local + emojis (usado por IA)
│       └── RedNeuronal.js         # Red neuronal TensorFlow.js
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🧠 Sistema de Recomendación con IA

La red neuronal (`src/utils/RedNeuronal.js`) se entrena en el navegador con **TensorFlow.js** usando el historial de compras del cliente. Genera recomendaciones personalizadas en tiempo real y el número de recomendaciones es dinámico según la cantidad de compras del usuario.

**Arquitectura de la red:**

```
Entrada → Capa Densa (32 neuronas, ReLU) → Dropout (20%) →
Capa Densa (16 neuronas, ReLU) → Capa de Salida (1 neurona, Sigmoid)
```

- **Optimizador:** Adam (learning rate 0.001)
- **Función de pérdida:** MSE
- **Entrenamiento:** 20 épocas, batch size 32

> **Nota:** El modelo no se persiste entre sesiones; se entrena desde cero en cada sesión del navegador.

---

## 💳 Flujo de Compra

1. El cliente agrega productos al carrito o hace "Comprar ahora".
2. Se abre el modal de pago con opciones **Yape/Plin (QR)** o **Tarjeta de Crédito**.
3. Al confirmar el pago, se envía `POST /api/pedidos` al backend.
4. El backend crea el pedido, descuenta stock y guarda los detalles.
5. El frontend actualiza el historial local y reentrena la red neuronal.

> El pago es **simulado**; no se conecta con pasarelas reales.

---

## 📊 Reportes Administrativos

El módulo de reportes permite generar:

- **Reporte Operacional:** ventas por día, productos más vendidos y pedidos recientes.
- **Reporte de Gestión:** total de ingresos, total de pedidos, total de clientes y categorías top.

Ambos reportes pueden exportarse en **PDF**, **Excel** y **Word**.

---

## 🎯 Características Principales

- ✅ Catálogo de productos con búsqueda y filtros
- ✅ Carrito de compras funcional
- ✅ Pasarela de pago simulada (Yape/Plin QR + Tarjeta)
- ✅ Recomendaciones con IA usando TensorFlow.js
- ✅ Historial de compras por cliente
- ✅ Panel de administración con dashboard, gráficas y métricas
- ✅ CRUD de productos y usuarios (admin)
- ✅ Reportes operacionales y de gestión exportables
- ✅ Autenticación con JWT y roles (admin / cliente)
- ✅ Base de datos SQLite con seed automático

---

## ⚠️ Puntos de Atención

1. El **backend debe estar corriendo** para que el frontend funcione correctamente (login, productos, pedidos, etc.).
2. El CORS está configurado para `http://localhost:5173` y `http://localhost:5174`.
3. Los productos del backend tienen `tags` como string separado por comas; el frontend los normaliza a array.
4. La red neuronal usa el catálogo local de `productos.js`; los IDs deben coincidir con los de la BD.
5. Si el puerto 8000 está ocupado, cambia el puerto del backend y actualiza `VITE_API_URL` en un archivo `.env`.

---

## 👨‍💻 Autor

Proyecto educativo de Inteligencia Artificial aplicada al e-commerce.

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
