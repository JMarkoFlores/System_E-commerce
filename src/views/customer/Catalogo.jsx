import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
import ProductCard from '../../components/customer/ProductCard';
import { CATEGORIAS, EMOJI_CATEGORIAS } from '../../utils/productos';

const Catalogo = ({ productos, onAddToCart, onBuyNow }) => {
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const productosFiltrados = productos.filter(producto => {
    const cumpleCategoria = categoriaFiltro === 'Todas' || producto.categoria === categoriaFiltro;
    const cumpleBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                          producto.tags.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()));
    return cumpleCategoria && cumpleBusqueda;
  });

  const categoriasPorMostrar = categoriaFiltro === 'Todas' 
    ? [...new Set(productos.map(p => p.categoria))]
    : [categoriaFiltro];

  return (
    <div>
      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 bg-surface rounded-lg shadow-md p-4 border border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition font-semibold"
            >
              <Filter size={20} />
              <span>{categoriaFiltro}</span>
              <ChevronDown size={16} />
            </button>
            
            {mostrarFiltros && (
              <div className="absolute right-0 mt-2 bg-surface rounded-lg shadow-lg border border-border z-10 w-48">
                <button
                  onClick={() => {
                    setCategoriaFiltro('Todas');
                    setMostrarFiltros(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${categoriaFiltro === 'Todas' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 font-semibold' : 'text-foreground'}`}
                >
                  Todas las categorías
                </button>
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoriaFiltro(cat);
                      setMostrarFiltros(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${categoriaFiltro === cat ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 font-semibold' : 'text-foreground'}`}
                  >
                    {EMOJI_CATEGORIAS[cat]} {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted">
        Mostrando {productosFiltrados.length} productos
      </div>

      {/* Productos por categoría */}
      {categoriasPorMostrar.map(categoria => {
        const productosCategoria = productosFiltrados.filter(p => p.categoria === categoria);
        
        if (productosCategoria.length === 0) return null;
        
        return (
          <div key={categoria} className="mb-12">
            <div className="flex items-center mb-6">
              <h3 className="text-2xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                {EMOJI_CATEGORIAS[categoria]} {categoria}
              </h3>
              <div className="flex-1 h-1 bg-gradient-to-r from-purple-200 dark:from-purple-900 to-transparent ml-4 rounded"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {productosCategoria.map(producto => (
                <ProductCard
                  key={producto.id}
                  producto={producto}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          </div>
        );
      })}

      {productosFiltrados.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-foreground mb-2">No se encontraron productos</h3>
          <p className="text-muted">Intenta con otra búsqueda o categoría</p>
        </div>
      )}
    </div>
  );
};

export default Catalogo;
