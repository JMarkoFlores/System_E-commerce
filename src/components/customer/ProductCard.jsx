import React, { useState } from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EMOJI_CATEGORIAS } from '../../utils/productos';

const ProductCard = ({ producto, onAddToCart, onBuyNow }) => {
  const { t } = useTranslation();
  const [imagenCargada, setImagenCargada] = useState(true);
  const [imagenError, setImagenError] = useState(false);

  const handleImagenError = () => {
    setImagenError(true);
    setImagenCargada(false);
  };

  const handleImagenCarga = () => {
    setImagenCargada(true);
    setImagenError(false);
  };

  const isValidImage = producto.imagen && (
    producto.imagen.startsWith('http') ||
    producto.imagen.startsWith('data:')
  );

  return (
    <div className="bg-surface rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-border">
      {/* Imagen del producto */}
      <div className="relative h-48 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 overflow-hidden group flex items-center justify-center">
        {isValidImage && !imagenError ? (
          <>
            <img
              src={producto.imagen}
              alt={producto.nombre}
              className={`w-full h-full object-contain p-4 transition-all duration-300 group-hover:scale-105 ${
                imagenCargada ? 'opacity-100' : 'opacity-0'
              }`}
              onError={handleImagenError}
              onLoad={handleImagenCarga}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl z-10 group-hover:scale-110 transition-transform duration-300">
                {EMOJI_CATEGORIAS[producto.categoria] || '📦'}
              </div>
            </div>
          </>
        )}
        
        {/* Badge de categoría */}
        <span className="absolute top-3 right-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-purple-800 dark:text-purple-200 text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20">
          {t(`categories.${producto.categoria}`, { defaultValue: producto.categoria })}
        </span>
      </div>
      
      {/* Contenido */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-foreground line-clamp-2 flex-1">
            {producto.nombre}
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {producto.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">${producto.precio}</span>
          </div>
          <div className="flex items-center text-yellow-500">
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-semibold ml-1">4.5</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onAddToCart(producto)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-1"
          >
            <ShoppingCart size={16} />
            <span>{t('catalog.addToCart')}</span>
          </button>
          <button
            onClick={() => onBuyNow(producto)}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            {t('catalog.buyNow')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
