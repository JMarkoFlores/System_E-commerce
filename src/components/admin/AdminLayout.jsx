import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  FileText,
  BarChart3,
  Activity,
  FlaskConical,
  LogOut,
  Menu,
  X,
  ShoppingCart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';
import LanguageSelector from '../../components/common/LanguageSelector';

const AdminLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { to: '/admin', label: t('nav.admin.dashboard'), icon: LayoutDashboard },
    { to: '/admin/productos', label: t('nav.admin.products'), icon: ShoppingBag },
    { to: '/admin/usuarios', label: t('nav.admin.users'), icon: Users },
    { to: '/admin/graficas', label: t('nav.admin.charts'), icon: BarChart3 },
    { to: '/admin/metricas', label: t('nav.admin.metrics'), icon: Activity },
    { to: '/admin/reportes', label: t('nav.admin.reports'), icon: FileText },
    { to: '/admin/pruebas', label: t('nav.admin.tests'), icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-surface shadow-lg flex-col border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="text-purple-600" size={28} />
            <h1 className="text-xl font-bold text-foreground">TechStore AI</h1>
          </div>
          <p className="text-xs text-muted mt-1">{t('nav.adminPanel')}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Users size={16} className="text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{user?.email}</p>
              <p className="text-xs text-muted">{t('roles.admin')}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <LanguageSelector className="flex-1" />
            <ThemeToggle className="flex-1 justify-center" />
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            >
              <LogOut size={18} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-surface shadow-lg border-r border-border">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h1 className="text-xl font-bold text-foreground">TechStore AI</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} className="text-foreground" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface shadow-sm border-b border-border p-4 flex justify-between items-center md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('roles.admin')}</h1>
          <button onClick={handleLogout}>
            <LogOut size={24} className="text-red-600" />
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
