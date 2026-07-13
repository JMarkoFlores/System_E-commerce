// src/utils/datosPrueba.js
// Generador de datos sintéticos para evaluación offline del modelo de recomendación

import { PRODUCTOS, CATEGORIAS } from "./productos";

/**
 * Generador de números pseudoaleatorios con semilla (Mulberry32).
 * Permite que los experimentos sean reproducibles.
 */
class RNG {
  constructor(seed = 42) {
    this.seed = seed;
  }

  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Entero en [min, max)
  int(min, max) {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // Entero en [min, max]
  intInclusive(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Elegir un elemento aleatorio de un array
  choice(arr) {
    return arr[this.int(0, arr.length)];
  }

  // Elegir varios elementos aleatorios (con repetición permitida o no)
  sample(arr, n, allowRepeat = false) {
    if (allowRepeat) {
      return Array.from({ length: n }, () => this.choice(arr));
    }
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
  }

  // Valor booleano con probabilidad p
  bool(p = 0.5) {
    return this.next() < p;
  }
}

/**
 * Distribución de categorías base usada para generar perfiles de usuario.
 * Refleja popularidad relativa aproximada dentro de un e-commerce de tecnología.
 */
const CATEGORIA_PESOS_BASE = {
  Electrónica: 0.25,
  Periféricos: 0.15,
  Audio: 0.12,
  Almacenamiento: 0.10,
  Muebles: 0.10,
  Iluminación: 0.08,
  Fotografía: 0.05,
  Streaming: 0.15,
};

/**
 * Genera un perfil de usuario sintético con preferencias por categorías, tags y rango de precio.
 */
function generarPerfil(rng) {
  // Asignar pesos propios del usuario a partir de los pesos base, añadiendo variabilidad
  const pesosCategorias = {};
  let suma = 0;

  CATEGORIAS.forEach((cat) => {
    const base = CATEGORIA_PESOS_BASE[cat] || 0.1;
    // Variabilidad individual: cada usuario pondera distinto cada categoría
    const factor = 0.2 + rng.next() * 1.8; // entre 0.2x y 2.0x
    pesosCategorias[cat] = base * factor;
    suma += pesosCategorias[cat];
  });

  // Normalizar para que sumen 1
  CATEGORIAS.forEach((cat) => {
    pesosCategorias[cat] /= suma;
  });

  // Tags preferidos: tomar tags de productos de categorías con mayor peso
  const categoriasTop = Object.entries(pesosCategorias)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  const productosTop = PRODUCTOS.filter((p) => categoriasTop.includes(p.categoria));
  const tagsPool = [
    ...new Set(productosTop.flatMap((p) => p.tags)),
  ];
  const tagsPreferidos = rng.sample(tagsPool, rng.intInclusive(2, 5), false);

  // Rango de precio aceptable para el usuario
  const nivelesPrecio = ["economico", "medio", "premium"];
  const nivel = rng.choice(nivelesPrecio);
  let minPrecio, maxPrecio;
  switch (nivel) {
    case "economico":
      minPrecio = 20;
      maxPrecio = 400;
      break;
    case "medio":
      minPrecio = 150;
      maxPrecio = 1200;
      break;
    case "premium":
    default:
      minPrecio = 500;
      maxPrecio = 2600;
      break;
  }

  return {
    categoriasFavoritas: pesosCategorias,
    tagsPreferidos,
    rangoPrecio: [minPrecio, maxPrecio],
  };
}

/**
 * Genera una fecha aleatoria dentro de un rango.
 */
function generarFecha(rng, inicio, fin) {
  const diff = fin.getTime() - inicio.getTime();
  return new Date(inicio.getTime() + rng.next() * diff);
}

/**
 * Genera un historial de compras para un usuario dado su perfil.
 */
function generarComprasUsuario(perfil, rng, cantidadCompras) {
  const compras = [];
  const productosCompradosIds = new Set();

  const inicio = new Date("2025-01-01");
  const fin = new Date("2026-06-30");

  for (let i = 0; i < cantidadCompras; i++) {
    // Decidir si la compra sigue el perfil (80% del tiempo) o es ruido (20%)
    const esCompraDePerfil = rng.bool(0.8);

    let candidatos;
    if (esCompraDePerfil) {
      // Filtrar productos que estén dentro del rango de precio del usuario
      candidatos = PRODUCTOS.filter((p) => {
        if (p.precio < perfil.rangoPrecio[0] || p.precio > perfil.rangoPrecio[1]) {
          return false;
        }
        const pesoCategoria = perfil.categoriasFavoritas[p.categoria] || 0;
        const tagsCoincidentes = p.tags.filter((t) =>
          perfil.tagsPreferidos.includes(t)
        ).length;
        // Admitir productos de categorías preferidas o con tags preferidos
        return pesoCategoria > 0.08 || tagsCoincidentes > 0;
      });
    } else {
      // Compra fuera de perfil (ruido realista)
      candidatos = PRODUCTOS;
    }

    if (candidatos.length === 0) {
      candidatos = PRODUCTOS;
    }

    // Puntuar candidatos para elegir uno más probable
    const productosPuntuados = candidatos.map((p) => {
      let score = 0;
      score += (perfil.categoriasFavoritas[p.categoria] || 0) * 100;
      score +=
        p.tags.filter((t) => perfil.tagsPreferidos.includes(t)).length * 15;
      // Penalizar ligeramente productos ya comprados para evitar repetición excesiva
      if (productosCompradosIds.has(p.id)) score -= 30;
      // Varianza aleatoria
      score += rng.next() * 20;
      return { producto: p, score };
    });

    productosPuntuados.sort((a, b) => b.score - a.score);

    // Elegir entre los top 5 para mantener coherencia pero con algo de aleatoriedad
    const top = productosPuntuados.slice(0, Math.min(5, productosPuntuados.length));
    const seleccionado = rng.choice(top).producto;

    productosCompradosIds.add(seleccionado.id);
    compras.push({
      productoId: seleccionado.id,
      fecha: generarFecha(rng, inicio, fin),
    });
  }

  // Ordenar cronológicamente
  return compras.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

/**
 * Genera un conjunto de usuarios sintéticos con historiales de compra.
 *
 * @param {number} cantidad - Número de usuarios a generar (default: 50)
 * @param {number} semilla - Semilla para reproducibilidad (default: 42)
 * @param {object} opciones - Opciones adicionales
 * @param {number} opciones.minCompras - Mínimo de compras por usuario (default: 3)
 * @param {number} opciones.maxCompras - Máximo de compras por usuario (default: 20)
 * @returns {Array} Array de usuarios sintéticos
 */
export function generarUsuariosSinteticos(cantidad = 50, semilla = 42, opciones = {}) {
  const rng = new RNG(semilla);
  const minCompras = opciones.minCompras || 3;
  const maxCompras = opciones.maxCompras || 20;

  const usuarios = [];
  for (let i = 0; i < cantidad; i++) {
    const perfil = generarPerfil(rng);
    const cantidadCompras = rng.intInclusive(minCompras, maxCompras);
    const compras = generarComprasUsuario(perfil, rng, cantidadCompras);

    usuarios.push({
      userId: i + 1,
      perfil,
      compras,
    });
  }

  return usuarios;
}

/**
 * Divide las compras de un usuario en conjunto de entrenamiento y prueba,
 * respetando el orden cronológico (split temporal).
 *
 * @param {object} usuario - Objeto usuario con array `compras`
 * @param {number} ratioTrain - Proporción de compras para entrenamiento (default: 0.8)
 * @returns {object} { train, test }
 */
export function dividirTrainTestPorUsuario(usuario, ratioTrain = 0.8) {
  const compras = [...usuario.compras]; // ya ordenadas cronológicamente
  const nTrain = Math.max(1, Math.floor(compras.length * ratioTrain));
  return {
    train: compras.slice(0, nTrain),
    test: compras.slice(nTrain),
  };
}

/**
 * Convierte compras al formato de historial usado por RedNeuronal.js.
 */
export function convertirAHistorial(compras) {
  return compras
    .map((c) => {
      const producto = PRODUCTOS.find((p) => p.id === c.productoId);
      if (!producto) return null;
      return {
        ...producto,
        fechaCompra: c.fecha.toISOString(),
      };
    })
    .filter(Boolean);
}

/**
 * Calcula estadísticas descriptivas del dataset generado.
 */
export function estadisticasDataset(usuarios) {
  const totalCompras = usuarios.reduce((sum, u) => sum + u.compras.length, 0);
  const promedioCompras = totalCompras / usuarios.length;
  const comprasPorCategoria = {};

  usuarios.forEach((u) => {
    u.compras.forEach((c) => {
      const producto = PRODUCTOS.find((p) => p.id === c.productoId);
      if (producto) {
        comprasPorCategoria[producto.categoria] =
          (comprasPorCategoria[producto.categoria] || 0) + 1;
      }
    });
  });

  return {
    totalUsuarios: usuarios.length,
    totalCompras,
    promedioCompras: promedioCompras.toFixed(2),
    comprasPorCategoria,
  };
}

export default {
  generarUsuariosSinteticos,
  dividirTrainTestPorUsuario,
  convertirAHistorial,
  estadisticasDataset,
};
