import React from 'react';
import { TrendingUp, Star, Zap, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductImage from '../../components/common/ProductImage';

const Recomendaciones = ({ recomendaciones, historialCompras, onAddToCart, onBuyNow, estadisticasIA }) => {
  const { t } = useTranslation();
  return (
    <div>
      {/* Banner de IA */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Brain size={32} className="animate-pulse" />
            <div>
              <h2 className="text-2xl font-bold">{t('recommendations.title')}</h2>
              <p className="text-purple-100 text-sm">
                {t('recommendations.subtitle', { generation: estadisticasIA?.generacion || 0 })}
              </p>
            </div>
          </div>
          {historialCompras.length > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-xs text-purple-100">{t('recommendations.modelAccuracy')}</div>
              <div className="text-2xl font-bold">{Math.min(85 + historialCompras.length * 2, 99)}%</div>
            </div>
          )}
        </div>
        <p className="text-purple-100">
          {t('recommendations.description')}
        </p>
      </div>

      {historialCompras.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
          <Star size={48} className="mx-auto mb-4 text-yellow-500" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            {t('recommendations.emptyTitle')}
          </h3>
          <p className="text-muted">
            {t('recommendations.emptyDescription')}
          </p>
        </div>
      ) : (
        <>
          {/* Estadísticas de aprendizaje */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface rounded-lg shadow p-4 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{t('recommendations.analyzedPurchases')}</p>
                  <p className="text-2xl font-bold text-foreground">{historialCompras.length}</p>
                </div>
                <TrendingUp className="text-purple-500" size={24} />
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{t('recommendations.exploredCategories')}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(historialCompras.map(h => h.categoria)).size}
                  </p>
                </div>
                <Star className="text-blue-500" size={24} />
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{t('recommendations.activeRecommendations')}</p>
                  <p className="text-2xl font-bold text-foreground">{recomendaciones.length}</p>
                </div>
                <Zap className="text-green-500" size={24} />
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{t('recommendations.aiGeneration')}</p>
                  <p className="text-2xl font-bold text-foreground">#{estadisticasIA?.generacion || 0}</p>
                </div>
                <Brain className="text-orange-500" size={24} />
              </div>
            </div>
          </div>

          {/* Productos recomendados */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              🎯 {t('recommendations.selectedForYou')}
            </h3>
            <span className="text-sm text-muted">
              {t('recommendations.updatedRealtime')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recomendaciones.map((producto, index) => (
              <div key={producto.id} className="bg-surface rounded-lg shadow-md border-2 border-purple-200 dark:border-purple-900/50 hover:shadow-xl hover:border-purple-400 dark:hover:border-purple-700 transition-all relative overflow-hidden">
                {/* Badge de ranking */}
                {index < 3 && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 z-10">
                    <Star size={12} fill="currentColor" />
                    <span>{t('recommendations.top', { rank: index + 1 })}</span>
                  </div>
                )}

                {/* Badge de categoría */}
                <span className="absolute top-2 right-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs font-semibold px-3 py-1 rounded-full z-10">
                  {t(`categories.${producto.categoria}`, { defaultValue: producto.categoria })}
                </span>

                {/* Imagen del producto */}
                <ProductImage
                  producto={producto}
                  className="w-full h-40 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-lg"
                />

                {/* Contenido */}
                <div className="px-6 pb-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-foreground flex-1">{producto.nombre}</h3>
                    <span className="text-2xl font-bold text-foreground ml-2">${producto.precio}</span>
                  </div>
                  
                  {/* Razón de recomendación */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-2 mb-3">
                    <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                      💡 {producto.razon || t('recommendations.recommendedForYou')}
                    </p>
                  </div>

                  {/* Score de IA */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted font-semibold">{t('recommendations.matchLevel')}:</span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {(producto.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${producto.score * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {producto.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAddToCart(producto)}
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md hover:shadow-lg"
                    >
                      🛒 {t('catalog.addToCart')}
                    </button>
                    <button
                      onClick={() => onBuyNow(producto)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold shadow-md hover:shadow-lg"
                    >
                      {t('catalog.buyNow')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje educativo */}
          <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-900/30 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <Brain size={32} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-foreground mb-2">{t('recommendations.howItWorks')}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {t('recommendations.howItWorksDescription')}
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ {t('recommendations.patterns')}</li>
                  <li>✓ {t('recommendations.priceRange')}</li>
                  <li>✓ {t('recommendations.commonTags')}</li>
                  <li>✓ {t('recommendations.improves')}</li>
                  <li>✓ {t('recommendations.instant')}</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Recomendaciones;
