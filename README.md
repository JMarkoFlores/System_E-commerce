# 🛍️ Sistema de Recomendación de Productos con IA

Sistema inteligente de recomendación de productos que utiliza una Red Neuronal Artificial construida con TensorFlow.js para aprender de las preferencias del usuario y generar recomendaciones personalizadas en tiempo real.

---

## 📚 Librerías y Tecnologías Utilizadas

### **Framework Principal**

- **React** (v18.2.0) - Framework de interfaz de usuario para construir componentes interactivos
- **React DOM** (v18.2.0) - Renderización de componentes React en el navegador

### **Inteligencia Artificial**

- **TensorFlow.js** (@tensorflow/tfjs v4.22.0) - Librería de machine learning para JavaScript que permite entrenar y ejecutar modelos de redes neuronales directamente en el navegador

### **Visualización de Datos**

- **Recharts** (v3.6.0) - Librería para crear gráficas interactivas (LineChart, BarChart, RadarChart) que muestra métricas del modelo de IA

### **UI/UX**

- **Lucide React** (v0.263.1) - Librería de iconos modernos para la interfaz de usuario
- **Tailwind CSS** (v3.3.2) - Framework de CSS utilitario para diseño responsivo

### **Herramientas de Desarrollo**

- **Vite** (v4.3.9) - Build tool ultrarrápido para desarrollo y producción
- **@vitejs/plugin-react** (v4.0.0) - Plugin de Vite para soporte de React con Fast Refresh
- **PostCSS** (v8.4.24) - Procesador de CSS
- **Autoprefixer** (v10.4.14) - Plugin de PostCSS para compatibilidad entre navegadores

---

## 🚀 Instalación y Configuración

### **Requisitos Previos**

- Node.js (versión 16 o superior)
- npm o yarn

### **Instalación desde Cero**

1. **Clonar o descargar el proyecto**

   ```bash
   cd SistemaRecomendacionProducto
   ```

2. **Instalar todas las dependencias**

   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**

   ```bash
   npm run dev
   ```

4. **Compilar para producción**

   ```bash
   npm run build
   ```

   Este comando genera una versión optimizada del proyecto en la carpeta `dist/`.

5. **Previsualizar build de producción** (opcional)
   ```bash
   npm run preview
   ```
   Permite probar la versión compilada localmente antes de desplegarla.

---

## 🧠 Red Neuronal con TensorFlow.js

### **Arquitectura de la Red Neuronal**

El sistema utiliza una **Red Neuronal Artificial (RNA)** de tipo **Sequential** implementada con TensorFlow.js. La arquitectura consta de:

```
Entrada → Capa Densa (32 neuronas, ReLU) → Dropout (20%) →
Capa Densa (16 neuronas, ReLU) → Capa de Salida (1 neurona, Sigmoid)
```

**Detalles de cada capa:**

1. **Capa de Entrada:**

   - Recibe vectores de características (features) de dimensión variable según categorías y tags
   - Incluye: one-hot encoding de categorías (7 features) + one-hot encoding de tags (dinámico) + 3 features de precio

2. **Primera Capa Densa (32 neuronas):**

   - Función de activación: `ReLU` (Rectified Linear Unit)
   - Inicializador: `heNormal` (para mejor convergencia)
   - Aprende patrones complejos de las preferencias del usuario

3. **Capa Dropout (20%):**

   - Previene el sobreajuste (overfitting) desactivando aleatoriamente 20% de las neuronas durante el entrenamiento

4. **Segunda Capa Densa (16 neuronas):**

   - Función de activación: `ReLU`
   - Refina los patrones aprendidos

5. **Capa de Salida (1 neurona):**
   - Función de activación: `Sigmoid` (produce valores entre 0 y 1)
   - Representa el **score de recomendación** del producto

**Compilación del Modelo:**

- **Optimizador:** Adam (learning rate: 0.001)
- **Función de pérdida:** MSE (Mean Squared Error)
- **Métrica:** Accuracy

### **Métodos Principales de Predicción**

#### **1. Método `entrenar(historialUsuario)`**

Entrena la red neuronal con el historial de compras del usuario.

**¿Cómo funciona?**

1. **Generación de datos de entrenamiento:**

   - Itera sobre todos los productos del catálogo
   - Extrae características (features) de cada producto usando `extraerFeatures()`
   - Asigna una etiqueta (label):
     - `1.0` si el producto fue comprado
     - `0.0 - 0.7` si no fue comprado (score basado en similitud con productos comprados)

2. **Entrenamiento:**

   - Convierte los datos a tensores de TensorFlow
   - Ejecuta 20 épocas de entrenamiento con batch size de 32
   - Shuffle activado para mejor generalización
   - Usa backpropagation para ajustar los pesos de la red

3. **Resultado:**
   - El modelo aprende a predecir qué productos tienen mayor probabilidad de interesar al usuario
   - Guarda estadísticas de entrenamiento (loss, número de compras, generación)

**Código relevante:**

```javascript
async entrenar(historialUsuario) {
  // Genera features y labels para cada producto
  const xs = tf.tensor2d(datosEntrenamiento);
  const ys = tf.tensor2d(labels, [labels.length, 1]);

  // Entrena el modelo
  await this.modelo.fit(xs, ys, {
    epochs: 20,
    batchSize: 32,
    shuffle: true
  });
}
```

#### **2. Método `recomendar(historialUsuario, n = 6)`**

Genera recomendaciones personalizadas usando el modelo entrenado.

**¿Cómo funciona?**

1. **Filtrado inicial:**

   - Excluye productos ya comprados por el usuario

2. **Predicción con la red neuronal:**

   - Para cada producto no comprado:
     - Extrae sus características usando `extraerFeatures()`
     - Convierte las features a un tensor
     - Usa `modelo.predict()` para obtener un score entre 0 y 1
     - Limpia los tensores de memoria

3. **Ordenamiento:**

   - Ordena productos por score descendente (mayor score = mayor relevancia)

4. **Diversificación:**

   - Aplica un algoritmo de balanceo para evitar recomendar solo de una categoría
   - Limita máximo 2 productos por categoría en las primeras recomendaciones

5. **Resultado:**
   - Retorna los top `n` productos recomendados con sus scores y razones

**Código relevante:**

```javascript
async recomendar(historialUsuario, n = 6) {
  for (const producto of productosNoComprados) {
    const features = this.extraerFeatures(producto, historialUsuario);

    // ¡PREDICCIÓN CON LA RED NEURONAL!
    const tensorInput = tf.tensor2d([features]);
    const prediccion = this.modelo.predict(tensorInput);
    const score = (await prediccion.data())[0];

    recomendacionesConScore.push({ ...producto, score });
  }

  // Ordenar y balancear
  return recomendacionesBalanceadas.slice(0, n);
}
```

#### **3. Método `extraerFeatures(producto, historialUsuario)`**

Convierte un producto en un vector numérico que la red neuronal puede procesar.

**Features extraídas:**

- **Categoría (one-hot encoding):** 7 valores binarios (1 si coincide, 0 si no)
- **Tags (one-hot encoding):** N valores binarios según tags del catálogo
- **Precio normalizado:** Precio dividido entre 2500 (normalización)
- **Diferencia de precio:** Distancia del precio del producto con el promedio de compras
- **Rango de precio:** 1 si está dentro del rango de precios del historial, 0 si no

---

## 🎨 Generación de Imágenes

### **Librería Utilizada**

El sistema **NO utiliza una librería externa para generar imágenes artificiales**. En su lugar, utiliza un sistema de **imágenes estáticas** combinado con **emojis decorativos** como fallback.

### **Sistema de Gestión de Imágenes**

#### **Método Principal: `obtenerRutaImagen()`**

**Ubicación:** [src/views/Recomendaciones.jsx](src/views/Recomendaciones.jsx)

**¿Cómo funciona?**

```javascript
const obtenerRutaImagen = () => {
  try {
    // Utiliza import.meta.url de Vite para resolver rutas dinámicas
    return new URL(`../img/${producto.imagen}`, import.meta.url).href;
  } catch (error) {
    return null;
  }
};
```

**Funcionamiento:**

1. **Vite's `import.meta.url`:**

   - Es una característica de ES Modules que proporciona la URL del módulo actual
   - Permite importar imágenes de forma dinámica en tiempo de construcción

2. **Resolución de rutas:**
   - Construye la ruta completa a la imagen desde `src/img/`
   - Si la imagen existe, retorna la URL procesada por Vite
   - Si falla, retorna `null` y se usa el fallback

#### **Componente: `ImagenProductoRecomendado`**

Renderiza la imagen del producto con efectos visuales.

**Características:**

- **Manejo de errores:** Si la imagen falla al cargar (`onError`), muestra un emoji
- **Efectos hover:** Zoom y overlay con gradientes
- **Fallback elegante:** Usa emojis de `EMOJI_CATEGORIAS` si no hay imagen
- **Optimización:** Las imágenes se cargan como `object-contain` para mantener proporciones

**Código simplificado:**

```jsx
const ImagenProductoRecomendado = ({ producto }) => {
  const [imagenError, setImagenError] = useState(false);

  return (
    <div className="relative h-40 bg-gradient-to-br from-purple-50 to-blue-50">
      {rutaImagen && !imagenError ? (
        <img
          src={rutaImagen}
          alt={producto.nombre}
          onError={() => setImagenError(true)}
        />
      ) : (
        <div className="text-6xl">
          {EMOJI_CATEGORIAS[producto.categoria] || "📦"}
        </div>
      )}
    </div>
  );
};
```

**Librerías involucradas:**

- **Vite:** Procesa y optimiza las imágenes durante el build
- **React:** Maneja el estado de carga de imágenes
- **Tailwind CSS:** Proporciona las clases de estilo y efectos visuales

---

## 📊 Sistema de Métricas

### **Librería Principal**

- **Recharts** - Para visualizar las métricas en gráficas interactivas

### **Métodos Principales de Cálculo de Métricas**

Todas las métricas se calculan en el componente `Metricas.jsx` usando un `useMemo` hook para optimización.

#### **1. Precision@K**

**Método:** Bloque de código en `useMemo`

**¿Qué mide?**
Mide qué tan relevantes son las recomendaciones basándose en similitud con compras recientes.

**¿Cómo se calcula?**

```javascript
// Analiza últimas 5 compras
const ultimasCompras = historialCompras.slice(-5);
const categoriasRecientes = ultimasCompras.map(c => c.categoria);
const tagsRecientes = new Set(ultimasCompras.flatMap(c => c.tags));

// Evalúa top 6 recomendaciones
recomendaciones.slice(0, 6).forEach(rec => {
  let puntos = 0;
  if (categoriasRecientes.includes(rec.categoria)) puntos += 0.5;
  if (rec.tags coinciden con tagsRecientes) puntos += 0.5;
  puntajeRelevancia += puntos;
});

const precisionAtK = (puntajeRelevancia / 6) * 100;
```

**Interpretación:**

- 0-40%: Baja relevancia
- 40-70%: Relevancia moderada
- 70-100%: Alta relevancia (recomendaciones muy alineadas con preferencias)

---

#### **2. Hit Rate (Tasa de Aciertos)**

**¿Qué mide?**
Porcentaje de recomendaciones con score alto (por encima de un umbral).

**¿Cómo se calcula?**

```javascript
// Calcula score promedio
const scorePromedio =
  recomendaciones.reduce((sum, r) => sum + r.score, 0) / recomendaciones.length;

// Define umbral dinámico (70% del promedio, mínimo 0.2)
const umbral = Math.max(scorePromedio * 0.7, 0.2);

// Cuenta recomendaciones por encima del umbral
const recomendacionesAltas = recomendaciones.filter(
  (r) => r.score > umbral
).length;
const hitRate = (recomendacionesAltas / recomendaciones.length) * 100;
```

**Interpretación:**
Mide la "confianza" del modelo. Un Hit Rate alto significa que el modelo está seguro de sus recomendaciones.

---

#### **3. Diversidad**

**¿Qué mide?**
Variedad de categorías en las recomendaciones (evita "burbuja de filtro").

**¿Cómo se calcula?**

```javascript
const categoriasRec = new Set(recomendaciones.map((r) => r.categoria));
const diversidad = (categoriasRec.size / 7) * 100; // 7 = total de categorías
```

**Interpretación:**

- 0-30%: Baja diversidad (pocas categorías)
- 30-60%: Diversidad moderada
- 60-100%: Alta diversidad (explora múltiples categorías)

---

#### **4. Relevancia**

**¿Qué mide?**
Similitud entre recomendaciones y categorías compradas recientemente.

**¿Cómo se calcula?**

```javascript
const categoriasCompradas = historialCompras.slice(-10).map((c) => c.categoria);
const recRelevantes = recomendaciones.filter((r) =>
  categoriasCompradas.includes(r.categoria)
).length;
const relevancia = (recRelevantes / recomendaciones.length) * 100;
```

**Interpretación:**
Indica qué tan bien las recomendaciones se alinean con el comportamiento reciente del usuario.

---

#### **5. Accuracy del Modelo**

**¿Qué mide?**
Precisión del modelo de IA basado en la función de pérdida (loss) del entrenamiento.

**¿Cómo se calcula?**

```javascript
const lossActual =
  estadisticasIA?.historialEntrenamiento?.slice(-1)[0]?.loss || 1;
const accuracy = Math.max(0, Math.min(100, (1 - lossActual) * 100));
```

**Interpretación:**

- Loss bajo = Accuracy alto = Modelo bien entrenado
- Loss alto = Accuracy bajo = Modelo necesita más datos o épocas

---

#### **6. Score Promedio**

**¿Qué mide?**
Confianza promedio del modelo en sus recomendaciones.

**¿Cómo se calcula?**

```javascript
const scorePromedio =
  recomendaciones.reduce((sum, r) => sum + r.score, 0) / recomendaciones.length;
const scorePromedioDisplay = scorePromedio * 100;
```

**Interpretación:**
Score promedio entre 0-100%. Más alto = El modelo tiene alta confianza en las recomendaciones.

---

#### **7. Novedad**

**¿Qué mide?**
Capacidad del sistema para recomendar productos fuera de la categoría favorita (evita repetición).

**¿Cómo se calcula?**

```javascript
// Encuentra categoría más comprada
const categoriaFavorita = historialCompras
  .reduce((acc, c) => {
    acc.set(c.categoria, (acc.get(c.categoria) || 0) + 1);
    return acc;
  }, new Map())
  .sort((a, b) => b[1] - a[1])[0]?.[0];

// Cuenta recomendaciones de otras categorías
const recNovedosas = recomendaciones.filter(
  (r) => r.categoria !== categoriaFavorita
).length;
const novedad = (recNovedosas / recomendaciones.length) * 100;
```

**Interpretación:**
Alta novedad = El sistema te saca de tu zona de confort y te muestra cosas nuevas.

---

#### **8. Cobertura**

**¿Qué mide?**
Porcentaje del catálogo cubierto por las recomendaciones.

**¿Cómo se calcula?**

```javascript
const cobertura = (categoriasRec.size / 7) * 100;
```

**Interpretación:**
Similar a diversidad. Mide qué tan amplio es el espacio de recomendaciones.

---

#### **9. Confianza del Modelo**

**¿Qué mide?**
Diferencia entre el score más alto y más bajo (dispersión).

**¿Cómo se calcula?**

```javascript
const scores = recomendaciones.map((r) => r.score || 0);
const maxScore = Math.max(...scores);
const minScore = Math.min(...scores);
const confianza = ((maxScore - minScore) / maxScore) * 100;
```

**Interpretación:**

- Alta confianza: El modelo distingue claramente entre buenas y malas recomendaciones
- Baja confianza: Scores similares, menos certeza del modelo

---

#### **10. Evolución del Loss**

**¿Qué mide?**
Histórico del error de entrenamiento a lo largo de las generaciones.

**¿Cómo se obtiene?**

```javascript
const evolucionLoss =
  estadisticasIA?.historialEntrenamiento?.slice(-5).map((h, idx) => ({
    generacion: `Gen ${h.generacion}`,
    loss: (h.loss * 100).toFixed(2),
    compras: h.numCompras,
  })) || [];
```

**Interpretación:**
Se visualiza en un gráfico de líneas (LineChart de Recharts). Loss decreciente = Modelo mejorando con el tiempo.

---

### **Visualización de Métricas**

Las métricas se visualizan usando componentes de **Recharts**:

1. **RadarChart:** Muestra Precisión, Relevancia, Diversidad, Novedad, Cobertura y Accuracy en un gráfico de radar
2. **LineChart:** Muestra la evolución del loss a través de las generaciones de entrenamiento
3. **Tarjetas de métricas:** Displays individuales con iconos de Lucide React

---

## 🎯 Flujo del Sistema

1. **Inicio:** Usuario navega el catálogo de productos
2. **Compra:** Usuario agrega productos al carrito y compra
3. **Aprendizaje:** La red neuronal se entrena con el historial de compras usando `entrenar()`
4. **Predicción:** El modelo genera recomendaciones personalizadas usando `recomendar()`
5. **Evaluación:** El sistema calcula métricas para evaluar la calidad de las recomendaciones
6. **Mejora continua:** Con cada nueva compra, el modelo se reentrena y mejora

---

## 📁 Estructura del Proyecto

```
Sistema de Recomendación
├── src/
│   ├── components/        # Componentes reutilizables (Header, ProductCard, etc.)
│   ├── views/            # Vistas principales (Catálogo, Recomendaciones, Métricas, etc.)
│   ├── utils/            # Lógica de negocio
│   │   ├── RedNeuronal.js   # Implementación de la red neuronal con TensorFlow.js
│   │   └── productos.js     # Datos del catálogo
│   ├── img/              # Imágenes de productos
│   ├── App.jsx           # Componente principal
│   └── main.jsx          # Punto de entrada de React
├── index.html            # HTML base
├── package.json          # Dependencias y scripts
├── vite.config.js        # Configuración de Vite
├── tailwind.config.js    # Configuración de Tailwind CSS
└── README.md             # Este archivo
```

---

## 🔧 Scripts Disponibles

```bash
npm run dev      # Inicia servidor de desarrollo (http://localhost:5173)
npm run build    # Compila el proyecto para producción (carpeta dist/)
npm run preview  # Previsualiza la versión compilada
```

---

## 🤖 Características de la IA

- ✅ **Aprendizaje automático:** Red neuronal que aprende de cada compra
- ✅ **Predicciones en tiempo real:** Inferencia directamente en el navegador
- ✅ **Mejora continua:** El modelo se reentrena con cada nueva compra
- ✅ **Balanceo de diversidad:** Evita recomendar solo una categoría
- ✅ **Métricas avanzadas:** 10 métricas para evaluar el rendimiento del modelo
- ✅ **Sin servidor:** Todo el procesamiento ocurre en el cliente (TensorFlow.js)

---

## 👨‍💻 Autor

Sistema desarrollado como proyecto educativo de Inteligencia Artificial aplicada al e-commerce.

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
