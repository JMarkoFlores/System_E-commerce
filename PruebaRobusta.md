# Pruebas Estadísticas Robustas para Validar el Modelo de Recomendación

Este documento explica paso a paso las pruebas estadísticas robustas implementadas en el módulo **Administrador > Pruebas** para validar el modelo de recomendación con Red Neuronal de TechStore AI.

---

## 1. ¿Por qué necesitamos pruebas estadísticas robustas?

El modelo de recomendación de TechStore AI es una Red Neuronal entrenada con TensorFlow.js en el navegador. Antes de confiar en sus recomendaciones, debemos responder preguntas como:

- ¿El modelo realmente aprende patrones útiles o solo memoriza?
- ¿Es mejor que recomendar al azar o por popularidad?
- ¿Las diferencias observadas entre modelos son reales o producto del azar?
- ¿Qué tan seguros estamos de las métricas que reportamos?

Sin pruebas estadísticas, cualquier métrica es solo un número aislado. Las pruebas robustas nos permiten:

- Comparar el modelo contra baselines de forma rigurosa.
- Cuantificar la incertidumbre con intervalos de confianza.
- Determinar si una mejora es estadísticamente significativa.
- Evitar conclusiones falsas causadas por datos de entrenamiento sesgados.

---

## 2. ¿Qué problema teníamos antes?

El modelo original tenía varias debilidades metodológicas:

| Problema | Consecuencia |
|----------|--------------|
| No había división train/test | El modelo se evaluaba con los mismos datos con los que entrenaba (overfitting) |
| No había baselines | No se sabía si el modelo era mejor que métodos simples |
| Las métricas eran estimaciones puntuales | No se conocía la variabilidad ni la confianza |
| El "accuracy" se calculaba como `(1 - loss)` | No era accuracy real de clasificación |
| No había tests de significancia | No se podía afirmar que una métrica fuera mejor que otra |

---

## 3. Enfoque general: evaluación offline con datos sintéticos

Dado que el proyecto no cuenta con miles de usuarios reales, elegimos una estrategia práctica y rigurosa:

> **Evaluación offline con datos sintéticos generados + comparación contra baselines + tests estadísticos + intervalos de confianza.**

### ¿Por qué offline?

Porque no tenemos tráfico real suficiente para hacer A/B testing. La evaluación offline usa datos históricos (o sintéticos) y permite iterar rápido.

### ¿Por qué datos sintéticos?

Porque no disponemos de un dataset grande de compras reales. Los datos sintéticos nos permiten:

- Controlar las preferencias de cada usuario.
- Conocer el "ground truth" (qué debería gustarle a cada usuario).
- Generar suficientes muestras para aplicar tests estadísticos válidos.
- Reproducir los experimentos con una semilla fija.

> **Importante:** los resultados con datos sintéticos validan la **metodología** del modelo, no su rendimiento exacto en producción con usuarios reales.

---

## 4. Paso 1: Generación de datos sintéticos

### Archivo: `src/utils/datosPrueba.js`

Creamos un generador de usuarios ficticios. Cada usuario tiene:

1. **Perfil de preferencias:** pesos sobre cada categoría de producto.
2. **Tags preferidos:** ciertos tags atraen más al usuario.
3. **Rango de precio:** algunos usuarios compran productos económicos, otros premium.
4. **Historial de compras:** secuencia temporal de productos comprados.

### ¿Cómo se generan las compras?

Para cada compra de un usuario:

- Con probabilidad 80%, el producto se elige de acuerdo a su perfil (categorías y tags preferidos, dentro de su rango de precio).
- Con probabilidad 20%, el producto se elige al azar como **ruido realista** (los humanos a veces compran cosas inesperadas).
- Se penalizan ligeramente los productos ya comprados para evitar repetición excesiva.
- Las compras se ordenan cronológicamente.

### ¿Por qué esto es robusto?

- Refleja comportamiento humano real: preferencias + imprevisibilidad.
- Permite medir si el modelo descubre las preferencias reales del usuario.
- La dimensión temporal permite hacer splits train/test realistas.

---

## 5. Paso 2: División train/test temporal

### Archivo: `src/utils/datosPrueba.js` y `src/utils/EvaluacionModelo.js`

Para cada usuario, dividimos sus compras cronológicamente:

- **Train (80%):** compras más antiguas. El modelo aprende de ellas.
- **Test (20%):** compras más recientes. Verificamos si el modelo las recomienda.

### ¿Por qué división temporal?

Porque en un e-commerce real, el modelo se entrena con compras pasadas y debe predecir compras futuras. Una división aleatoria rompería esta lógica temporal y daría una estimación demasiado optimista.

### Ejemplo

```
Compras del usuario: [Laptop, Mouse, Teclado, Monitor, Silla]
Train:  [Laptop, Mouse, Teclado]  (80%)
Test:   [Monitor, Silla]          (20%)
```

El modelo entrena con Laptop, Mouse y Teclado, y evaluamos si recomienda Monitor y Silla.

---

## 6. Paso 3: Entrenamiento del modelo por usuario

### Archivo: `src/utils/RedNeuronalWrapper.js`

Para evitar que el modelo aprenda información de otros usuarios (**data leakage**), creamos un wrapper que:

1. **Reinicia la Red Neuronal** antes de cada usuario (pesos aleatorios limpios).
2. **Entrena** el modelo solo con el historial de entrenamiento de ese usuario.
3. **Genera recomendaciones** de productos que el usuario no ha comprado aún.

### ¿Por qué reiniciar el modelo por usuario?

Si entrenáramos un solo modelo con todos los usuarios y luego evaluáramos, el modelo "vería" información de usuarios futuros. Reiniciar por usuario garantiza que la evaluación sea justa: el modelo solo conoce el pasado de ese usuario específico.

---

## 7. Paso 4: Modelos baseline para comparar

### Archivo: `src/utils/baselines.js`

Para saber si la Red Neuronal es realmente buena, la comparamos contra modelos simples:

| Baseline | Descripción | ¿Por qué incluirlo? |
|----------|-------------|---------------------|
| **Random** | Recomienda productos aleatorios no comprados | Umbral mínimo: cualquier modelo serio debe superar al azar |
| **Popularidad** | Recomienda los productos más comprados globalmente | Modelo comercial simple y frecuentemente usado |
| **Content-Based (coseno)** | Recomienda productos similares por categoría y tags al historial del usuario | Modelo clásico de recomendación basado en contenido |
| **Categoría Favorita** | Recomienda productos de la categoría más comprada del usuario | Modelo muy simple pero a menudo efectivo |

### ¿Por qué comparar con baselines?

Una métrica alta no significa nada si un modelo trivial la alcanza. Solo superando a los baselines podemos afirmar que la Red Neuronal aporta valor.

---

## 8. Paso 5: Métricas de recomendación calculadas

### Archivo: `src/utils/EvaluacionModelo.js`

Para cada usuario calculamos métricas comparando las recomendaciones del modelo contra las compras de test. Luego promediamos sobre todos los usuarios.

### 8.1 Hit Rate@K

**Fórmula por usuario:**

```
Hit Rate@K = 1 si al menos una compra de test está en el top-K, 0 si no
```

**Qué mide:** probabilidad de que el modelo acierte al menos una vez dentro de las K recomendaciones.

**Por qué importa:** es la métrica más directa para un e-commerce. Si el usuario ve 10 recomendaciones, ¿al menos una le interesa?

### 8.2 Precision@K

**Fórmula por usuario:**

```
Precision@K = (productos de test recomendados en top-K) / K
```

**Qué mide:** de las K recomendaciones, ¿qué porcentaje fueron realmente compradas?

**Por qué importa:** mide la calidad del top recomendado. Alta precision significa pocas recomendaciones irrelevantes.

### 8.3 Recall@K

**Fórmula por usuario:**

```
Recall@K = (productos de test recomendados en top-K) / (total de compras de test)
```

**Qué mide:** de todas las compras futuras del usuario, ¿qué porcentaje recuperó el modelo?

**Por qué importa:** mide la capacidad de recuperar items relevantes.

### 8.4 F1@K

**Fórmula:**

```
F1@K = 2 * (Precision * Recall) / (Precision + Recall)
```

**Qué mide:** balance entre precision y recall.

**Por qué importa:** evita optimizar solo una de las dos métricas.

### 8.5 MRR (Mean Reciprocal Rank)

**Fórmula por usuario:**

```
MRR = 1 / (posición del primer acierto)
```

Si no hay aciertos, MRR = 0.

**Qué mide:** qué tan arriba aparece el primer producto relevante.

**Por qué importa:** en interfaces de e-commerce, los primeros puestos son los más visibles.

### 8.6 MAP (Mean Average Precision)

**Fórmula por usuario:**

```
AP = promedio de Precision@i para cada posición i donde hay un acierto
```

**Qué mide:** precisión promedio ponderada por posición.

**Por qué importa:** premia que los productos relevantes aparezcan en posiciones altas.

### 8.7 NDCG@K (Normalized Discounted Cumulative Gain)

**Fórmula:**

```
DCG@K  = suma de 1 / log2(posición + 1) para cada acierto
IDCG@K = DCG ideal (todos los relevantes en las primeras posiciones)
NDCG@K = DCG / IDCG
```

**Qué mide:** calidad del ranking considerando que posiciones altas valen más.

**Por qué importa:** es una de las métricas más completas para evaluar rankings.

### 8.8 Coverage

**Fórmula:**

```
Coverage = (productos del catálogo recomendados al menos una vez / total de productos) * 100
```

**Qué mide:** porcentaje del catálogo que el modelo es capaz de recomendar.

**Por qué importa:** un modelo que solo recomienda los mismos productos populares tiene baja coverage y puede causar "burbuja de filtro".

### 8.9 Diversity

**Fórmula:**

```
Diversity = 1 - (promedio de similitud entre pares de recomendaciones)
```

Usamos similitud basada en categoría: dos productos de la misma categoría tienen similitud 1.

**Qué mide:** variedad de categorías en las recomendaciones.

**Por qué importa:** alta diversidad evita recomendar siempre lo mismo y ayuda al descubrimiento.

### 8.10 Novelty

**Fórmula:**

```
Novelty = (recomendaciones fuera de la categoría favorita del usuario) / K
```

**Qué mide:** capacidad de recomendar productos diferentes a lo que el usuario ya compra habitualmente.

**Por qué importa:** permite descubrir nuevos intereses.

---

## 9. Paso 6: Tests estadísticos

### Archivo: `src/utils/testsEstadisticos.js`

Una vez que tenemos una métrica por usuario para cada modelo, aplicamos tests estadísticos para comparar la Red Neuronal contra cada baseline.

### 9.1 Paired t-test (t-test de Student pareado)

**Cuándo se usa:** para comparar dos modelos sobre los mismos usuarios.

**Hipótesis:**

- **H0 (nula):** no hay diferencia entre la Red Neuronal y el baseline.
- **H1 (alternativa):** sí hay diferencia.

**Cómo funciona:**

1. Para cada usuario, calculamos la diferencia entre la métrica de la Red Neuronal y la del baseline.
2. Calculamos la media y desviación estándar de esas diferencias.
3. Calculamos el estadístico t:

```
t = media_diferencias / (desviacion_diferencias / sqrt(n))
```

4. Obtenemos el p-value. Si **p < 0.05**, rechazamos H0: la diferencia es estadísticamente significativa.

**Por qué es robusto:** asume normalidad de las diferencias, que es razonable con suficientes usuarios (n ≥ 30).

### 9.2 Wilcoxon signed-rank test

**Cuándo se usa:** alternativa no paramétrica al t-test. No asume normalidad.

**Cómo funciona:**

1. Calcula las diferencias por usuario.
2. Ordena las diferencias por valor absoluto y les asigna rangos.
3. Suma los rangos de las diferencias positivas y de las negativas.
4. Compara las sumas para obtener el estadístico W y el p-value.

**Por qué es robusto:** menos sensible a outliers que el t-test. Si los datos no son normales, Wilcoxon es más confiable.

### 9.3 McNemar's test

**Cuándo se usa:** para comparar dos clasificadores binarios (acierto/fallo) sobre los mismos ejemplos.

**Cómo funciona:** construye una tabla de contingencia:

| | Baseline acierta | Baseline falla |
|---|---|---|
| **Red Neuronal acierta** | a | b |
| **Red Neuronal falla** | c | d |

El test se enfoca en **b** y **c** (discrepancias). Si son muy diferentes, los modelos no se comportan igual.

**Por qué es robusto:** detecta si dos modelos cometen errores en los mismos casos o en casos diferentes.

### 9.4 Cohen's d

**Cuándo se usa:** para medir el **tamaño del efecto**, no solo la significancia.

**Fórmula:**

```
d = media_diferencias / desviacion_diferencias
```

**Interpretación:**

| |d| | Interpretación |
|---|---|---|
| < 0.2 | Efecto insignificante |
| 0.2 - 0.5 | Efecto pequeño |
| 0.5 - 0.8 | Efecto mediano |
| > 0.8 | Efecto grande |

**Por qué importa:** un p-value bajo puede ocurrir con muchos datos aunque la diferencia sea trivial. Cohen's d nos dice si la mejora es realmente importante.

### 9.5 Intervalos de confianza bootstrap al 95%

**Cuándo se usan:** para reportar la incertidumbre de cada métrica.

**Cómo funciona:**

1. Tenemos una métrica por usuario (por ejemplo, Hit Rate@K de cada uno).
2. Remuestreamos esos valores con reemplazo 1000 veces, calculando la media en cada remuestreo.
3. Tomamos los percentiles 2.5 y 97.5 de esas medias.

**Resultado:** un intervalo [inferior, superior] donde, con 95% de confianza, se encuentra la media real de la métrica.

**Por qué es robusto:** no asume ninguna distribución específica y funciona bien con muestras medianas.

---

## 10. Flujo completo de la evaluación

Cuando haces clic en **"Ejecutar evaluación"** en `AdminPruebas.jsx`, ocurre lo siguiente:

```
1. Generar N usuarios sintéticos (default: 40)
   ↓
2. Para cada usuario:
   a. Dividir compras en train (80%) y test (20%) por fecha
   b. Entrenar modelo con train
   c. Generar top-K recomendaciones
   d. Calcular métricas contra test
   ↓
3. Promediar métricas por usuario
   ↓
4. Calcular intervalos de confianza bootstrap
   ↓
5. Comparar Red Neuronal vs cada baseline con t-test y Wilcoxon
   ↓
6. Mostrar tablas, gráficas y exportar a Excel
```

Cada modelo se evalúa con exactamente los mismos usuarios y la misma división train/test, lo que garantiza una comparación justa.

---

## 11. Interpretación de los resultados

### Tabla comparativa

Muestra las métricas promedio de la Red Neuronal y de cada baseline. La Red Neuronal debería destacar en:

- Hit Rate@K
- Precision@K
- Recall@K
- NDCG@K
- MAP

Si no supera a Content-Based o Popularidad, debemos revisar la arquitectura o los features.

### Intervalos de confianza

Si el intervalo [inferior, superior] es estrecho, la métrica es estable. Si es ancho, necesitamos más usuarios o el modelo es muy variable.

### Tests estadísticos

Para cada métrica y cada baseline verás:

- **t-statistic:** magnitud de la diferencia estandarizada.
- **p-value:** probabilidad de observar esa diferencia si los modelos fueran iguales.
- **Significativo:** `Sí` si p-value < 0.05.

**Regla práctica:**

- p < 0.05 → la diferencia es estadísticamente significativa.
- p < 0.01 → muy significativa.
- p < 0.001 → altamente significativa.
- p ≥ 0.05 → no hay evidencia suficiente de diferencia.

### Cohen's d

Aunque un test sea significativo, Cohen's d te dice si la mejora vale la pena:

- d pequeño (< 0.5) → mejora real pero modesta.
- d mediano/grande (≥ 0.5) → mejora prácticamente relevante.

---

## 12. Limitaciones y consideraciones

1. **Datos sintéticos:** validan metodología, no rendimiento real. Para validación real se necesitan datos de usuarios reales.
2. **Sin A/B testing:** la evaluación offline no mide efectos como cambios en el comportamiento del usuario al ver diferentes recomendaciones.
3. **Feedback implícito:** solo usamos compras. No contamos con ratings explícitos ni con información de clics/vistas.
4. **Tiempo de cómputo:** con 40 usuarios, la evaluación puede tardar 20-60 segundos porque la Red Neuronal se entrena una vez por usuario.
5. **Aproximaciones estadísticas:** los p-values usan aproximación normal, válida para n ≥ 30. Wilcoxon es la alternativa no paramétrica.

---

## 13. Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `src/utils/datosPrueba.js` | Generación de usuarios y compras sintéticas |
| `src/utils/EvaluacionModelo.js` | Métricas de recomendación y evaluación por usuario |
| `src/utils/baselines.js` | Modelos baseline para comparación |
| `src/utils/testsEstadisticos.js` | t-test, Wilcoxon, McNemar, Cohen's d, bootstrap CI |
| `src/utils/RedNeuronalWrapper.js` | Adaptador de la Red Neuronal al framework de evaluación |
| `src/views/admin/AdminPruebas.jsx` | Interfaz de ejecución y visualización |
| `AGENTS.md` | Documentación del módulo para agentes de IA |
| `PruebaRobusta.md` | Este documento |

---

## 14. Referencias

- Herlocker, J. L., Konstan, J. A., Terveen, L. G., & Riedl, J. T. (2004). Evaluating collaborative filtering recommender systems. *ACM TOIS*, 22(1), 5-53.
- Salzberg, S. L. (1997). On comparing classifiers: Pitfalls to avoid and a recommended approach. *Data Mining and Knowledge Discovery*, 1(3), 317-328.
- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*.
- Efron, B., & Tibshirani, R. J. (1993). *An Introduction to the Bootstrap*.
