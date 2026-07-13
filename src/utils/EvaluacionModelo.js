// src/utils/EvaluacionModelo.js
// Framework de evaluación offline para sistemas de recomendación

import {
  generarUsuariosSinteticos,
  dividirTrainTestPorUsuario,
  convertirAHistorial,
} from "./datosPrueba";
import { PRODUCTOS, CATEGORIAS } from "./productos";

/**
 * Calcula métricas de recomendación para un único usuario.
 *
 * @param {number[]} recomendacionesIds - IDs de productos recomendados (top-K)
 * @param {number[]} testIds - IDs de productos comprados en test
 * @param {object[]} historialTrain - Historial de compras de entrenamiento
 * @returns {object} Métricas individuales
 */
function calcularMetricasUsuario(recomendacionesIds, testIds, historialTrain) {
  const k = recomendacionesIds.length;
  const testSet = new Set(testIds);

  if (testSet.size === 0) {
    return {
      hitRate: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      mrr: 0,
      ap: 0,
      dcg: 0,
      idcg: 0,
      ndcg: 0,
      aciertos: 0,
    };
  }

  // Aciertos por posición
  const relevancias = recomendacionesIds.map((id) => (testSet.has(id) ? 1 : 0));
  const aciertos = relevancias.reduce((a, b) => a + b, 0);

  // Hit Rate
  const hitRate = aciertos > 0 ? 1 : 0;

  // Precision y Recall
  const precision = aciertos / k;
  const recall = aciertos / testSet.size;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  // MRR
  let mrr = 0;
  for (let i = 0; i < recomendacionesIds.length; i++) {
    if (testSet.has(recomendacionesIds[i])) {
      mrr = 1 / (i + 1);
      break;
    }
  }

  // AP (Average Precision)
  let ap = 0;
  let aciertosAcumulados = 0;
  for (let i = 0; i < recomendacionesIds.length; i++) {
    if (testSet.has(recomendacionesIds[i])) {
      aciertosAcumulados++;
      ap += aciertosAcumulados / (i + 1);
    }
  }
  ap = aciertos > 0 ? ap / Math.min(testSet.size, k) : 0;

  // DCG / IDCG / NDCG
  let dcg = 0;
  for (let i = 0; i < relevancias.length; i++) {
    if (relevancias[i] === 1) {
      dcg += 1 / Math.log2(i + 2); // posición i+1 -> log2(i+2)
    }
  }

  const idealRelevancias = Math.min(testSet.size, k);
  let idcg = 0;
  for (let i = 0; i < idealRelevancias; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  const ndcg = idcg > 0 ? dcg / idcg : 0;

  // Novelty (productos fuera de la categoría más frecuente del train)
  let novelty = 0;
  if (historialTrain.length > 0) {
    const frecuenciaCategorias = {};
    historialTrain.forEach((h) => {
      frecuenciaCategorias[h.categoria] = (frecuenciaCategorias[h.categoria] || 0) + 1;
    });
    const categoriaFavorita = Object.entries(frecuenciaCategorias).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    const novedosos = recomendacionesIds.filter((id) => {
      const prod = PRODUCTOS.find((p) => p.id === id);
      return prod && prod.categoria !== categoriaFavorita;
    }).length;
    novelty = novedosos / k;
  }

  return {
    hitRate,
    precision,
    recall,
    f1,
    mrr,
    ap,
    dcg,
    idcg,
    ndcg,
    novelty,
    aciertos,
  };
}

/**
 * Calcula métricas agregadas para todo un conjunto de usuarios.
 *
 * @param {object[]} resultadosPorUsuario - Array con { usuarioId, recomendacionesIds, testIds, historialTrain }
 * @returns {object} Métricas promediadas y cobertura/diversidad globales
 */
function agregarMetricas(resultadosPorUsuario) {
  if (resultadosPorUsuario.length === 0) {
    return {
      hitRate: 0,
      precision: 0,
      recall: 0,
      f1: 0,
      mrr: 0,
      map: 0,
      ndcg: 0,
      coverage: 0,
      diversity: 0,
      novelty: 0,
      aciertosPromedio: 0,
      totalUsuarios: 0,
    };
  }

  const metricasIndividuales = resultadosPorUsuario.map((r) =>
    calcularMetricasUsuario(r.recomendacionesIds, r.testIds, r.historialTrain)
  );

  const promediar = (key) =>
    metricasIndividuales.reduce((sum, m) => sum + m[key], 0) / metricasIndividuales.length;

  // Coverage: % de catálogo recomendado al menos una vez
  const todosRecomendados = new Set();
  resultadosPorUsuario.forEach((r) => {
    r.recomendacionesIds.forEach((id) => todosRecomendados.add(id));
  });
  const coverage = (todosRecomendados.size / PRODUCTOS.length) * 100;

  // Diversity promedio: 1 - similitud media entre pares de recomendaciones por usuario
  // Usamos similitud basada en categoría (1 si misma categoría, 0 si distinta)
  const diversidades = resultadosPorUsuario.map((r) => {
    const recs = r.recomendacionesIds;
    if (recs.length < 2) return 0;
    let pares = 0;
    let similitud = 0;
    for (let i = 0; i < recs.length; i++) {
      for (let j = i + 1; j < recs.length; j++) {
        const p1 = PRODUCTOS.find((p) => p.id === recs[i]);
        const p2 = PRODUCTOS.find((p) => p.id === recs[j]);
        if (p1 && p2) {
          pares++;
          if (p1.categoria === p2.categoria) similitud += 1;
        }
      }
    }
    return pares > 0 ? (1 - similitud / pares) * 100 : 0;
  });
  const diversity =
    diversidades.reduce((a, b) => a + b, 0) / diversidades.length;

  return {
    hitRate: promediar("hitRate") * 100,
    precision: promediar("precision") * 100,
    recall: promediar("recall") * 100,
    f1: promediar("f1") * 100,
    mrr: promediar("mrr"),
    map: promediar("ap"),
    ndcg: promediar("ndcg") * 100,
    coverage,
    diversity,
    novelty: promediar("novelty") * 100,
    aciertosPromedio: promediar("aciertos"),
    totalUsuarios: resultadosPorUsuario.length,
    metricasIndividuales,
  };
}

/**
 * Evalúa un recomendador sobre un conjunto de usuarios.
 *
 * El recomendador debe implementar el método:
 *   async recomendar(historialTrain, n) → array de productos
 *
 * @param {object} recomendador - Objeto con método recomendar
 * @param {object[]} usuarios - Usuarios sintéticos
 * @param {number} k - Tamaño del top-K
 * @param {number} ratioTrain - Proporción train/test
 * @returns {object} Métricas agregadas
 */
export async function evaluarRecomendador(recomendador, usuarios, k = 10, ratioTrain = 0.8) {
  const resultadosPorUsuario = [];

  for (const usuario of usuarios) {
    const { train, test } = dividirTrainTestPorUsuario(usuario, ratioTrain);
    if (train.length === 0 || test.length === 0) continue;

    const historialTrain = convertirAHistorial(train);
    const testIds = test.map((c) => c.productoId);

    const recomendaciones = await recomendador.recomendar(historialTrain, k);
    const recomendacionesIds = recomendaciones.map((p) => p.id);

    resultadosPorUsuario.push({
      usuarioId: usuario.userId,
      recomendacionesIds,
      testIds,
      historialTrain,
    });
  }

  return agregarMetricas(resultadosPorUsuario);
}

/**
 * Realiza K-Fold Cross-Validation por usuario.
 * Para cada usuario, las compras se dividen en K ventanas temporales.
 * En cada fold se entrena con lo anterior y se testea con la ventana actual.
 *
 * @param {object} recomendador - Objeto con método recomendar y reiniciar opcional
 * @param {object[]} usuarios - Usuarios sintéticos
 * @param {number} k - Tamaño del top-K de recomendaciones
 * @param {number} folds - Número de folds
 * @returns {object} Métricas promedio y desviación estándar por fold
 */
export async function crossValidationPorUsuario(recomendador, usuarios, k = 10, folds = 5) {
  const metricasPorFold = [];

  for (let fold = 0; fold < folds; fold++) {
    // Reiniciar modelo si el recomendador lo soporta
    if (recomendador.reiniciar) {
      await recomendador.reiniciar();
    }

    const resultadosPorUsuario = [];

    for (const usuario of usuarios) {
      const compras = [...usuario.compras];
      if (compras.length < folds + 1) continue;

      // Dividir en folds temporales
      const foldSize = Math.floor(compras.length / folds);
      const inicioTest = fold * foldSize;
      const finTest = fold === folds - 1 ? compras.length : (fold + 1) * foldSize;

      const train = compras.slice(0, inicioTest).concat(compras.slice(finTest));
      const test = compras.slice(inicioTest, finTest);

      if (train.length === 0 || test.length === 0) continue;

      const historialTrain = convertirAHistorial(train);
      const testIds = test.map((c) => c.productoId);

      const recomendaciones = await recomendador.recomendar(historialTrain, k);
      const recomendacionesIds = recomendaciones.map((p) => p.id);

      resultadosPorUsuario.push({
        usuarioId: usuario.userId,
        recomendacionesIds,
        testIds,
        historialTrain,
      });
    }

    metricasPorFold.push(agregarMetricas(resultadosPorUsuario));
  }

  // Promediar métricas entre folds
  const keys = ["hitRate", "precision", "recall", "f1", "mrr", "map", "ndcg", "coverage", "diversity", "novelty"];
  const promedios = {};
  const desviaciones = {};

  keys.forEach((key) => {
    const valores = metricasPorFold.map((m) => m[key]);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const varianza = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
    promedios[key] = media;
    desviaciones[key] = Math.sqrt(varianza);
  });

  return {
    promedios,
    desviaciones,
    metricasPorFold,
  };
}

/**
 * Calcula intervalos de confianza por bootstrap para un array de valores.
 *
 * @param {number[]} valores - Array de métricas individuales por usuario
 * @param {number} iteraciones - Número de remuestreos (default: 1000)
 * @param {number} alpha - Nivel de significancia (default: 0.05 → IC 95%)
 * @returns {object} { media, lower, upper }
 */
export function bootstrapConfidenceIntervals(valores, iteraciones = 1000, alpha = 0.05) {
  if (!valores || valores.length === 0) {
    return { media: 0, lower: 0, upper: 0 };
  }

  const mediasBootstrap = [];
  const n = valores.length;

  for (let i = 0; i < iteraciones; i++) {
    let suma = 0;
    for (let j = 0; j < n; j++) {
      const idx = Math.floor(Math.random() * n);
      suma += valores[idx];
    }
    mediasBootstrap.push(suma / n);
  }

  mediasBootstrap.sort((a, b) => a - b);
  const lowerIdx = Math.floor((alpha / 2) * iteraciones);
  const upperIdx = Math.floor((1 - alpha / 2) * iteraciones);

  return {
    media: valores.reduce((a, b) => a + b, 0) / valores.length,
    lower: mediasBootstrap[lowerIdx],
    upper: mediasBootstrap[upperIdx],
  };
}

/**
 * Genera intervalos de confianza bootstrap para cada métrica de un resultado de evaluación.
 *
 * @param {object} resultado - Resultado de evaluarRecomendador
 * @returns {object} Intervalos de confianza por métrica
 */
export function intervalosConfianzaPorMetrica(resultado, iteraciones = 1000) {
  const metricasPorUsuario = resultado.metricasIndividuales || [];
  if (metricasPorUsuario.length === 0) return {};

  const keys = ["hitRate", "precision", "recall", "f1", "mrr", "ap", "ndcg", "novelty"];
  const intervalos = {};

  keys.forEach((key) => {
    const valores = metricasPorUsuario.map((m) => m[key]);
    intervalos[key] = bootstrapConfidenceIntervals(valores, iteraciones);
  });

  return intervalos;
}

export default {
  evaluarRecomendador,
  crossValidationPorUsuario,
  bootstrapConfidenceIntervals,
  intervalosConfianzaPorMetrica,
};
