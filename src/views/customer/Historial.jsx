import React from 'react';
import { ShoppingCart, TrendingUp, Calendar } from 'lucide-react';
import ProductImage from '../../components/common/ProductImage';

const Historial = ({ historialCompras }) => {
  const totalGastado = historialCompras.reduce((sum, p) => sum + p.precio, 0);
  const categoriasFrecuentes = historialCompras.reduce((acc, producto) => {
    acc[producto.categoria] = (acc[producto.categoria] || 0) + 1;
    return acc;
  }, {});
  const categoriaFavorita = Object.entries(categoriasFrecuentes).sort((a, b) => b[1] - a[1])[0];
  const promedioCompra = historialCompras.length > 0 ? (totalGastado / historialCompras.length).toFixed(2) : 0;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📋 Mis Compras</h2>
        <p className="text-gray-600">Revisa todas tus compras anteriores</p>
      </div>
      
      {historialCompras.length === 0 ? (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 text-lg font-semibold mb-2">Aún no has realizado compras</p>
          <p className="text-gray-500 text-sm">Comienza a explorar nuestro catálogo</p>
        </div>
      ) : (
        <div>
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart size={24} />
                <div className="text-right">
                  <p className="text-purple-100 text-xs">Total de compras</p>
                  <p className="text-3xl font-bold">{historialCompras.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={24} />
                <div className="text-right">
                  <p className="text-green-100 text-xs">Total gastado</p>
                  <p className="text-3xl font-bold">${totalGastado}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <Calendar size={24} />
                <div className="text-right">
                  <p className="text-blue-100 text-xs">Promedio por compra</p>
                  <p className="text-3xl font-bold">${promedioCompra}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de compras */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Todas tus compras ({historialCompras.length})</h3>
            <div className="space-y-3">
              {historialCompras.map((producto, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition border border-gray-200"
                >
                  <div className="flex items-center space-x-4">
                    <ProductImage
                      producto={producto}
                      className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-2 flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-gray-800">{producto.nombre}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">
                          {producto.categoria}
                        </span>
                        <span className="text-xs text-gray-500">
                          Compra #{historialCompras.length - index}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatearFecha(producto.fechaCompra)}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {producto.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">${producto.precio}</span>
                    <p className="text-xs text-gray-500 mt-1">Pago exitoso</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Historial;
