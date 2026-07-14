# AGENTS.md — TechStore AI

> Este archivo resume todo lo que un agente de IA debe saber antes de modificar este proyecto.

---

## 1. Propósito del proyecto

TechStore AI es una tienda e-commerce con sistema de recomendación basado en IA. El sistema está dividido en dos áreas:

- **Área Cliente:** catálogo de productos, recomendaciones con IA, carrito, historial de compras y pasarela de pago simulada.
- **Área Administrador:** dashboard, gestión de productos, gestión de usuarios, gráficas, métricas de IA, reportes operacionales/de gestión y módulo de pruebas.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React | 18.2.0 |
| Routing | React Router DOM | 6.x |
| Build tool | Vite | 4.3.9 |
| Estilos | Tailwind CSS | 3.3.2 |
| HTTP Client | Axios | ^1.x |
| IA (frontend) | TensorFlow.js | 4.22.0 |
| Gráficas | Recharts | 3.6.0 |
| Iconos | Lucide React | 0.263.1 |
| Reportes PDF | jsPDF + jspdf-autotable | ^2.x |
| Reportes Excel | xlsx (SheetJS) | ^0.18 |
| QR | qrcode.react | ^4.x |
| Backend | FastAPI | 0.115.0 |
| Servidor ASGI | Uvicorn | 0.30.6 |
| ORM | SQLAlchemy | 2.0.35 |
| Validación | Pydantic | 2.9.2 |
| Auth | JWT (python-jose) + bcrypt | 3.3.0 / 4.1.2 |
| Base de datos | SQLite | — |
| Lenguaje | JavaScript (ES Modules) / Python 3.13 | `.jsx` / `.py` |

---

## 3. Estructura de archivos

```
Tienda_E-Commerce/
├── backend/                       # FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                # Entry point + CORS + routers
│   │   ├── database.py            # Conexión SQLite + SessionLocal
│   │   ├── models.py              # Tablas SQLAlchemy (User, Producto, Pedido, DetallePedido)
│   │   ├── schemas.py             # Pydantic schemas
│   │   ├── auth.py                # Hash bcrypt, JWT, dependencias de auth
│   │   ├── seed.py                # Seed de admin + 100 productos
│   │   ├── seed_data.json         # Productos migrados desde productos.js
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
│   ├── main.jsx                   # Punto de entrada + BrowserRouter + AuthProvider
│   ├── App.jsx                    # Router principal, estado global, lógica de compras
│   ├── index.css                  # Tailwind + estilos globales
│   ├── contexts/
│   │   └── AuthContext.jsx        # Auth con JWT, login/register/logout
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
│   │   ├── customer/
│   │   │   ├── Login.jsx          # Login/registro dual
│   │   │   ├── Catalogo.jsx       # Catálogo con búsqueda y filtros
│   │   │   ├── Carrito.jsx        # Carrito de compras
│   │   │   ├── Recomendaciones.jsx # Recomendaciones IA
│   │   │   └── Historial.jsx      # Historial de compras
│   │   └── admin/
│   │       ├── AdminDashboard.jsx # Panel principal con KPIs
│   │       ├── AdminProductos.jsx # CRUD productos
│   │       ├── AdminUsuarios.jsx  # CRUD usuarios
│   │       ├── AdminGraficas.jsx  # Gráficas de compras
│   │       ├── AdminMetricas.jsx  # Métricas del modelo IA
│   │       ├── AdminReportes.jsx  # Reportes PDF/Excel
│   │       └── AdminPruebas.jsx   # Vista de pruebas
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

## 4. Arquitectura

### Frontend

- **Auth centralizado:** `AuthContext` maneja JWT, usuario y roles.
- **Routing con React Router DOM:** rutas separadas para cliente (`/catalogo`, `/carrito`, etc.) y admin (`/admin/*`).
- **Estado global de compras:** `App.jsx` centraliza productos, carrito, historial de compras, red neuronal y modal de pago.
- **Comunicación con backend:** `services/api.js` con Axios, interceptor JWT y refresh en 401.

### Backend

- **FastAPI** con SQLAlchemy y SQLite.
- **Auth JWT:** login devuelve token Bearer; endpoints protegidos por `get_current_user`.
- **Roles:** `admin` y `cliente`. Algunos endpoints requieren `get_current_admin`.
- **Seed automático:** al iniciar el backend se crea el admin y los 100 productos.

### Flujo de compra

1. Cliente agrega productos al carrito o hace "Comprar ahora".
2. Se abre `PaymentModal` con Yape/Plin (QR) o Tarjeta de Crédito.
3. Al confirmar pago, se envía `POST /api/pedidos` al backend.
4. Backend crea el pedido, descuenta stock y guarda detalles.
5. Frontend actualiza el historial local y reentrena la red neuronal.

---

## 5. Modelo de datos

### Backend (SQLAlchemy)

- `User`: id, email, password_hash, role, created_at
- `Producto`: id, nombre, categoria, precio, tags (string CSV), imagen, stock
- `Pedido`: id, user_id, total, metodo_pago, estado, fecha
- `DetallePedido`: id, pedido_id, producto_id, cantidad, precio_unitario

### Credencial de admin por defecto

```
Email: admin@losportales.com.pe
Contraseña: admin123
```

### Persistencia

- **Backend SQLite:** fuente de verdad para usuarios, productos y pedidos.
- **localStorage:** guarda el JWT, datos básicos del usuario logueado y la preferencia de tema (`techstore-theme`).

---

## 6. Modo claro / oscuro

La aplicación soporta tema claro y oscuro manual mediante un toggle.

- **Configuración:** `darkMode: 'class'` en `tailwind.config.js`.
- **Tokens semánticos:** definidos como variables CSS en `src/index.css` y expuestos en Tailwind (`background`, `surface`, `foreground`, `muted`, `border`, `input-bg`, `input-border`).
- **Contexto:** `src/contexts/ThemeContext.jsx` maneja el estado, persiste en `localStorage` y aplica/quita la clase `dark` en `<html>`.
- **Toggle:** `src/components/common/ThemeToggle.jsx` usa iconos de sol/luna y está presente en el header del cliente, en el sidebar del administrador y en la pantalla de login.
- **Gráficas:** los componentes con Recharts (`AdminDashboard`, `AdminGraficas`, `AdminMetricas`, `AdminPruebas`) leen el tema desde `useTheme()` y ajustan colores de ejes, grid y tooltips.

Al agregar nuevos componentes o vistas, usar los tokens semánticos y agregar las variantes `dark:` para mantener consistencia en ambos modos.

---

## 7. Recomendaciones con IA

- La red neuronal (`src/utils/RedNeuronal.js`) se entrena en el navegador con TensorFlow.js.
- Usa el historial de compras del cliente.
- El número de recomendaciones es dinámico según la cantidad de compras.
- **No se persiste el modelo:** se entrena desde cero en cada sesión.

---

## 8. Scripts disponibles

### Frontend

```bash
npm run dev      # Servidor de desarrollo en http://localhost:5173
npm run build    # Build de producción en dist/
npm run preview  # Previsualizar build
```

### Backend

```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

### Tests backend

```bash
cd backend
.\venv\Scripts\python.exe -m pytest app/test_api.py -v
```

---

## 9. Convenciones de código

- Componentes React en archivos `.jsx` con funciones.
- Imports relativos.
- Hooks de React para estado y efectos.
- Backend: routers en `app/routers/`, modelos en `app/models.py`, schemas en `app/schemas.py`.

---

## 10. Puntos de atención para desarrolladores

1. **Backend debe estar corriendo** para que el frontend funcione (login, productos, pedidos, etc.).
2. **CORS** configurado para `http://localhost:5173`.
3. Los productos del backend tienen `tags` como string separado por comas; el frontend los normaliza a array en `App.jsx`.
4. La red neuronal usa el catálogo local de `productos.js`; los IDs deben coincidir con los de la BD.
5. El pago es **simulado**; no se conecta con pasarelas reales.
6. El QR de Yape/Plin es generado con texto estático del pedido.

---

## 11. Guía rápida para agentes de IA

### Agregar una nueva vista de cliente

1. Crear componente en `src/views/customer/`.
2. Agregar ruta en `src/App.jsx` dentro del layout cliente.
3. Agregar pestaña en `src/components/customer/CustomerLayout.jsx`.

### Agregar una nueva vista de admin

1. Crear componente en `src/views/admin/`.
2. Agregar ruta en `src/App.jsx` dentro del layout admin.
3. Agregar ítem en el menú de `src/components/admin/AdminLayout.jsx`.

### Modificar productos

- Backend: `backend/app/routers/productos.py` y `backend/app/schemas.py`.
- Frontend admin: `src/views/admin/AdminProductos.jsx`.
- Frontend cliente: `src/views/customer/Catalogo.jsx` y `src/components/customer/ProductCard.jsx`.

### Modificar la pasarela de pago

- Componente: `src/components/common/PaymentModal.jsx`.
- Procesamiento: `procesarPago` en `src/App.jsx`.

### Modificar reportes

- Backend: `backend/app/routers/reportes.py`.
- Frontend: `src/views/admin/AdminReportes.jsx`.

---

## 12. Posibles mejoras futuras

- Persistir modelo de IA entre sesiones.
- Conectar pasarela de pago real.
- Agregar tests de frontend con Vitest + React Testing Library.

---

## 13. Módulo de Pruebas del Modelo de IA

El módulo `AdminPruebas` permite evaluar estadísticamente el modelo de recomendación con Red Neuronal de forma offline.

### Componentes del módulo

| Archivo | Propósito |
|---------|-----------|
| `src/utils/datosPrueba.js` | Generación de usuarios y compras sintéticas con perfiles realistas |
| `src/utils/EvaluacionModelo.js` | Métricas de recomendación, evaluación por usuario e intervalos bootstrap |
| `src/utils/baselines.js` | Modelos baseline: Random, Popularidad, Content-Based, Categoría Favorita |
| `src/utils/testsEstadisticos.js` | t-test pareado, Wilcoxon, McNemar, Cohen's d e intervalos de confianza |
| `src/utils/RedNeuronalWrapper.js` | Adaptador de `RedNeuronal.js` al interfaz de evaluación |
| `src/views/admin/AdminPruebas.jsx` | Interfaz de ejecución, visualización y exportación de resultados |

### Flujo de evaluación

1. Generar usuarios sintéticos con historiales de compra controlados.
2. Dividir las compras de cada usuario en train/test temporal (80/20 por defecto).
3. Entrenar cada recomendador con el train del usuario y predecir top-K productos.
4. Calcular métricas comparando recomendaciones contra el test.
5. Comparar la Red Neuronal contra cada baseline con tests estadísticos.
6. Calcular intervalos de confianza bootstrap al 95%.

### Métricas soportadas

- **Hit Rate@K** — % de usuarios con al menos un acierto en top-K
- **Precision@K** — % de recomendaciones correctas en top-K
- **Recall@K** — % de compras de test recuperadas en top-K
- **F1@K** — media armónica de precision y recall
- **MRR** — ranking inverso medio del primer acierto
- **MAP** — mean average precision
- **NDCG@K** — ganancia acumulada descuadrada normalizada
- **Coverage** — % del catálogo recomendado al menos una vez
- **Diversity** — variedad de categorías en recomendaciones
- **Novelty** — productos fuera de la categoría favorita del usuario

### Tests estadísticos

- **Paired t-test (Student)** — comparación de medias pareadas
- **Wilcoxon signed-rank** — alternativa no paramétrica
- **McNemar's test** — comparación de aciertos/fallos binarios
- **Bootstrap 95% CI** — intervalos de confianza por remuestreo
- **Cohen's d** — tamaño del efecto

### Uso

1. Ir a **Administrador > Pruebas**.
2. Configurar cantidad de usuarios sintéticos, top-K y semilla.
3. Hacer clic en **Ejecutar evaluación**.
4. Revisar tabla comparativa, gráficas, intervalos de confianza y p-values.
5. Exportar resultados a Excel si se desea.

### Notas importantes

- Los datos son **sintéticos**, por lo que los resultados validan la metodología, no el rendimiento real en producción.
- Cada evaluación entrena un modelo de Red Neuronal limpio por usuario para evitar data leakage.
- El tiempo de ejecución depende del número de usuarios; 40 usuarios tardan aproximadamente 20-40 segundos.
- Mejorar manejo de errores y estados de carga.
- Normalizar categorías duplicadas en el catálogo.
- Implementar paginación en listados.

---

## 14. Sistema Bilingüe (ES / EN) — i18n

El sistema soporta español e inglés mediante `react-i18next` + `i18next`.

### Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/i18n/index.js` | Configuración de i18next con detector de idioma y persistencia en `localStorage` |
| `src/locales/es.json` | Traducciones en español |
| `src/locales/en.json` | Traducciones en inglés |
| `src/components/common/LanguageSelector.jsx` | Toggle ES ↔ EN presente en header cliente y sidebar admin |

### Clave de localStorage

El idioma seleccionado se persiste bajo la clave `techstore-lang`.

### Reglas para agentes

1. **Todo texto visible en la UI debe usar `t('...')`** — nunca hardcodear strings en español o inglés.
2. **Agregar ambas traducciones** al agregar un nuevo texto: editar `es.json` **y** `en.json`.
3. **Locale en fechas y números:** usar siempre el idioma activo:
   ```js
   const { t, i18n } = useTranslation();
   const locale = i18n.language?.startsWith('en') ? 'en-US' : 'es-PE';
   // Luego: new Date().toLocaleString(locale)
   ```
4. **Reportes exportados (PDF, Excel, Word):** también deben usar `t()` y el `locale` dinámico para que los encabezados y fechas respeten el idioma seleccionado.
5. **No usar `'es-PE'` hardcodeado** en ningún lugar. Siempre derivar de `i18n.language`.

### Cobertura actual

Todos los views y componentes tienen `useTranslation` integrado:
- Views de cliente: Login, Catálogo, Carrito, Historial, Recomendaciones
- Views de admin: Dashboard, Productos, Usuarios, Gráficas, Métricas, Reportes, **Pruebas**
- Componentes: CustomerLayout, AdminLayout, PaymentModal, ThemeToggle, ProductCard, LanguageSelector, **Chatbot**

---

## 15. Chatbot de Asistencia (TechBot)

TechBot es un asistente virtual con soporte de voz y texto integrado en el sistema, disponible para todos los usuarios autenticados.

### Archivos clave

| Archivo | Propósito |
|---------|-----------|
| `src/components/common/Chatbot.jsx` | Componente completo del chatbot |
| `src/App.jsx` | Monta el `<Chatbot />` globalmente cuando `user` está autenticado |
| `src/locales/es.json` → `chatbot.*` | Traducciones en español del chatbot |
| `src/locales/en.json` → `chatbot.*` | Traducciones en inglés del chatbot |

### Stack del chatbot

| Capa | Tecnología |
|------|-----------|
| LLM | **Groq Cloud** — LLaMA 3.3 70B Versatile |
| API Key | Configurada en `.env` como `VITE_GROQ_API_KEY` |
| Voz entrada | Web Speech API (`SpeechRecognition`) |
| Voz salida | Web Speech Synthesis API (`SpeechSynthesisUtterance`) |
| i18n | Responde en ES o EN según `i18n.language` |

### Características

- **Botón flotante** (bottom-right) con contador de mensajes no leídos
- **Historial conversacional** — envía los últimos 12 mensajes como contexto a Groq
- **System prompt dinámico** — incluye el rol del usuario (cliente/admin) y el idioma activo
- **Modo voz entrada** — activa el micrófono con Web Speech API
- **Modo voz salida (TTS)** — toggle para que el bot responda en voz alta
- **Sugerencias rápidas** — 4 botones de inicio que desaparecen al comenzar la conversación
- **Indicador de escritura** — 3 puntos animados mientras espera respuesta de Groq
- **Render markdown básico** — negritas (`**texto**`) e itálicas (`*texto*`)
- **Limpiar chat** — botón para reiniciar la conversación
- **Soporte dark/light mode**

### System Prompt

El prompt del sistema se construye dinámicamente en `buildSystemPrompt(lang, user)` e incluye:
- Contexto de la tienda (categorías, funcionalidades)
- El email y rol del usuario activo
- Idioma activo (responde en ES o EN automáticamente)

### Reglas para agentes

1. El chatbot no tiene estado persistido; el historial se pierde al recargar.
2. Para cambiar el modelo Groq, modificar la constante `GROQ_MODEL` en `Chatbot.jsx`.
3. Para mejorar el contexto del bot, editar la función `buildSystemPrompt` en `Chatbot.jsx`.
4. La API key está embebida directamente en el frontend (solo válido en demo/desarrollo).
5. El chatbot aparece solo si `user` existe (no en la pantalla de login).

