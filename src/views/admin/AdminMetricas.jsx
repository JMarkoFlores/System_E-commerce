import React, { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { Target, TrendingUp, Award, Brain, CheckCircle, AlertCircle, Activity, Zap } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../../contexts/ThemeContext";

const AdminMetricas = ({ historialCompras, recomendaciones, estadisticasIA }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const metricas = useMemo(() => {
    if (historialCompras.length < 2) return null;

    const ultimasCompras = historialCompras.slice(-5);
    const categoriasRecientes = ultimasCompras.map((c) => c.categoria);
    const tagsRecientes = new Set(ultimasCompras.flatMap((c) => c.tags));

    let puntajeRelevancia = 0;
    recomendaciones.slice(0, 6).forEach((rec) => {
      let puntos = 0;
      if (categoriasRecientes.includes(rec.categoria)) puntos += 0.5;
      const tagsCoincidentes = rec.tags.filter((tag) => tagsRecientes.has(tag)).length;
      if (tagsCoincidentes > 0) puntos += 0.5;
      puntajeRelevancia += puntos;
    });

    const precisionAtK = recomendaciones.length > 0 ? (puntajeRelevancia / Math.min(recomendaciones.length, 6)) * 100 : 0;
    const scorePromedio = recomendaciones.length > 0 ? recomendaciones.reduce((sum, r) => sum + (r.score || 0), 0) / recomendaciones.length : 0;
    const umbral = Math.max(scorePromedio * 0.7, 0.2);
    const recomendacionesAltas = recomendaciones.filter((r) => (r.score || 0) > umbral).length;
    const hitRate = recomendaciones.length > 0 ? (recomendacionesAltas / recomendaciones.length) * 100 : 0;
    const categoriasRec = new Set(recomendaciones.map((r) => r.categoria));
    const diversidad = recomendaciones.length > 0 ? (categoriasRec.size / 7) * 100 : 0;
    const categoriasCompradas = historialCompras.slice(-10).map((c) => c.categoria);
    const recRelevantes = recomendaciones.filter((r) => categoriasCompradas.includes(r.categoria)).length;
    const relevancia = recomendaciones.length > 0 ? (recRelevantes / recomendaciones.length) * 100 : 0;
    const lossActual = estadisticasIA?.historialEntrenamiento?.slice(-1)[0]?.loss || 1;
    const accuracy = Math.max(0, Math.min(100, (1 - lossActual) * 100));
    const scorePromedioDisplay = scorePromedio * 100;
    const evolucionLoss = estadisticasIA?.historialEntrenamiento?.slice(-5).map((h) => ({
      generacion: t('metrics.generationLabel', { number: h.generacion }),
      loss: (h.loss * 100).toFixed(2),
      compras: h.numCompras,
    })) || [];
    const cobertura = (categoriasRec.size / 7) * 100;
    const categoriaFavorita = [...historialCompras.reduce((acc, c) => {
      acc.set(c.categoria, (acc.get(c.categoria) || 0) + 1);
      return acc;
    }, new Map())].sort((a, b) => b[1] - a[1])[0]?.[0];
    const recNovedosas = recomendaciones.filter((r) => r.categoria !== categoriaFavorita).length;
    const novedad = recomendaciones.length > 0 ? (recNovedosas / recomendaciones.length) * 100 : 0;
    const scores = recomendaciones.map((r) => r.score || 0);
    const maxScore = Math.max(...scores, 0);
    const minScore = Math.min(...scores, 1);
    const confianza = maxScore > 0 ? ((maxScore - minScore) / maxScore) * 100 : 0;

    return {
      precisionAtK: precisionAtK.toFixed(1),
      hitRate: hitRate.toFixed(1),
      diversidad: diversidad.toFixed(1),
      relevancia: relevancia.toFixed(1),
      accuracy: accuracy.toFixed(1),
      scorePromedio: scorePromedioDisplay.toFixed(1),
      evolucionLoss,
      cobertura: cobertura.toFixed(1),
      novedad: novedad.toFixed(1),
      confianza: confianza.toFixed(1),
      totalRecomendaciones: recomendaciones.length,
      aciertos: recomendacionesAltas,
    };
  }, [historialCompras, recomendaciones, estadisticasIA]);

  const datosRadar = metricas ? [
    { metrica: t('metrics.precisionAtK'), valor: parseFloat(metricas.precisionAtK), fullMark: 100 },
    { metrica: t('metrics.relevance'), valor: parseFloat(metricas.relevancia), fullMark: 100 },
    { metrica: t('metrics.diversity'), valor: parseFloat(metricas.diversidad), fullMark: 100 },
    { metrica: t('metrics.novelty'), valor: parseFloat(metricas.novedad), fullMark: 100 },
    { metrica: t('metrics.coverage'), valor: parseFloat(metricas.cobertura), fullMark: 100 },
    { metrica: t('metrics.modelAccuracy'), valor: parseFloat(metricas.accuracy), fullMark: 100 },
  ] : [];

  const TarjetaMetrica = ({ icono: Icono, tituloKey, valor, maxValor = 100, color, descripcionKey, sufijo = "%" }) => {
    const porcentaje = (valor / maxValor) * 100;
    const isGood = porcentaje >= 70;
    const isMedium = porcentaje >= 40 && porcentaje < 70;

    const bgIcon = color.replace("border-", isDark ? "bg-" : "bg-").replace("600", isDark ? "900/30" : "100");
    const textIcon = color.replace("border-", "text-").replace("600", isDark ? "400" : "600");

    return (
      <div className={`bg-surface rounded-lg shadow-lg p-6 border-l-4 ${color} border border-border`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${bgIcon}`}>
              <Icono className={textIcon} size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted">{t(tituloKey)}</h3>
              <p className="text-3xl font-bold text-foreground mt-1">{valor}{sufijo}</p>
            </div>
          </div>
          <div>
            {isGood && <CheckCircle className="text-green-500" size={24} />}
            {isMedium && <AlertCircle className="text-yellow-500" size={24} />}
            {!isGood && !isMedium && <AlertCircle className="text-red-500" size={24} />}
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div className={`h-2 rounded-full ${isGood ? "bg-green-500" : isMedium ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(porcentaje, 100)}%` }}></div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t(descripcionKey)}</p>
      </div>
    );
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

  if (!metricas) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
        <Activity size={64} className="mx-auto mb-4 text-yellow-500" />
        <h3 className="text-2xl font-bold text-foreground mb-2">{t('metrics.noData')}</h3>
        <p className="text-muted">{t('metrics.noDataHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity size={40} />
            <div>
              <h2 className="text-3xl font-bold">{t('metrics.title')}</h2>
              <p className="text-indigo-100">{t('metrics.subtitle')}</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-xs text-indigo-100">{t('metrics.generation')}</div>
            <div className="text-2xl font-bold">#{estadisticasIA?.generacion || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4 flex items-center"><Brain className="mr-2" size={24} /> {t('metrics.modelStatus')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><div className="text-sm opacity-90">{t('metrics.activeRecommendations')}</div><div className="text-3xl font-bold">{metricas.totalRecomendaciones}</div></div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><div className="text-sm opacity-90">{t('metrics.detectedHits')}</div><div className="text-3xl font-bold">{metricas.aciertos}</div></div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><div className="text-sm opacity-90">{t('metrics.averageScore')}</div><div className="text-3xl font-bold">{metricas.scorePromedio}%</div></div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><div className="text-sm opacity-90">{t('metrics.confidence')}</div><div className="text-3xl font-bold">{metricas.confianza}%</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TarjetaMetrica icono={Target} tituloKey="metrics.precisionAtK" valor={metricas.precisionAtK} color="border-purple-600" descripcionKey="metrics.precisionDesc" />
        <TarjetaMetrica icono={CheckCircle} tituloKey="metrics.hitRate" valor={metricas.hitRate} color="border-green-600" descripcionKey="metrics.hitRateDesc" />
        <TarjetaMetrica icono={TrendingUp} tituloKey="metrics.relevance" valor={metricas.relevancia} color="border-blue-600" descripcionKey="metrics.relevanceDesc" />
        <TarjetaMetrica icono={Award} tituloKey="metrics.modelAccuracy" valor={metricas.accuracy} color="border-indigo-600" descripcionKey="metrics.accuracyDesc" />
        <TarjetaMetrica icono={Zap} tituloKey="metrics.diversity" valor={metricas.diversidad} color="border-orange-600" descripcionKey="metrics.diversityDesc" />
        <TarjetaMetrica icono={Activity} tituloKey="metrics.novelty" valor={metricas.novedad} color="border-pink-600" descripcionKey="metrics.noveltyDesc" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center"><Target className="mr-2 text-purple-600" size={24} /> {t('metrics.multidimensional')}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={datosRadar}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="metrica" tick={{ fill: ejeColor, fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: ejeColor, fontSize: 10 }} />
              <Radar name="Rendimiento" dataKey="valor" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center"><TrendingUp className="mr-2 text-blue-600" size={24} /> {t('metrics.lossEvolution')}</h3>
          {metricas.evolucionLoss.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricas.evolucionLoss}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="generacion" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: ejeColor }} />
                <Line type="monotone" dataKey="loss" stroke="#3B82F6" strokeWidth={3} name={t('metrics.lossLabel')} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted py-8">{t('metrics.lossEvolutionHint')}</div>
          )}
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center"><Award className="mr-2 text-green-600" size={24} /> {t('metrics.keyMetricsComparison')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ nombre: t('metrics.precisionShort'), valor: parseFloat(metricas.precisionAtK) }, { nombre: t('metrics.relevanceShort'), valor: parseFloat(metricas.relevancia) }, { nombre: t('metrics.accuracyShort'), valor: parseFloat(metricas.accuracy) }, { nombre: t('metrics.hitRateShort'), valor: parseFloat(metricas.hitRate) }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="nombre" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <YAxis domain={[0, 100]} tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} content={<CustomTooltip />} />
              <Bar dataKey="valor" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center"><Brain className="mr-2 text-indigo-600" size={24} /> {t('metrics.improvementTitle')}</h3>
          <div className="space-y-3">
            {parseFloat(metricas.accuracy) < 70 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded"><p className="text-sm text-gray-700 dark:text-gray-200"><strong>{t('metrics.lowAccuracy')}</strong> {t('metrics.lowAccuracyDesc')}</p></div>
            )}
            {parseFloat(metricas.diversidad) < 50 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded"><p className="text-sm text-gray-700 dark:text-gray-200"><strong>{t('metrics.lowDiversity')}</strong> {t('metrics.lowDiversityDesc')}</p></div>
            )}
            {parseFloat(metricas.accuracy) >= 70 && parseFloat(metricas.diversidad) >= 50 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded"><p className="text-sm text-gray-700 dark:text-gray-200"><strong>{t('metrics.excellentPerformance')}</strong> {t('metrics.excellentPerformanceDesc')}</p></div>
            )}
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 rounded"><p className="text-sm text-gray-700 dark:text-gray-200"><strong>{t('metrics.trainingInfoLabel')}</strong> {t('metrics.trainingInfo', { generation: estadisticasIA?.generacion || 0 })}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMetricas;
