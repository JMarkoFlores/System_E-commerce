import React, { useState } from 'react';
import { EMOJI_CATEGORIAS } from '../../utils/productos';

const ProductImage = ({ producto, className = '', fallbackClassName = '' }) => {
  const [error, setError] = useState(false);

  const isValidImage = producto.imagen && (
    producto.imagen.startsWith('http') ||
    producto.imagen.startsWith('data:')
  );

  if (!isValidImage || error) {
    return (
      <div className={`bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center ${fallbackClassName || className}`}>
        <span className="text-4xl">
          {EMOJI_CATEGORIAS[producto.categoria] || '📦'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={producto.imagen}
      alt={producto.nombre}
      className={`object-contain ${className}`}
      onError={() => setError(true)}
    />
  );
};

export default ProductImage;
