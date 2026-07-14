import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="text-purple-600" size={32} />
            <h1 className="text-2xl font-bold text-foreground">TechStore AI</h1>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <div className="flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-lg">
              <User size={20} className="text-purple-600 dark:text-purple-300" />
              <span className="font-semibold text-purple-800 dark:text-purple-200">{user?.email}</span>
            </div>

            <NavLink
              to="/carrito"
              className="relative p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              <ShoppingCart size={24} className="text-blue-600 dark:text-blue-300" />
              {carritoCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm border-2 border-surface">
                  {carritoCount}
                </span>
              )}
            </NavLink>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            >
              <LogOut size={20} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navegación por pestañas */}
      <nav className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex space-x-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg font-semibold transition ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
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
