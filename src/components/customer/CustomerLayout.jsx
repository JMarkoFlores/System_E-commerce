import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CustomerLayout = ({ carritoCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/catalogo', label: 'Catálogo' },
    { to: '/recomendaciones', label: 'Recomendaciones IA' },
    { to: '/historial', label: 'Mis Compras' },
    { to: '/carrito', label: 'Carrito' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="text-purple-600" size={32} />
            <h1 className="text-2xl font-bold text-gray-800">TechStore AI</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-purple-100 px-4 py-2 rounded-lg">
              <User size={20} className="text-purple-600" />
              <span className="font-semibold text-purple-800">{user?.email}</span>
            </div>

            <NavLink
              to="/carrito"
              className="relative p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
            >
              <ShoppingCart size={24} className="text-blue-600" />
              {carritoCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm border-2 border-white">
                  {carritoCount}
                </span>
              )}
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
            >
              <LogOut size={20} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegación por pestañas */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex space-x-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold transition ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
