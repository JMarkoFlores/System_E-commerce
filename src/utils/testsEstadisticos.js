// src/utils/testsEstadisticos.js
// Tests estadísticos para comparar modelos de recomendación

/**
 * Aproximación de la función error (erf) usando la fórmula 7.1.26 de Abramowitz & Stegun.
 */
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));

  return sign * y;
}

/**
 * Función de distribución acumulada (CDF) de la distribución normal estándar.
 */
function normalCDF(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Calcula media y desviación estándar muestral de un array.
 */
function mediaYDesviacion(arr) {
  const n = arr.length;
  if (n === 0) return { media: 0, desviacion: 0 };
  const media = arr.reduce((a, b) => a + b, 0) / n;
  const varianza = arr.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / (n - 1 || 1);
  return { media, desviacion: Math.sqrt(varianza) };
}

/**
 * Paired t-test (t-test de Student pareado).
 * Compara dos muestras pareadas (por ejemplo, métricas del mismo usuario bajo dos modelos).
 *
 * Hipótesis nula H0: la media de las diferencias es 0.
 *
 * @param {number[]} muestraA - Métricas del modelo A (una por usuario/fold)
 * @param {number[]} muestraB - Métricas del modelo B (una por usuario/fold)
 * @returns {object} { tStatistic, df, pValue, meanDiff, stdDiff, significant }
 */
export function pairedTTest(muestraA, muestraB) {
  if (muestraA.length !== muestraB.length || muestraA.length === 0) {
    return {
      tStatistic: 0,
      df: 0,
      pValue: 1,
      meanDiff: 0,
      stdDiff: 0,
      significant: false,
    };
  }

  const diferencias = muestraA.map((a, i) => a - muestraB[i]);
  const { media: meanDiff, desviacion: stdDiff } = mediaYDesviacion(diferencias);
  const n = diferencias.length;
  const se = stdDiff / Math.sqrt(n);
  const tStatistic = se === 0 ? 0 : meanDiff / se;
  const df = n - 1;

  // Para n > 30, la distribución t se aproxima bien a la normal.
  // Para muestras pequeñas, esta es una aproximación conservadora.
  const pValueOneSided = 1 - normalCDF(Math.abs(tStatistic));
  const pValue = pValueOneSided * 2; // two-tailed

  return {
    tStatistic,
    df,
    pValue,
    meanDiff,
    stdDiff,
    significant: pValue < 0.05,
  };
}

/**
 * Wilcoxon signed-rank test (no paramétrico).
 * Alternativa robusta al t-test pareado cuando los datos no son normales.
 *
 * @param {number[]} muestraA - Métricas del modelo A
 * @param {number[]} muestraB - Métricas del modelo B
 * @returns {object} { zStatistic, pValue, W, significant }
 */
export function wilcoxonSignedRank(muestraA, muestraB) {
  if (muestraA.length !== muestraB.length || muestraA.length === 0) {
    return { zStatistic: 0, pValue: 1, W: 0, significant: false };
  }

  const diferencias = muestraA.map((a, i) => a - muestraB[i]).filter((d) => d !== 0);

  if (diferencias.length === 0) {
    return { zStatistic: 0, pValue: 1, W: 0, significant: false };
  }

  // Asignar rangos a los valores absolutos de las diferencias
  const datos = diferencias
    .map((d, idx) => ({ diff: d, abs: Math.abs(d), idx }))
    .sort((a, b) => a.abs - b.abs);

  // Manejar empates asignando rango promedio
  let i = 0;
  while (i < datos.length) {
    let j = i;
    while (j < datos.length && Math.abs(datos[j].abs - datos[i].abs) < 1e-9) {
      j++;
    }
    const rank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      datos[k].rank = rank;
    }
    i = j;
  }

  // Suma de rangos para diferencias positivas y negativas
  let Rplus = 0;
  let Rminus = 0;
  datos.forEach((d) => {
    if (d.diff > 0) Rplus += d.rank;
    else Rminus += d.rank;
  });

  const W = Math.min(Rplus, Rminus);
  const n = diferencias.length;

  // Aproximación normal para n > 15
  const mu = (n * (n + 1)) / 4;
  const sigma = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  const zStatistic = sigma === 0 ? 0 : (W - mu) / sigma;

  const pValueOneSided = normalCDF(zStatistic);
  const pValue = pValueOneSided * 2;

  return {
    zStatistic,
    pValue,
    W,
    Rplus,
    Rminus,
    significant: pValue < 0.05,
  };
}

/**
 * McNemar's test.
 * Compara dos clasificadores binarios (acierto/fallo) en los mismos ejemplos.
 * Útil para comparar si dos modelos cometen errores significativamente diferentes.
 *
 * @param {boolean[]} aciertosA - true si modelo A acertó en cada usuario
 * @param {boolean[]} aciertosB - true si modelo B acertó en cada usuario
 * @returns {object} { chi2, pValue, significant }
 */
export function mcNemarTest(aciertosA, aciertosB) {
  if (aciertosA.length !== aciertosB.length || aciertosA.length === 0) {
    return { chi2: 0, pValue: 1, significant: false };
  }

  let ambosCorrectos = 0;
  let ambosIncorrectos = 0;
  let aCorrectoBIncorrecto = 0;
  let aIncorrectoBCorrecto = 0;

  for (let i = 0; i < aciertosA.length; i++) {
    if (aciertosA[i] && aciertosB[i]) ambosCorrectos++;
    else if (!aciertosA[i] && !aciertosB[i]) ambosIncorrectos++;
    else if (aciertosA[i] && !aciertosB[i]) aCorrectoBIncorrecto++;
    else aIncorrectoBCorrecto++;
  }

  // Estadístico chi2 con corrección de continuidad
  const denominador = aCorrectoBIncorrecto + aIncorrectoBCorrecto;
  const chi2 =
    denominador === 0
      ? 0
      : Math.pow(Math.abs(aCorrectoBIncorrecto - aIncorrectoBCorrecto) - 1, 2) /
        denominador;

  // p-value para chi2 con 1 grado de libertad: P(χ² > x) ≈ 1 - CDF normal(sqrt(x))
  const pValue = denominador === 0 ? 1 : 2 * (1 - normalCDF(Math.sqrt(chi2)));

  return {
    chi2,
    pValue,
    ambosCorrectos,
    ambosIncorrectos,
    aCorrectoBIncorrecto,
    aIncorrectoBCorrecto,
    significant: pValue < 0.05,
  };
}

/**
 * Cohen's d para muestras pareadas.
 * Mide el tamaño del efecto de la diferencia entre dos modelos.
 *
 * @param {number[]} muestraA
 * @param {number[]} muestraB
 * @returns {number} d de Cohen
 */
export function cohensD(muestraA, muestraB) {
  if (muestraA.length !== muestraB.length || muestraA.length === 0) return 0;
  const diferencias = muestraA.map((a, i) => a - muestraB[i]);
  const { media: meanDiff, desviacion: stdDiff } = mediaYDesviacion(diferencias);
  return stdDiff === 0 ? 0 : meanDiff / stdDiff;
}

/**
 * Interpretación textual del tamaño del efecto de Cohen's d.
 */
export function interpretarCohensD(d) {
  const abs = Math.abs(d);
  if (abs < 0.2) return "Efecto insignificante";
  if (abs < 0.5) return "Efecto pequeño";
  if (abs < 0.8) return "Efecto mediano";
  return "Efecto grande";
}

/**
 * Compara un modelo contra múltiples baselines usando t-test y Wilcoxon.
 * Devuelve un objeto con los resultados de cada comparación.
 *
 * @param {object} resultadosModelo - Resultado de evaluarRecomendador para el modelo principal
 * @param {object} resultadosBaselines - Map { nombre: resultado }
 * @param {string} metrica - Nombre de la métrica a comparar (ej: 'hitRate', 'ndcg')
 * @returns {object} Comparaciones por baseline
 */
export function compararConBaselines(resultadosModelo, resultadosBaselines, metrica) {
  const metricasPorUsuario = resultadosModelo.metricasIndividuales || [];
  const muestraModelo = metricasPorUsuario.map((m) => m[metrica]);

  const comparaciones = {};

  Object.entries(resultadosBaselines).forEach(([nombre, resultadoBaseline]) => {
    const baselinePorUsuario = resultadoBaseline.metricasIndividuales || [];
    const muestraBaseline = baselinePorUsuario.map((m) => m[metrica]);

    const ttest = pairedTTest(muestraModelo, muestraBaseline);
    const wilcoxon = wilcoxonSignedRank(muestraModelo, muestraBaseline);
    const d = cohensD(muestraModelo, muestraBaseline);

    comparaciones[nombre] = {
      ttest,
      wilcoxon,
      cohensD: d,
      interpretacion: interpretarCohensD(d),
    };
  });

  return comparaciones;
}

/**
 * Calcula intervalos de confianza bootstrap para un array de valores.
 * (Versión local; también existe en EvaluacionModelo.js)
 */
export function bootstrapCI(valores, iteraciones = 1000, alpha = 0.05) {
  if (!valores || valores.length === 0) return { media: 0, lower: 0, upper: 0 };

  const n = valores.length;
  const medias = [];

  for (let i = 0; i < iteraciones; i++) {
    let suma = 0;
    for (let j = 0; j < n; j++) {
      suma += valores[Math.floor(Math.random() * n)];
    }
    medias.push(suma / n);
  }

  medias.sort((a, b) => a - b);
  return {
    media: valores.reduce((a, b) => a + b, 0) / valores.length,
    lower: medias[Math.floor((alpha / 2) * iteraciones)],
    upper: medias[Math.floor((1 - alpha / 2) * iteraciones)],
  };
}

export default {
  pairedTTest,
  wilcoxonSignedRank,
  mcNemarTest,
  cohensD,
  interpretarCohensD,
  compararConBaselines,
  bootstrapCI,
};
