import React from 'react';
import { ShoppingCart, X, ArrowLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import ProductImage from '../../components/common/ProductImage';

const Carrito = ({ carrito, onRemoverDelCarrito, onFinalizarCompra }) => {
  const total = carrito.reduce((sum, p) => sum + p.precio, 0);

  return (
    <div>
      <div className="flex items-center mb-6">
        <NavLink to="/catalogo" className="mr-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-foreground">
          <ArrowLeft size={20} />
        </NavLink>
        <h2 className="text-2xl font-bold text-foreground">🛒 Carrito de Compras</h2>
      </div>
      
      {carrito.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
          <ShoppingCart size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-muted text-lg font-semibold mb-2">Tu carrito está vacío</p>
          <NavLink to="/catalogo" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            Explorar catálogo
          </NavLink>
        </div>
      ) : (
        <div>
          <div className="space-y-4 mb-6">
            {carrito.map((producto, index) => (
              <div key={index} className="bg-surface rounded-lg shadow p-4 flex justify-between items-center hover:shadow-md transition border border-border">
                <div className="flex items-center space-x-4">
                  <ProductImage
                    producto={producto}
                    className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-2"
                  />
                  <div>
                    <h3 className="font-bold text-foreground">{producto.nombre}</h3>
                    <p className="text-sm text-muted">{producto.categoria}</p>
                    <div className="flex gap-1 mt-1">
                      {producto.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xl font-bold text-foreground">${producto.precio}</span>
                  <button
                    onClick={() => onRemoverDelCarrito(index)}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-muted">
                <span>Productos ({carrito.length}):</span>
                <span className="font-semibold">${total}</span>
              </div>
              <div className="flex justify-between items-center text-muted">
                <span>Envío:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">GRATIS</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="text-xl font-bold text-foreground">Total:</span>
                <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">${total}</span>
              </div>
            </div>
            
            <button
              onClick={onFinalizarCompra}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold text-lg shadow-md hover:shadow-lg"
            >
              Finalizar Compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carrito;
