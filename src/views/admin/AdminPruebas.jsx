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
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
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
      setProgreso('Generando usuarios sintéticos...');
      const usuarios = generarUsuariosSinteticos(config.usuarios, config.seed, {
        minCompras: 4,
        maxCompras: 18,
      });
      const statsDataset = estadisticasDataset(usuarios);

      // 2. Crear recomendadores
      setProgreso('Inicializando modelos...');
      const redNeuronal = new RedNeuronalEvaluator();
      const random = new RandomRecommender(config.seed);
      const popularity = new PopularityRecommender();
      const content = new ContentBasedRecommender();
      const categoryFav = new CategoryFavoriteRecommender();

      // 3. Evaluar cada modelo
      setProgreso('Evaluando Red Neuronal (esto puede tardar)...');
      const resultadoRN = await evaluarRecomendador(redNeuronal, usuarios, config.k);

      setProgreso('Evaluando baselines...');
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
      setProgreso('Calculando intervalos de confianza...');
      const intervalosRN = intervalosConfianzaPorMetrica(resultadoRN, 1000);

      // 5. Tests estadísticos
      setProgreso('Ejecutando tests estadísticos...');
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
      setError('Error ejecutando evaluación: ' + err.message);
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
      { metrica: 'Usuarios sintéticos', valor: resultados.statsDataset.totalUsuarios },
      { metrica: 'Total compras', valor: resultados.statsDataset.totalCompras },
      { metrica: 'Promedio compras/usuario', valor: resultados.statsDataset.promedioCompras },
      ...Object.entries(resultados.statsDataset.comprasPorCategoria).map(([cat, val]) => ({
        metrica: `Compras ${cat}`,
        valor: val,
      })),
    ]);
    XLSX.utils.book_append_sheet(wb, wsDataset, 'Dataset');

    // Hoja 2: Métricas comparativas
    const filasMetricas = metricasVisibles.map((m) => {
      const fila = { Metrica: m.label };
      fila['Red Neuronal'] = formatear(resultados.resultadoRN[m.key], m.sufijo);
      Object.entries(resultados.resultadosBaselines).forEach(([nombre, res]) => {
        fila[nombre] = formatear(res[m.key], m.sufijo);
      });
      return fila;
    });
    const wsMetricas = XLSX.utils.json_to_sheet(filasMetricas);
    XLSX.utils.book_append_sheet(wb, wsMetricas, 'Metricas');

    // Hoja 3: Intervalos de confianza Red Neuronal
    const filasIC = Object.entries(resultados.intervalosRN).map(([key, ic]) => ({
      Metrica: key,
      Media: ic.media,
      'IC 95% Inferior': ic.lower,
      'IC 95% Superior': ic.upper,
    }));
    const wsIC = XLSX.utils.json_to_sheet(filasIC);
    XLSX.utils.book_append_sheet(wb, wsIC, 'Intervalos Confianza');

    // Hoja 4: Tests estadísticos
    const filasTests = [];
    metricasParaTests.forEach((metrica) => {
      const label = metricasVisibles.find((m) => m.key === metrica)?.label || metrica;
      Object.entries(resultados.testsPorMetrica[metrica]).forEach(([baseline, test]) => {
        filasTests.push({
          Metrica: label,
          Baseline: baseline,
          'T-Statistic': test.ttest.tStatistic.toFixed(4),
          'T-Test p-value': test.ttest.pValue.toFixed(4),
          'T-Test Significativo': test.ttest.significant ? 'Sí' : 'No',
          'Wilcoxon Z': test.wilcoxon.zStatistic.toFixed(4),
          'Wilcoxon p-value': test.wilcoxon.pValue.toFixed(4),
          'Wilcoxon Significativo': test.wilcoxon.significant ? 'Sí' : 'No',
          "Cohen's d": test.cohensD.toFixed(4),
          Interpretacion: test.interpretacion,
        });
      });
    });
    const wsTests = XLSX.utils.json_to_sheet(filasTests);
    XLSX.utils.book_append_sheet(wb, wsTests, 'Tests Estadisticos');

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
          Módulo de Pruebas
        </h2>
        <p className="text-muted mt-1">
          Evaluación estadística robusta del modelo de recomendación con IA
        </p>
      </div>

      {/* Panel de configuración */}
      <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
          <Target className="mr-2 text-purple-600" size={20} />
          Configuración de la evaluación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Usuarios sintéticos
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={config.usuarios}
              onChange={(e) => setConfig({ ...config, usuarios: parseInt(e.target.value) || 40 })}
              className="w-full px-3 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recomendado: ≥30 para t-test válido</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Top-K</label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.k}
              onChange={(e) => setConfig({ ...config, k: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Número de recomendaciones a evaluar</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semilla</label>
            <input
              type="number"
              value={config.seed}
              onChange={(e) => setConfig({ ...config, seed: parseInt(e.target.value) || 42 })}
              className="w-full px-3 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Para reproducibilidad</p>
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
            <span>{cargando ? 'Evaluando...' : 'Ejecutar evaluación'}</span>
          </button>

          {resultados && (
            <button
              onClick={exportarExcel}
              className="flex items-center space-x-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download size={18} />
              <span>Exportar Excel</span>
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
              Dataset sintético generado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">Usuarios</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {resultados.statsDataset.totalUsuarios}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300">Total compras</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {resultados.statsDataset.totalCompras}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-700 dark:text-purple-300">Compras / usuario</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {resultados.statsDataset.promedioCompras}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Distribución por categoría:</p>
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
          </div>

          {/* Tabla comparativa */}
          <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <BarChart3 className="mr-2 text-purple-600" size={20} />
              Comparación de modelos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Métrica</th>
                    <th className="px-4 py-3 text-center font-semibold text-purple-700 dark:text-purple-400">
                      Red Neuronal
                    </th>
                    {Object.keys(resultados.resultadosBaselines).map((nombre) => (
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
                      <td className="px-4 py-3 text-center font-bold text-purple-700 dark:text-purple-400">
                        {formatear(resultados.resultadoRN[m.key], m.sufijo)}
                      </td>
                      {Object.entries(resultados.resultadosBaselines).map(([nombre, res]) => (
                        <td key={nombre} className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                          {formatear(res[m.key], m.sufijo)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <TrendingUp className="mr-2 text-blue-600" size={20} />
                Comparación de métricas
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={datosComparativos}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="metrica" angle={-45} textAnchor="end" height={80} tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: ejeColor }} />
                  {Object.keys(coloresModelos).map((nombre) => (
                    <Bar
                      key={nombre}
                      dataKey={nombre}
                      fill={coloresModelos[nombre]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                <Brain className="mr-2 text-purple-600" size={20} />
                Radar de rendimiento
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={datosRadar}>
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis dataKey="metrica" tick={{ fill: ejeColor, fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: ejeColor, fontSize: 10 }} />
                  {Object.keys(coloresModelos).map((nombre) => (
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
            </div>
          </div>

          {/* Intervalos de confianza */}
          <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <Sigma className="mr-2 text-indigo-600" size={20} />
              Intervalos de confianza 95% - Red Neuronal
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Métrica</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">Media</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                      IC 95% Inferior
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                      IC 95% Superior
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.entries(resultados.intervalosRN).map(([key, ic]) => {
                    const label = metricasVisibles.find((m) => m.key === key)?.label || key;
                    return (
                      <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                        <td className="px-4 py-3 text-center text-foreground">{ic.media.toFixed(3)}</td>
                        <td className="px-4 py-3 text-center text-green-700 dark:text-green-400">
                          {ic.lower.toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-center text-green-700 dark:text-green-400">
                          {ic.upper.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tests estadísticos */}
          <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={20} />
              Tests de significancia estadística
            </h3>
            <p className="text-sm text-muted mb-4">
              Comparación de la Red Neuronal contra cada baseline. p-value {'<'} 0.05 indica
              diferencia estadísticamente significativa.
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
                            Baseline
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            t-statistic
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            t-test p-value
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            Wilcoxon p-value
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            Cohen's d
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                            Significativo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(resultados.testsPorMetrica[metrica]).map(
                          ([baseline, test]) => (
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
                                    <CheckCircle size={12} className="mr-1" /> Sí
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                                    No
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
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
