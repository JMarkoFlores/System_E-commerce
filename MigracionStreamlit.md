# 🚀 Migración del Módulo de Pruebas: De React a Streamlit

Este documento resume las motivaciones, arquitectura y resultados de la migración del motor analítico de validación de modelos de Inteligencia Artificial en el proyecto TechStore AI.

---

## 1. Motivación de la Migración

Originalmente, el ecosistema de pruebas estadísticas se ejecutaba completamente en el navegador del cliente mediante JavaScript (React + TensorFlow.js). A medida que las pruebas se volvían más sofisticadas (comparación con múltiples baselines, cálculo de matrices, simulaciones sintéticas masivas y tests estadísticos pareados), los navegadores web presentaban limitaciones de rendimiento (bloqueos de la UI por *single thread*) y barreras matemáticas (la falta de librerías avanzadas como `scipy`).

Por esto, se decidió migrar el motor a **Python** utilizando **Streamlit**, delegando el análisis pesado a un ecosistema especialmente diseñado para ciencia de datos.

---

## 2. Nueva Arquitectura Desacoplada

La migración ha dividido responsabilidades:
- **Python (Streamlit):** Actúa como el **Motor de Evaluación Pesada**. Simula compras masivas, entrena el modelo base y los recomendadores de Keras iterativamente por cada usuario, calcula complejas métricas de rank (NDCG, MAP) y tests de hipótesis (T-Test, Wilcoxon), y genera gráficas exportables.
- **Node.js/React:** Mantiene un componente puente (`AdminPruebas.jsx`) que asume un rol de **Resumen de Resultados** (*View-only*), mediante el *polling* automático (cada 5s) al archivo `resultados_streamlit.json` generado por el backend, para notificar a los administradores web sin sobrecargar el servidor web.

### 2.1 Archivos Principales del Módulo Python
El directorio `/pruebas_streamlit` agrupa toda la funcionalidad del motor:

| Archivo | Responsabilidad |
|---------|-----------------|
| `app.py` | Entrada de Streamlit. Controla el flujo de UI, la orquestación, el Glosario Interactivo, gráficos Plotly y la Exportación Profesional a PDF y Excel. |
| `data.py` | Algoritmos de generación sintética de usuarios, compras y gustos aleatorios ponderados (`generar_usuarios`, `generar_compras`). |
| `evaluation.py` | Motor matemático. Contiene los modelos base (Random, Popularidad) y las funciones para extraer métricas complejas (*hit_rate, precision, mrr, ndcg, novelty*). |
| `models.py` | Envuelve la creación y entrenamiento de la **Red Neuronal** usando Keras/TensorFlow para compararla en igualdad de condiciones. |

---

## 3. Principales Mejoras y Novedades Implementadas

1. **Rendimiento y Tolerancia Computacional:** Al usarse Pandas, NumPy y SciPy, cálculos como el Test de Wilcoxon y la correlación cruzada son casi instantáneos.
2. **Interpretaciones Dinámicas (Glosario e Insights):** Streamlit ahora genera textos interpretativos de forma inteligente. Si un modelo gana por *Hit Rate* pero pierde en *Diversity*, el módulo redacta párrafos adaptativos describiendo estadísticamente este comportamiento.
3. **Comunicación Continua:** Se abandonó el método obsoleto de cargar archivos JSON manualmente en la web. Ahora Streamlit guarda de manera automática `public/resultados_streamlit.json`, conectando ambos mundos de manera invisible.
4. **Exportaciones Corporativas Avanzadas:** 
    - **PDF:** Utilizando `fpdf2` y `kaleido`. Se desarrollaron plantillas PDF a todo color corporativo, con tablas vectorizadas, texto adaptativo incrustado y gráficos 3D inyectados como imágenes automáticas.
    - **Excel:** Usando `xlsxwriter`. La sábana de datos ahora es un reporte multinivel con pestañas de *Resumen Ejecutivo* integrando las imágenes de las gráficas, y tablas auto-ajustables con formatos numéricos nativos (porcentajes exactos en vez de texto plano).

---

## 4. Cómo usar el nuevo entorno

1. Acceder al directorio: `cd pruebas_streamlit`
2. Instalar el entorno aislado: `pip install -r requirements.txt` *(requiere fpdf2, streamlit, pandas, tensorflow, plotly, kaleido)*
3. Lanzar la interfaz: `streamlit run app.py`

En la barra lateral se configuran los parámetros de la simulación (N° Usuarios Sintéticos, Top-K, y Seed). Pulsar "Ejecutar Evaluación" desencadenará el proceso. Una vez finalizado, los botones de exportación avanzada se habilitarán en la pantalla principal.
