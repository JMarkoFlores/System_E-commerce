// src/utils/RedNeuronal.js
// Sistema de Recomendación con TensorFlow.js - Red Neuronal Artificial

import * as tf from "@tensorflow/tfjs";
import { PRODUCTOS, CATEGORIAS } from "./productos";

class RedNeuronalRecomendacion {
  constructor() {
    this.modelo = null;
    this.historialEntrenamiento = [];
    this.generacion = 0;
    this.categoriaToIndex = {};
    this.todosLosTags = new Set();
    this.inicializarMappings();
    this.crearModelo();
  }

  inicializarMappings() {
    // Crear mapeo de categorías a índices
    CATEGORIAS.forEach((cat, idx) => {
      this.categoriaToIndex[cat] = idx;
    });

    // Recolectar todos los tags únicos del catálogo
    PRODUCTOS.forEach((p) => {
      p.tags.forEach((tag) => this.todosLosTags.add(tag));
    });
    this.todosLosTags = Array.from(this.todosLosTags);
  }

  crearModelo() {
    // Crear red neuronal con TensorFlow.js
    // Arquitectura: Input -> Dense(32) -> Dropout -> Dense(16) -> Dense(1)
    this.modelo = tf.sequential({
      layers: [
        // Capa de entrada: features normalizadas del producto
        tf.layers.dense({
          inputShape: [CATEGORIAS.length + this.todosLosTags.length + 3], // categorías + tags + 3 features de precio
          units: 32,
          activation: "relu",
          kernelInitializer: "heNormal",
        }),
        // Dropout para evitar overfitting
        tf.layers.dropout({ rate: 0.2 }),
        // Capa oculta
        tf.layers.dense({
          units: 16,
          activation: "relu",
          kernelInitializer: "heNormal",
        }),
        // Capa de salida: score de recomendación (0-1)
        tf.layers.dense({
          units: 1,
          activation: "sigmoid",
        }),
      ],
    });

    // Compilar modelo con optimizador Adam y función de pérdida MSE
    this.modelo.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["accuracy"],
    });

    console.log("🧠 Red Neuronal creada con TensorFlow.js");
    this.modelo.summary();
  }

  extraerFeatures(producto, historialUsuario) {
    // Vector de features para el producto
    const features = [];

    // 1. One-hot encoding de categorías (7 features)
    CATEGORIAS.forEach((cat) => {
      features.push(producto.categoria === cat ? 1 : 0);
    });

    // 2. One-hot encoding de tags (features dinámicas)
    this.todosLosTags.forEach((tag) => {
      features.push(producto.tags.includes(tag) ? 1 : 0);
    });

    if (historialUsuario.length === 0) {
      // 3. Features de precio normalizadas (sin historial)
      features.push(producto.precio / 2500); // Normalizar por precio máximo ~2500
      features.push(0.5); // Diferencia de precio promedio
      features.push(0.5); // Rango de precio
    } else {
      // 3. Features de precio basadas en historial
      const preciosComprados = historialUsuario.map((h) => h.precio);
      const precioPromedio =
        preciosComprados.reduce((a, b) => a + b, 0) / preciosComprados.length;
      const precioMin = Math.min(...preciosComprados);
      const precioMax = Math.max(...preciosComprados);

      features.push(producto.precio / 2500); // Precio normalizado
      features.push(Math.abs(producto.precio - precioPromedio) / 2500); // Diferencia de precio
      features.push(
        producto.precio >= precioMin && producto.precio <= precioMax ? 1 : 0
      ); // En rango
    }

    return features;
  }

  async entrenar(historialUsuario) {
    if (historialUsuario.length === 0) return;

    this.generacion++;
    console.log(`🎓 Entrenando red neuronal - Generación #${this.generacion}`);

    // Generar datos de entrenamiento
    const datosEntrenamiento = [];
    const labels = [];

    PRODUCTOS.forEach((producto) => {
      const features = this.extraerFeatures(producto, historialUsuario);
      datosEntrenamiento.push(features);

      // Label: 1 si el producto fue comprado, 0 si no
      const fueComprado = historialUsuario.some((h) => h.id === producto.id);

      // Calcular score basado en similitud con historial
      let score = fueComprado ? 1 : 0;

      if (!fueComprado) {
        // Calcular similitud para productos no comprados
        const categoriasCompradas = historialUsuario.map((h) => h.categoria);
        const mismaCategoria = categoriasCompradas.includes(producto.categoria);
        const frecuenciaCategoria = categoriasCompradas.filter(
          (c) => c === producto.categoria
        ).length;

        const tagsComprados = new Set(historialUsuario.flatMap((h) => h.tags));
        const tagsComunes = producto.tags.filter((tag) =>
          tagsComprados.has(tag)
        ).length;

        // Score entre 0-0.7 para productos similares no comprados
        score = Math.min(
          (frecuenciaCategoria / historialUsuario.length) * 0.4 +
            (tagsComunes / Math.max(producto.tags.length, 1)) * 0.3,
          0.7
        );
      }

      labels.push(score);
    });

    // Convertir a tensores
    const xs = tf.tensor2d(datosEntrenamiento);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    // Entrenar el modelo
    const history = await this.modelo.fit(xs, ys, {
      epochs: 20,
      batchSize: 32,
      shuffle: true,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 5 === 0) {
            console.log(`  Época ${epoch}: loss = ${logs.loss.toFixed(4)}`);
          }
        },
      },
    });

    // Limpiar tensores
    xs.dispose();
    ys.dispose();

    // Guardar estadísticas de entrenamiento
    this.historialEntrenamiento.push({
      generacion: this.generacion,
      numCompras: historialUsuario.length,
      loss: history.history.loss[history.history.loss.length - 1],
      timestamp: Date.now(),
    });

    console.log(
      `✅ Entrenamiento completado - Loss final: ${history.history.loss[
        history.history.loss.length - 1
      ].toFixed(4)}`
    );
  }

  async recomendar(historialUsuario, n = 6) {
    // Filtrar productos ya comprados
    const productosNoComprados = PRODUCTOS.filter(
      (p) => !historialUsuario.find((h) => h.id === p.id)
    );

    // Extraer features y hacer predicciones con la red neuronal
    const recomendacionesConScore = [];

    for (const producto of productosNoComprados) {
      const features = this.extraerFeatures(producto, historialUsuario);

      // Hacer predicción con TensorFlow.js
      const tensorInput = tf.tensor2d([features]);
      const prediccion = this.modelo.predict(tensorInput);
      const score = (await prediccion.data())[0];

      // Limpiar tensores
      tensorInput.dispose();
      prediccion.dispose();

      recomendacionesConScore.push({
        ...producto,
        score: score,
        razon: this.obtenerRazonRecomendacion(producto, historialUsuario),
      });
    }

    // Ordenar por score descendente
    recomendacionesConScore.sort((a, b) => b.score - a.score);

    // Aplicar diversidad: balancear categorías
    const recomendacionesBalanceadas = [];
    const categoriasUsadas = new Map();

    for (const rec of recomendacionesConScore) {
      const countCategoria = categoriasUsadas.get(rec.categoria) || 0;

      // Permitir hasta 2 productos por categoría en las primeras recomendaciones
      if (countCategoria < 2 || recomendacionesBalanceadas.length >= n / 2) {
        recomendacionesBalanceadas.push(rec);
        categoriasUsadas.set(rec.categoria, countCategoria + 1);
      }

      if (recomendacionesBalanceadas.length >= n) break;
    }

    // Si no hay suficientes, completar con las mejores opciones
    if (recomendacionesBalanceadas.length < n) {
      const faltantes = recomendacionesConScore
        .filter((r) => !recomendacionesBalanceadas.find((rb) => rb.id === r.id))
        .slice(0, n - recomendacionesBalanceadas.length);
      recomendacionesBalanceadas.push(...faltantes);
    }

    console.log(
      `🎯 Top 3 recomendaciones:`,
      recomendacionesBalanceadas
        .slice(0, 3)
        .map((r) => `${r.nombre} (score: ${r.score.toFixed(3)})`)
    );

    return recomendacionesBalanceadas.slice(0, n);
  }

  obtenerRazonRecomendacion(producto, historial) {
    if (historial.length === 0) return "Producto destacado";

    const categoriasCompradas = historial.map((h) => h.categoria);
    const hayCategoria = categoriasCompradas.includes(producto.categoria);

    if (hayCategoria) {
      const frecuencia = categoriasCompradas.filter(
        (c) => c === producto.categoria
      ).length;
      if (frecuencia >= 2) {
        return `🎯 Basado en tus ${frecuencia} compras de ${producto.categoria}`;
      }
      return `Basado en tu interés en ${producto.categoria}`;
    }

    const tagsComprados = new Set(historial.flatMap((h) => h.tags));
    const tagsComunes = producto.tags.filter((tag) => tagsComprados.has(tag));

    if (tagsComunes.length > 0) {
      return `✨ Coincide con tus intereses: ${tagsComunes
        .slice(0, 2)
        .join(", ")}`;
    }

    return "🌟 Recomendado por IA";
  }

  obtenerEstadisticas() {
    return {
      generacion: this.generacion,
      historialEntrenamiento: this.historialEntrenamiento,
      numCapas: this.modelo.layers.length,
      parametros: this.modelo.countParams(),
    };
  }

  async reiniciar() {
    // Liberar memoria del modelo anterior
    if (this.modelo) {
      this.modelo.dispose();
    }

    // Recrear modelo
    this.historialEntrenamiento = [];
    this.generacion = 0;
    this.crearModelo();

    console.log("🔄 Red neuronal reiniciada");
  }

  // Método para guardar el modelo (opcional)
  async guardarModelo() {
    try {
      await this.modelo.save("localstorage://modelo-recomendacion");
      console.log("💾 Modelo guardado en LocalStorage");
    } catch (error) {
      console.error("Error guardando modelo:", error);
    }
  }

  // Método para cargar el modelo (opcional)
  async cargarModelo() {
    try {
      this.modelo = await tf.loadLayersModel(
        "localstorage://modelo-recomendacion"
      );
      console.log("📂 Modelo cargado desde LocalStorage");
      return true;
    } catch (error) {
      console.log("No hay modelo guardado, usando modelo nuevo");
      return false;
    }
  }
}

export default RedNeuronalRecomendacion;
