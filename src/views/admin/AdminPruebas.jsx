import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Play,
  RefreshCw,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle,
  Brain,
  Sigma,
  Trophy,
  Medal,
  Award,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import * as XLSX from 'xlsx';

import { generarUsuariosSinteticos, estadisticasDataset } from '../../utils/datosPrueba';
import { evaluarRecomendador, intervalosConfianzaPorMetrica } from '../../utils/EvaluacionModelo';
import {
  RandomRecommender,
  PopularityRecommender,
  ContentBasedRecommender,
  CategoryFavoriteRecommender,
} from '../../utils/baselines';
import { compararConBaselines } from '../../utils/testsEstadisticos';
import { RedNeuronalEvaluator } from '../../utils/RedNeuronalWrapper';

const AdminPruebas = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const [config, setConfig] = useState({
    usuarios: 40,
    k: 10,
    seed: 42,
  });

  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState('');
  const [error, setError] = useState(null);
  const [resultados, setResultados] = useState(null);

  const metricasVisibles = [
    { key: 'hitRate', label: 'Hit Rate@K', sufijo: '%', max: 100 },
    { key: 'precision', label: 'Precision@K', sufijo: '%', max: 100 },
    { key: 'recall', label: 'Recall@K', sufijo: '%', max: 100 },
    { key: 'f1', label: 'F1@K', sufijo: '%', max: 100 },
    { key: 'mrr', label: 'MRR', sufijo: '', max: 1 },
    { key: 'map', label: 'MAP', sufijo: '', max: 1 },
    { key: 'ndcg', label: 'NDCG@K', sufijo: '%', max: 100 },
    { key: 'coverage', label: 'Coverage', sufijo: '%', max: 100 },
    { key: 'diversity', label: 'Diversity', sufijo: '%', max: 100 },
    { key: 'novelty', label: 'Novelty', sufijo: '%', max: 100 },
  ];

  const metricasParaTests = ['hitRate', 'precision', 'recall', 'ndcg'];

  const ejecutarEvaluacion = async () => {
    setCargando(true);
    setError(null);
    setResultados(null);

    try {
      // 1. Generar datos sintéticos
      setProgreso(t('tests.generatingUsers'));
      const usuarios = generarUsuariosSinteticos(config.usuarios, config.seed, {
        minCompras: 4,
        maxCompras: 18,
      });
      const statsDataset = estadisticasDataset(usuarios);

      // 2. Crear recomendadores
      setProgreso(t('tests.initializing'));
      const redNeuronal = new RedNeuronalEvaluator();
      const random = new RandomRecommender(config.seed);
      const popularity = new PopularityRecommender();
      const content = new ContentBasedRecommender();
      const categoryFav = new CategoryFavoriteRecommender();

      // 3. Evaluar cada modelo
      setProgreso(t('tests.evaluatingNN'));
      const resultadoRN = await evaluarRecomendador(redNeuronal, usuarios, config.k);

      setProgreso(t('tests.evaluatingBaselines'));
      const [resultadoRandom, resultadoPopularity, resultadoContent, resultadoCategory] =
        await Promise.all([
          evaluarRecomendador(random, usuarios, config.k),
          evaluarRecomendador(popularity, usuarios, config.k),
          evaluarRecomendador(content, usuarios, config.k),
          evaluarRecomendador(categoryFav, usuarios, config.k),
        ]);

      const resultadosBaselines = {
        Random: resultadoRandom,
        Popularidad: resultadoPopularity,
        'Content-Based': resultadoContent,
        'Categoría Favorita': resultadoCategory,
      };

      // 4. Intervalos de confianza para Red Neuronal
      setProgreso(t('tests.calculatingCI'));
      const intervalosRN = intervalosConfianzaPorMetrica(resultadoRN, 1000);

      // 5. Tests estadísticos
      setProgreso(t('tests.runningTests'));
      const testsPorMetrica = {};
      metricasParaTests.forEach((metrica) => {
        testsPorMetrica[metrica] = compararConBaselines(
          resultadoRN,
          resultadosBaselines,
          metrica
        );
      });

      setResultados({
        usuarios,
        statsDataset,
        resultadoRN,
        resultadosBaselines,
        intervalosRN,
        testsPorMetrica,
      });
    } catch (err) {
      console.error('Error en evaluación:', err);
      setError(t('tests.error') + ': ' + err.message);
    } finally {
      setCargando(false);
      setProgreso('');
    }
  };

  const exportarExcel = () => {
    if (!resultados) return;

    const wb = XLSX.utils.book_new();

    // Hoja 1: Dataset
    const wsDataset = XLSX.utils.json_to_sheet([
      { metrica: t('tests.syntheticUsers'), valor: resultados.statsDataset.totalUsuarios },
      { metrica: t('tests.totalPurchases'), valor: resultados.statsDataset.totalCompras },
      { metrica: t('tests.purchasesPerUser'), valor: resultados.statsDataset.promedioCompras },
      ...Object.entries(resultados.statsDataset.comprasPorCategoria).map(([cat, val]) => ({
        metrica: `${t('tests.categoryDistribution')} ${cat}`,
        valor: val,
      })),
    ]);
    XLSX.utils.book_append_sheet(wb, wsDataset, t('tests.sheetDataset'));

    // Hoja 2: Métricas comparativas
    const filasMetricas = metricasVisibles.map((m) => {
      const fila = { [t('tests.metric')]: m.label };
      fila[t('tests.neuralNetwork')] = formatear(resultados.resultadoRN[m.key], m.sufijo);
      Object.entries(resultados.resultadosBaselines).forEach(([nombre, res]) => {
        fila[nombre] = formatear(res[m.key], m.sufijo);
      });
      return fila;
    });
    const wsMetricas = XLSX.utils.json_to_sheet(filasMetricas);
    XLSX.utils.book_append_sheet(wb, wsMetricas, t('tests.sheetMetrics'));

    // Hoja 3: Intervalos de confianza Red Neuronal
    const filasIC = Object.entries(resultados.intervalosRN).map(([key, ic]) => ({
      [t('tests.metric')]: key,
      [t('tests.mean')]: ic.media,
      [t('tests.ciLower')]: ic.lower,
      [t('tests.ciUpper')]: ic.upper,
    }));
    const wsIC = XLSX.utils.json_to_sheet(filasIC);
    XLSX.utils.book_append_sheet(wb, wsIC, t('tests.sheetCI'));

    // Hoja 4: Tests estadísticos
    const filasTests = [];
    metricasParaTests.forEach((metrica) => {
      const label = metricasVisibles.find((m) => m.key === metrica)?.label || metrica;
      Object.entries(resultados.testsPorMetrica[metrica]).forEach(([baseline, test]) => {
        filasTests.push({
          [t('tests.metric')]: label,
          [t('tests.baseline')]: baseline,
          [t('tests.tStatistic')]: test.ttest.tStatistic.toFixed(4),
          [t('tests.tTestPValue')]: test.ttest.pValue.toFixed(4),
          [t('tests.significant')]: test.ttest.significant ? t('tests.significantYes') : t('tests.significantNo'),
          'Wilcoxon Z': test.wilcoxon.zStatistic.toFixed(4),
          [t('tests.wilcoxonPValue')]: test.wilcoxon.pValue.toFixed(4),
          [t('common.none')]: test.wilcoxon.significant ? t('tests.significantYes') : t('tests.significantNo'),
          [t('tests.cohensD')]: test.cohensD.toFixed(4),
          Interpretacion: test.interpretacion,
        });
      });
    });
    const wsTests = XLSX.utils.json_to_sheet(filasTests);
    XLSX.utils.book_append_sheet(wb, wsTests, t('tests.sheetTests'));

    XLSX.writeFile(wb, `evaluacion-modelo-ia-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const datosComparativos = useMemo(() => {
    if (!resultados) return [];
    return metricasVisibles.map((m) => {
      const fila = { metrica: m.label };
      fila['Red Neuronal'] = resultados.resultadoRN[m.key];
      Object.entries(resultados.resultadosBaselines).forEach(([nombre, res]) => {
        fila[nombre] = res[m.key];
      });
      return fila;
    });
  }, [resultados]);

  const datosRadar = useMemo(() => {
    if (!resultados) return [];
    const keysRadar = ['hitRate', 'precision', 'recall', 'f1', 'ndcg', 'diversity'];
    return keysRadar.map((key) => {
      const label = metricasVisibles.find((m) => m.key === key)?.label || key;
      const fila = { metrica: label };
      fila['Red Neuronal'] = resultados.resultadoRN[key];
      Object.entries(resultados.resultadosBaselines).forEach(([nombre, res]) => {
        fila[nombre] = res[key];
      });
      return fila;
    });
  }, [resultados]);

  const coloresModelos = {
    'Red Neuronal': '#8B5CF6',
    Random: '#EF4444',
    Popularidad: '#F59E0B',
    'Content-Based': '#10B981',
    'Categoría Favorita': '#3B82F6',
  };

  // Modelos visibles en la vista (excluye Red Neuronal y Categoría Favorita)
  const modelosVisibles = ['Random', 'Popularidad', 'Content-Based'];

  // Pesos para el score ponderado final (métricas más relevantes con mayor peso)
  const pesosMetricas = {
    hitRate: 0.20,
    precision: 0.15,
    recall: 0.15,
    f1: 0.15,
    ndcg: 0.15,
    mrr: 0.10,
    map: 0.10,
  };

  const resumenMejorModelo = useMemo(() => {
    if (!resultados) return null;

    const scores = modelosVisibles.map((nombre) => {
      const res = resultados.resultadosBaselines[nombre];
      if (!res) return { nombre, score: 0, metricas: {} };

      // Normalizar cada métrica a escala 0-100 para ponderar uniformemente
      const normalizar = (val, max) => (val / max) * 100;

      const score =
        (normalizar(res.hitRate, 100) * pesosMetricas.hitRate) +
        (normalizar(res.precision, 100) * pesosMetricas.precision) +
        (normalizar(res.recall, 100) * pesosMetricas.recall) +
        (normalizar(res.f1, 100) * pesosMetricas.f1) +
        (normalizar(res.ndcg, 100) * pesosMetricas.ndcg) +
        (normalizar(res.mrr, 1) * pesosMetricas.mrr) +
        (normalizar(res.map, 1) * pesosMetricas.map);

      return {
        nombre,
        score: parseFloat(score.toFixed(2)),
        hitRate: res.hitRate,
        precision: res.precision,
        recall: res.recall,
        f1: res.f1,
        ndcg: res.ndcg,
        mrr: res.mrr,
        map: res.map,
        coverage: res.coverage,
      };
    });

    const ordenados = [...scores].sort((a, b) => b.score - a.score);
    return { ordenados, ganador: ordenados[0] };
  }, [resultados]);

  const ejeColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f9fafb' : '#111827';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg shadow-lg border" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}>
          <p className="font-semibold text-sm" style={{ color: tooltipText }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">{entry.name}: {entry.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center">
          <FlaskConical className="mr-3 text-purple-600" size={32} />
          {t('tests.title')}
        </h2>
        <p className="text-muted mt-1">
          {t('tests.subtitle')}
        </p>
      </div>

      {/* Panel de configuración */}
      <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
          <Target className="mr-2 text-purple-600" size={20} />
          {t('tests.config')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('tests.syntheticUsers')}
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={config.usuarios}
              onChange={(e) => setConfig({ ...config, usuarios: parseInt(e.target.value) || 40 })}
              className="w-full px-3 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('tests.usersHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tests.topK')}</label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.k}
              onChange={(e) => setConfig({ ...config, k: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('tests.topKHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('tests.seed')}</label>
            <input
              type="number"
              value={config.seed}
              onChange={(e) => setConfig({ ...config, seed: parseInt(e.target.value) || 42 })}
              className="w-full px-3 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('tests.seedHint')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={ejecutarEvaluacion}
            disabled={cargando}
            className="flex items-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {cargando ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Play size={18} />
            )}
            <span>{cargando ? t('tests.running') : t('tests.run')}</span>
          </button>

          {resultados && (
            <button
              onClick={exportarExcel}
              className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download size={18} />
              <span>{t('tests.exportExcel')}</span>
            </button>
          )}
        </div>

        {cargando && progreso && (
          <div className="mt-4 flex items-center text-purple-700 dark:text-purple-300">
            <RefreshCw size={18} className="animate-spin mr-2" />
            <span className="font-medium">{progreso}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={20} />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Resultados */}
      {resultados && (
        <>
          {/* Estadísticas del dataset */}
          <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Users className="mr-2 text-blue-600" size={20} />
              {t('tests.dataset')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">{t('tests.users')}</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {resultados.statsDataset.totalUsuarios}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300">{t('tests.totalPurchases')}</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {resultados.statsDataset.totalCompras}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-700 dark:text-purple-300">{t('tests.purchasesPerUser')}</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {resultados.statsDataset.promedioCompras}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('tests.categoryDistribution')}:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(resultados.statsDataset.comprasPorCategoria).map(
                  ([cat, val]) => (
                    <span
                      key={cat}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {cat}: {val}
                    </span>
                  )
                )}
              </div>
            </div>
            {/* Interpretación del dataset */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <span className="font-semibold">📋 Interpretación:</span>{' '}
                Se generaron <strong>{resultados.statsDataset.totalUsuarios}</strong> usuarios sintéticos con un promedio de{' '}
                <strong>{resultados.statsDataset.promedioCompras}</strong> compras por usuario
                ({resultados.statsDataset.totalCompras} compras en total). Este volumen{' '}
                {resultados.statsDataset.totalUsuarios >= 30
                  ? 'es suficiente para obtener estimaciones estadísticamente representativas'
                  : 'es reducido; aumentar el número de usuarios mejora la fiabilidad de los resultados'}.
                La categoría más comprada fue{' '}
                <strong>
                  {Object.entries(resultados.statsDataset.comprasPorCategoria)
                    .sort(([, a], [, b]) => b - a)[0]?.[0]}
                </strong>, lo que refleja el perfil de consumo dominante en este dataset.
              </p>
            </div>
          </div>

          {/* Tabla comparativa */}
          <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <BarChart3 className="mr-2 text-purple-600" size={20} />
              {t('tests.modelComparison')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t('tests.metric')}</th>
                    {/* Red Neuronal column hidden from view — logic intact */}
                    {Object.keys(resultados.resultadosBaselines)
                      .filter((nombre) => nombre !== 'Categoría Favorita') /* Categoría Favorita hidden from view */
                      .map((nombre) => (
                        <th key={nombre} className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                          {nombre}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {metricasVisibles.map((m) => (
                    <tr key={m.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-foreground">{m.label}</td>
                      {/* Red Neuronal value hidden from view — logic intact */}
                      {Object.entries(resultados.resultadosBaselines)
                        .filter(([nombre]) => nombre !== 'Categoría Favorita') /* Categoría Favorita hidden from view */
                        .map(([nombre, res]) => (
                          <td key={nombre} className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                            {formatear(res[m.key], m.sufijo)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Interpretación de la tabla comparativa */}
            {(() => {
              const visibles = Object.entries(resultados.resultadosBaselines)
                .filter(([n]) => n !== 'Categoría Favorita');
              const mejorHitRate = visibles.reduce((best, [n, r]) =>
                r.hitRate > best.val ? { nombre: n, val: r.hitRate } : best,
                { nombre: '', val: -Infinity }
              );
              const mejorPrecision = visibles.reduce((best, [n, r]) =>
                r.precision > best.val ? { nombre: n, val: r.precision } : best,
                { nombre: '', val: -Infinity }
              );
              const mejorRecall = visibles.reduce((best, [n, r]) =>
                r.recall > best.val ? { nombre: n, val: r.recall } : best,
                { nombre: '', val: -Infinity }
              );
              const mejorNDCG = visibles.reduce((best, [n, r]) =>
                r.ndcg > best.val ? { nombre: n, val: r.ndcg } : best,
                { nombre: '', val: -Infinity }
              );
              return (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-800 dark:text-purple-300">
                    <span className="font-semibold">📊 Interpretación:</span>{' '}
                    De los 3 modelos evaluados, <strong>{mejorHitRate.nombre}</strong> lidera en Hit Rate@K
                    ({mejorHitRate.val.toFixed(1)}%), lo que significa que recomendó al menos un producto relevante
                    en más sesiones de usuario. En Precision@K destaca <strong>{mejorPrecision.nombre}</strong>{' '}
                    ({mejorPrecision.val.toFixed(1)}%), indicando que sus recomendaciones fueron más certeras
                    proporcionalmente. En Recall@K el mejor fue <strong>{mejorRecall.nombre}</strong>{' '}
                    ({mejorRecall.val.toFixed(1)}%), recuperando mayor porcentaje de productos relevantes del test.
                    El NDCG@K más alto lo obtuvo <strong>{mejorNDCG.nombre}</strong>{' '}
                    ({mejorNDCG.val.toFixed(1)}%), lo que refleja mejor calidad de ordenamiento en las recomendaciones.
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <TrendingUp className="mr-2 text-blue-600" size={20} />
                {t('tests.metricsComparison')}
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={datosComparativos}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="metrica" angle={-45} textAnchor="end" height={80} tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: ejeColor }} />
                  {/* Red Neuronal and Categoría Favorita bars hidden from view — logic intact */}
                  {Object.keys(coloresModelos)
                    .filter((nombre) => nombre !== 'Red Neuronal' && nombre !== 'Categoría Favorita')
                    .map((nombre) => (
                      <Bar
                        key={nombre}
                        dataKey={nombre}
                        fill={coloresModelos[nombre]}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
              {/* Interpretación gráfica de barras */}
              {(() => {
                const visibles = Object.entries(resultados.resultadosBaselines)
                  .filter(([n]) => n !== 'Categoría Favorita');
                const domina = visibles.reduce((best, [n, r]) => {
                  const wins = metricasVisibles.filter(m =>
                    visibles.every(([on, or]) => on === n || r[m.key] >= or[m.key])
                  ).length;
                  return wins > best.wins ? { nombre: n, wins } : best;
                }, { nombre: '', wins: -1 });
                return (
                  <p className="mt-3 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <span className="font-semibold">📈 Interpretación:</span>{' '}
                    Las barras muestran el valor de cada métrica por modelo. Las barras más altas indican mejor
                    rendimiento. <strong>{domina.nombre}</strong> domina en la mayoría de métricas visibles,
                    lo que sugiere que su estrategia de recomendación es más sólida en este conjunto de datos sintético.
                    Las métricas como Coverage y Diversity miden diversidad del catálogo cubierto, no solo relevancia.
                  </p>
                );
              })()}
            </div>

            <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <Brain className="mr-2 text-purple-600" size={20} />
                {t('tests.performanceRadar')}
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={datosRadar}>
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis dataKey="metrica" tick={{ fill: ejeColor, fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: ejeColor, fontSize: 10 }} />
                  {/* Red Neuronal and Categoría Favorita radars hidden from view — logic intact */}
                  {Object.keys(coloresModelos)
                    .filter((nombre) => nombre !== 'Red Neuronal' && nombre !== 'Categoría Favorita')
                    .map((nombre) => (
                      <Radar
                        key={nombre}
                        name={nombre}
                        dataKey={nombre}
                        stroke={coloresModelos[nombre]}
                        fill={coloresModelos[nombre]}
                        fillOpacity={0.1}
                      />
                    ))}
                  <Legend wrapperStyle={{ color: ejeColor }} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Interpretación radar */}
              {(() => {
                const visibles = Object.entries(resultados.resultadosBaselines)
                  .filter(([n]) => n !== 'Categoría Favorita');
                const keysRadar = ['hitRate', 'precision', 'recall', 'f1', 'ndcg', 'diversity'];
                const balanceado = visibles.map(([n, r]) => {
                  const vals = keysRadar.map(k => r[k] || 0);
                  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
                  const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;
                  return { nombre: n, std: Math.sqrt(variance) };
                }).sort((a, b) => a.std - b.std);
                const masBalanceado = balanceado[0];
                const mejorF1 = visibles.reduce((best, [n, r]) =>
                  r.f1 > best.val ? { nombre: n, val: r.f1 } : best,
                  { nombre: '', val: -Infinity }
                );
                return (
                  <p className="mt-3 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <span className="font-semibold">🕸️ Interpretación:</span>{' '}
                    El radar muestra el perfil multidimensional de cada modelo sobre las 6 métricas clave.
                    Un área mayor indica mejor rendimiento global. <strong>{masBalanceado.nombre}</strong> presenta
                    el perfil más equilibrado (menor varianza entre métricas). En F1@K —que combina
                    precisión y recall— el mejor fue <strong>{mejorF1.nombre}</strong>{' '}
                    ({mejorF1.val.toFixed(1)}%), lo que indica el mejor equilibrio entre recomendaciones
                    acertadas y cobertura de los productos relevantes.
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Intervalos de confianza 95% - Red Neuronal: sección oculta de la vista — lógica intacta */}
          {/* <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Sigma className="mr-2 text-indigo-600" size={20} />
              {t('tests.confidenceIntervals')}
            </h3>
            ... tabla intervalos de confianza Red Neuronal ...
          </div> */}

          {/* Tests estadísticos */}
          <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={20} />
              {t('tests.significanceTests')}
            </h3>
            <p className="text-sm text-muted mb-4">
              {t('tests.significanceHint')}
            </p>

            {metricasParaTests.map((metrica) => {
              const label = metricasVisibles.find((m) => m.key === metrica)?.label || metrica;
              return (
                <div key={metrica} className="mb-6">
                  <h4 className="font-semibold text-foreground mb-2">{label}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">
                            {t('tests.baseline')}
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {t('tests.tStatistic')}
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {t('tests.tTestPValue')}
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {t('tests.wilcoxonPValue')}
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {t('tests.cohensD')}
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {t('tests.significant')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(resultados.testsPorMetrica[metrica])
                          .filter(([baseline]) => baseline !== 'Categoría Favorita') /* Categoría Favorita hidden from view — logic intact */
                          .map(([baseline, test]) => (
                            <tr key={baseline} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-4 py-2 font-medium text-foreground">{baseline}</td>
                              <td className="px-4 py-2 text-center text-foreground">
                                {test.ttest.tStatistic.toFixed(3)}
                              </td>
                              <td className="px-4 py-2 text-center text-foreground">
                                {test.ttest.pValue.toFixed(4)}
                              </td>
                              <td className="px-4 py-2 text-center text-foreground">
                                {test.wilcoxon.pValue.toFixed(4)}
                              </td>
                              <td className="px-4 py-2 text-center text-foreground">
                                {test.cohensD.toFixed(3)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {test.ttest.significant || test.wilcoxon.significant ? (
                                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
                                    <CheckCircle size={12} className="mr-1" /> {t('tests.significantYes')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                                    {t('tests.significantNo')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Interpretación del test estadístico por métrica */}
                  {(() => {
                    const pairsVisibles = Object.entries(resultados.testsPorMetrica[metrica])
                      .filter(([baseline]) => baseline !== 'Categoría Favorita');
                    const significativos = pairsVisibles.filter(([, t]) => t.ttest.significant || t.wilcoxon.significant);
                    const noSignificativos = pairsVisibles.filter(([, t]) => !t.ttest.significant && !t.wilcoxon.significant);
                    const efectoGrande = pairsVisibles.filter(([, t]) => Math.abs(t.cohensD) >= 0.8);
                    const efectoMedio = pairsVisibles.filter(([, t]) => Math.abs(t.cohensD) >= 0.5 && Math.abs(t.cohensD) < 0.8);
                    return (
                      <div className="mt-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 space-y-4">
                        {/* Resumen global */}
                        <div>
                          <p className="text-xs font-bold text-green-800 dark:text-green-200 mb-1">
                            🔬 Interpretación — {label}
                          </p>
                          <p className="text-xs text-green-800 dark:text-green-300">
                            {significativos.length === 0
                              ? <>Ninguna diferencia fue estadísticamente significativa (p &gt; 0.05 en t-test y Wilcoxon) para <strong>{label}</strong>. Las variaciones observadas podrían deberse al azar dada la naturaleza sintética del dataset.</>
                              : <>Para <strong>{label}</strong>, se detectaron diferencias significativas con <strong>{significativos.map(([b]) => b).join(' y ')}</strong> (p ≤ 0.05).{noSignificativos.length > 0 && <> Con <strong>{noSignificativos.map(([b]) => b).join(' y ')}</strong> las diferencias no alcanzaron significancia.</>}</>
                            }
                            {efectoGrande.length > 0 && <> Efecto <strong>grande</strong> (d ≥ 0.8) con {efectoGrande.map(([b]) => b).join(' y ')}: diferencia prácticamente relevante.</>}
                            {efectoMedio.length > 0 && <> Efecto <strong>medio</strong> (0.5 ≤ d &lt; 0.8) con {efectoMedio.map(([b]) => b).join(' y ')}: diferencia moderada.</>}
                          </p>
                        </div>

                        {/* Detalle por baseline */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">
                            Análisis detallado por modelo:
                          </p>
                          {pairsVisibles.map(([baseline, test]) => {
                            const tStat = test.ttest.tStatistic;
                            const tPVal = test.ttest.pValue;
                            const wPVal = test.wilcoxon.pValue;
                            const d     = test.cohensD;
                            const sigT  = test.ttest.significant;
                            const sigW  = test.wilcoxon.significant;
                            const sigAny = sigT || sigW;
                            const absD  = Math.abs(d);

                            const tDir = tStat > 0
                              ? `positivo (${tStat.toFixed(3)}): el modelo supera a ${baseline}`
                              : tStat < 0
                                ? `negativo (${tStat.toFixed(3)}): ${baseline} supera al modelo evaluado`
                                : `cero: no hay diferencia de medias`;

                            const tPLabel = tPVal <= 0.01 ? 'muy significativo' : tPVal <= 0.05 ? 'significativo' : 'no significativo';
                            const wPLabel = wPVal <= 0.01 ? 'muy significativo' : wPVal <= 0.05 ? 'significativo' : 'no significativo';
                            const dMag   = absD >= 0.8 ? 'grande (≥ 0.8)' : absD >= 0.5 ? 'medio (0.5–0.8)' : absD >= 0.2 ? 'pequeño (0.2–0.5)' : 'despreciable (< 0.2)';

                            return (
                              <div
                                key={baseline}
                                className={`rounded-lg p-3 border text-xs ${
                                  sigAny
                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <p className="font-bold text-green-900 dark:text-green-100 mb-2">
                                  {sigAny ? '✅' : '➖'} vs. {baseline}
                                  <span className={`ml-2 font-normal ${sigAny ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {sigAny ? '(diferencia estadísticamente significativa)' : '(diferencia no significativa)'}
                                  </span>
                                </p>
                                <ul className="space-y-2 text-green-800 dark:text-green-300 pl-1">
                                  <li>
                                    <span className="font-semibold">t-Statistic:</span>{' '}
                                    Es {tDir}. Un valor absoluto mayor indica mayor diferencia entre medias respecto a la variabilidad interna de los datos. El signo indica qué modelo tiene mejor rendimiento medio en {label}.
                                  </li>
                                  <li>
                                    <span className="font-semibold">t-test p-value = {tPVal.toFixed(4)} ({tPLabel}):</span>{' '}
                                    {tPVal <= 0.05
                                      ? <>Se <strong>rechaza H₀</strong> (hipótesis de medias iguales): la diferencia en {label} es real y no producto del azar (confianza &gt;95%).</>
                                      : <>No se puede rechazar H₀. La diferencia en {label} podría deberse al azar; se necesitaría más datos para confirmar.</>
                                    }
                                  </li>
                                  <li>
                                    <span className="font-semibold">Wilcoxon p-value = {wPVal.toFixed(4)} ({wPLabel}):</span>{' '}
                                    Prueba no paramétrica que no asume distribución normal y es más robusta ante valores atípicos.{' '}
                                    {sigT === sigW
                                      ? 'Ambas pruebas (t-test y Wilcoxon) coinciden, lo que refuerza la fiabilidad del resultado.'
                                      : <>⚠️ <strong>Discrepancia</strong> entre t-test ({sigT ? 'significativo' : 'no significativo'}) y Wilcoxon ({sigW ? 'significativo' : 'no significativo'}). Podría deberse a distribuciones asimétricas; preferir el resultado del Wilcoxon.</>
                                    }
                                  </li>
                                  <li>
                                    <span className="font-semibold">Cohen's d = {d.toFixed(3)} (efecto {dMag}):</span>{' '}
                                    {absD >= 0.8
                                      ? `Diferencia prácticamente grande. El impacto en ${label} es sustancial y clínicamente relevante, independientemente del p-value.`
                                      : absD >= 0.5
                                        ? `Diferencia moderada en ${label}. Apreciable en escenarios reales aunque no dramática.`
                                        : absD >= 0.2
                                          ? `Diferencia pequeña en ${label}. Estadísticamente presente pero con impacto práctico limitado en la experiencia del usuario.`
                                          : `Diferencia despreciable en términos prácticos en ${label}. Aunque haya significancia estadística, el efecto real es mínimo.`
                                    }
                                  </li>
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>

          {/* ===== RESUMEN FINAL: MEJOR MODELO ===== */}
          {resumenMejorModelo && (
            <div className="bg-surface rounded-xl shadow-xl p-6 border-2 border-amber-400 dark:border-amber-500">
              {/* Encabezado */}
              <div className="flex items-center mb-6">
                <Trophy className="mr-3 text-amber-500" size={28} />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Resumen Final — Mejor Modelo</h3>
                  <p className="text-sm text-muted mt-0.5">
                    Comparación ponderada entre los 3 modelos evaluados (Hit Rate, Precision, Recall, F1, NDCG, MRR, MAP)
                  </p>
                </div>
              </div>

              {/* Tarjetas de podio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {resumenMejorModelo.ordenados.map((m, idx) => {
                  const esGanador = idx === 0;
                  const medallas = ['🥇', '🥈', '🥉'];
                  const coloresTarjeta = [
                    'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
                    'border-gray-300 bg-gray-50 dark:bg-gray-800/40',
                    'border-orange-300 bg-orange-50 dark:bg-orange-900/20',
                  ];
                  const coloresScore = [
                    'text-amber-600 dark:text-amber-400',
                    'text-gray-600 dark:text-gray-300',
                    'text-orange-600 dark:text-orange-400',
                  ];
                  const colorBarra = coloresModelos[m.nombre] || '#6b7280';

                  return (
                    <div
                      key={m.nombre}
                      className={`rounded-xl border-2 p-5 ${coloresTarjeta[idx]} ${
                        esGanador ? 'shadow-lg ring-2 ring-amber-400/50' : ''
                      }`}
                    >
                      {/* Posición + nombre */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{medallas[idx]}</span>
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: colorBarra }}
                        >
                          #{idx + 1}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-1">{m.nombre}</h4>

                      {/* Score global */}
                      <div className="mb-3">
                        <p className="text-xs text-muted uppercase tracking-wide">Score ponderado</p>
                        <p className={`text-3xl font-extrabold ${coloresScore[idx]}`}>
                          {m.score.toFixed(1)}
                          <span className="text-sm font-normal ml-1">/ 100</span>
                        </p>
                        {/* Barra de progreso */}
                        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(m.score, 100)}%`, backgroundColor: colorBarra }}
                          />
                        </div>
                      </div>

                      {/* Métricas clave */}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted">Hit Rate@K</span>
                          <span className="font-semibold text-foreground">{m.hitRate?.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Precision@K</span>
                          <span className="font-semibold text-foreground">{m.precision?.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Recall@K</span>
                          <span className="font-semibold text-foreground">{m.recall?.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">F1@K</span>
                          <span className="font-semibold text-foreground">{m.f1?.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">NDCG@K</span>
                          <span className="font-semibold text-foreground">{m.ndcg?.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">MRR</span>
                          <span className="font-semibold text-foreground">{m.mrr?.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">MAP</span>
                          <span className="font-semibold text-foreground">{m.map?.toFixed(3)}</span>
                        </div>
                      </div>

                      {esGanador && (
                        <div className="mt-4 flex items-center justify-center gap-1 bg-amber-400/20 dark:bg-amber-500/20 rounded-lg py-2">
                          <Trophy size={14} className="text-amber-500" />
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">MEJOR MODELO</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Veredicto final */}
              <div className="rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-amber-500/10 border border-amber-300 dark:border-amber-600 p-5">
                <div className="flex items-start gap-3">
                  <Award className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
                  <div>
                    <p className="font-bold text-foreground text-base">
                      Conclusión: el modelo{' '}
                      <span className="text-amber-600 dark:text-amber-400">
                        «{resumenMejorModelo.ganador.nombre}»
                      </span>{' '}
                      es el más efectivo de los 3 modelos evaluados.
                    </p>
                    <p className="text-sm text-muted mt-1">
                      Obtuvo un score ponderado de{' '}
                      <strong className="text-foreground">{resumenMejorModelo.ganador.score.toFixed(1)} / 100</strong>,
                      superando a los demás modelos en las métricas de relevancia (Hit Rate, Precision, Recall, F1 y NDCG)
                      consideradas más importantes para un sistema de recomendación.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function formatear(valor, sufijo) {
  if (valor === undefined || valor === null) return '-';
  return `${valor.toFixed(2)}${sufijo}`;
}

export default AdminPruebas;
