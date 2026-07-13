// src/utils/baselines.js
// Modelos baseline para comparar contra la Red Neuronal de recomendación

import { PRODUCTOS, CATEGORIAS } from "./productos";

/**
 * Recomendador aleatorio.
 * Selecciona N productos no comprados al azar.
 */
export class RandomRecommender {
  constructor(seed = 123) {
    this.seed = seed;
  }

  random() {
    // LCG simple con semilla
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  async recomendar(historialTrain, n = 10) {
    const compradosIds = new Set(historialTrain.map((h) => h.id));
    const candidatos = PRODUCTOS.filter((p) => !compradosIds.has(p.id));

    // Shuffle Fisher-Yates
    for (let i = candidatos.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
    }

    return candidatos.slice(0, n);
  }

  async reiniciar() {
    this.seed = 123;
  }
}

/**
 * Recomendador basado en popularidad global.
 * Recomienda los productos más comprados en todo el catálogo.
 */
export class PopularityRecommender {
  constructor() {
    // Popularidad precalculada: frecuencia simulada basada en precio y categoría
    this.popularidad = this.calcularPopularidad();
  }

  calcularPopularidad() {
    // Simular popularidad con una fórmula heurística:
    // productos de precio medio-alto en Electrónica/Streaming suelen ser más populares
    return PRODUCTOS.map((p) => {
      let score = 0;
      if (p.categoria === "Electrónica") score += 30;
      if (p.categoria === "Streaming") score += 20;
      if (p.categoria === "Periféricos") score += 15;
      if (p.categoria === "Audio") score += 12;
      if (p.categoria === "Muebles") score += 10;
      if (p.categoria === "Almacenamiento") score += 10;
      if (p.categoria === "Iluminación") score += 8;
      if (p.categoria === "Fotografía") score += 5;

      // Precio: productos entre 100 y 1000 son más accesibles y populares
      score += Math.max(0, 25 - Math.abs(p.precio - 500) / 40);

      // Bonus por tags comunes
      const tagsPopulares = ["gaming", "laptop", "smartphone", "ssd", "headphones", "webcam"];
      score += p.tags.filter((t) => tagsPopulares.includes(t)).length * 5;

      return { producto: p, score };
    }).sort((a, b) => b.score - a.score);
  }

  async recomendar(historialTrain, n = 10) {
    const compradosIds = new Set(historialTrain.map((h) => h.id));
    return this.popularidad
      .filter((item) => !compradosIds.has(item.producto.id))
      .slice(0, n)
      .map((item) => item.producto);
  }

  async reiniciar() {
    // No tiene estado que reiniciar
  }
}

/**
 * Recomendador content-based usando similitud del coseno.
 * Representa cada producto como vector de categoría + tags y recomienda
 * los más similares al perfil del usuario (promedio de productos comprados).
 */
export class ContentBasedRecommender {
  constructor() {
    this.todosLosTags = [...new Set(PRODUCTOS.flatMap((p) => p.tags))];
    this.vectores = new Map();
    PRODUCTOS.forEach((p) => {
      this.vectores.set(p.id, this.vectorizarProducto(p));
    });
  }

  vectorizarProducto(producto) {
    const vec = [];
    // One-hot categoría
    CATEGORIAS.forEach((cat) => vec.push(producto.categoria === cat ? 1 : 0));
    // One-hot tags
    this.todosLosTags.forEach((tag) => vec.push(producto.tags.includes(tag) ? 1 : 0));
    // Precio normalizado
    vec.push(producto.precio / 2500);
    return vec;
  }

  similitudCoseno(a, b) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  perfilUsuario(historialTrain) {
    if (historialTrain.length === 0) {
      return new Array(CATEGORIAS.length + this.todosLosTags.length + 1).fill(0);
    }
    const perfil = new Array(this.vectores.get(historialTrain[0].id).length).fill(0);
    historialTrain.forEach((h) => {
      const vec = this.vectores.get(h.id);
      vec.forEach((v, i) => {
        perfil[i] += v;
      });
    });
    return perfil.map((v) => v / historialTrain.length);
  }

  async recomendar(historialTrain, n = 10) {
    const compradosIds = new Set(historialTrain.map((h) => h.id));
    const perfil = this.perfilUsuario(historialTrain);

    const similitudes = PRODUCTOS
      .filter((p) => !compradosIds.has(p.id))
      .map((p) => ({
        producto: p,
        score: this.similitudCoseno(perfil, this.vectores.get(p.id)),
      }))
      .sort((a, b) => b.score - a.score);

    return similitudes.slice(0, n).map((s) => s.producto);
  }

  async reiniciar() {
    // No tiene estado mutable
  }
}

/**
 * Recomendador por categoría favorita.
 * Recomienda productos de la categoría más frecuente en el historial del usuario.
 */
export class CategoryFavoriteRecommender {
  async recomendar(historialTrain, n = 10) {
    const compradosIds = new Set(historialTrain.map((h) => h.id));

    if (historialTrain.length === 0) {
      return PRODUCTOS.slice(0, n);
    }

    const frecuencia = {};
    historialTrain.forEach((h) => {
      frecuencia[h.categoria] = (frecuencia[h.categoria] || 0) + 1;
    });
    const categoriaFavorita = Object.entries(frecuencia).sort((a, b) => b[1] - a[1])[0][0];

    return PRODUCTOS.filter(
      (p) => p.categoria === categoriaFavorita && !compradosIds.has(p.id)
    ).slice(0, n);
  }

  async reiniciar() {
    // No tiene estado mutable
  }
}

export default {
  RandomRecommender,
  PopularityRecommender,
  ContentBasedRecommender,
  CategoryFavoriteRecommender,
};
