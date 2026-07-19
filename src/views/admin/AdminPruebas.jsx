import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  RefreshCw,
  Trophy,
  Award,
  AlertCircle,
  Brain
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const AdminPruebas = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const [resumenMejorModelo, setResumenMejorModelo] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const coloresModelos = {
    'Random': '#EF4444',
    'Popularidad': '#F59E0B',
    'Content-Based': '#10B981',
    'Híbrido Ponderado': '#EC4899',
    'Híbrido Cascada': '#14B8A6',
  };

  const cargarResultados = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/resultados_streamlit.json?t=${timestamp}`);
      if (!response.ok) {
        throw new Error('No se encontraron resultados aún. Ejecuta las pruebas en Streamlit primero.');
      }
      const json = await response.json();
      if (json.ganador && json.ordenados) {
        setResumenMejorModelo(json);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('El archivo JSON no tiene el formato esperado.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Polling automático cada 5 segundos
  useEffect(() => {
    cargarResultados();
    const intervalId = setInterval(() => {
      cargarResultados();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

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

      {/* Controles: Ir a Streamlit */}
      <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
          <Brain className="mr-2 text-purple-600" size={20} />
          Pruebas Avanzadas (Motor Externo)
        </h3>
        
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
          La ejecución completa de las pruebas estadísticas y generación de datos se ha migrado a un motor analítico en Python (Streamlit). Al ejecutar las pruebas en Streamlit, los resultados se sincronizarán automáticamente con este panel.
        </p>

        <div className="flex flex-wrap gap-4 items-center">
          <a
            href="http://localhost:8501"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Brain size={18} />
            <span>Abrir pruebas avanzadas en Streamlit</span>
          </a>

          <button
            onClick={cargarResultados}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-foreground rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw size={18} />
            <span>Actualizar manualmente</span>
          </button>
          
          {lastUpdated && (
            <span className="text-xs text-muted ml-auto">
              Última sincronización: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={20} />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* ===== RESUMEN FINAL: MEJOR MODELO ===== */}
      {resumenMejorModelo && (
        <div className="bg-surface rounded-xl shadow-xl p-6 border-2 border-amber-400 dark:border-amber-500 transition-all duration-500">
          {/* Encabezado */}
          <div className="flex items-center mb-6">
            <Trophy className="mr-3 text-amber-500" size={28} />
            <div>
              <h3 className="text-xl font-bold text-foreground">Resumen Final — Rendimiento de Algoritmos</h3>
              <p className="text-sm text-muted mt-0.5">
                Comparación ponderada de todos los algoritmos exportada automáticamente desde el motor analítico.
              </p>
            </div>
          </div>

          {/* Tarjetas de todos los modelos */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {resumenMejorModelo.ordenados.map((m, idx) => {
              const esGanador = idx === 0;
              const medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              const coloresTarjeta = [
                'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
                'border-gray-300 bg-gray-50 dark:bg-gray-800/40',
                'border-orange-300 bg-orange-50 dark:bg-orange-900/20',
                'border-slate-300 bg-slate-50 dark:bg-slate-800/40',
                'border-zinc-300 bg-zinc-50 dark:bg-zinc-800/40',
              ];
              const coloresScore = [
                'text-amber-600 dark:text-amber-400',
                'text-gray-600 dark:text-gray-300',
                'text-orange-600 dark:text-orange-400',
                'text-slate-600 dark:text-slate-400',
                'text-zinc-600 dark:text-zinc-400',
              ];
              
              // Fallback para modelos en caso de añadir más
              const colorTarjeta = coloresTarjeta[idx] || coloresTarjeta[4];
              const colorScore = coloresScore[idx] || coloresScore[4];
              const medalla = medallas[idx] || `#${idx + 1}`;
              const colorBarra = coloresModelos[m.nombre] || '#8B5CF6';

              return (
                <div
                  key={m.nombre}
                  className={`rounded-xl border-2 p-5 ${colorTarjeta} ${
                    esGanador ? 'shadow-lg ring-2 ring-amber-400/50 scale-105 transform origin-bottom' : ''
                  }`}
                >
                  {/* Posición + nombre */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{medalla}</span>
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
                    <p className={`text-3xl font-extrabold ${colorScore}`}>
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
                      <span className="text-muted">NDCG@K</span>
                      <span className="font-semibold text-foreground">{m.ndcg?.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">MRR</span>
                      <span className="font-semibold text-foreground">{m.mrr?.toFixed(3)}</span>
                    </div>
                  </div>

                  {esGanador && (
                    <div className="mt-4 flex items-center justify-center gap-1 bg-amber-400/20 dark:bg-amber-500/20 rounded-lg py-2">
                      <Trophy size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">MEJOR ALGORITMO</span>
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
                  Veredicto del Motor de Pruebas: el modelo{' '}
                  <span className="text-amber-600 dark:text-amber-400">
                    «{resumenMejorModelo.ganador.nombre}»
                  </span>{' '}
                  es el más efectivo para el E-commerce.
                </p>
                <p className="text-sm text-muted mt-1">
                  Alcanzó un score ponderado de{' '}
                  <strong className="text-foreground">{resumenMejorModelo.ganador.score.toFixed(1)} / 100</strong>,
                  destacando en relevancia y exactitud. Puedes ver el análisis estadístico y de comportamiento profundo revisando la interfaz de Streamlit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPruebas;
