import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, DollarSign, ShoppingCart, Users, Package,
  TrendingUp, TrendingDown, MoreHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { reportesApi, pedidosApi } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import ProductImage from '../../components/common/ProductImage';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reporte, setReporte] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resReporte, resPedidos] = await Promise.all([
          reportesApi.gestion(),
          pedidosApi.getAll()
        ]);
        setReporte(resReporte.data);
        setPedidos(resPedidos.data.slice(0, 10));
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatearHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const kpis = [
    { titulo: t('dashboard.totalSales'), valor: `$${(reporte?.total_ingresos || 0).toLocaleString()}`, icono: DollarSign, color: 'from-purple-500 to-purple-600', trend: '+12%' },
    { titulo: t('dashboard.totalOrders'), valor: reporte?.total_pedidos || 0, icono: ShoppingCart, color: 'from-blue-500 to-blue-600', trend: '+8%' },
    { titulo: t('dashboard.registeredCustomers'), valor: reporte?.total_usuarios || 0, icono: Users, color: 'from-green-500 to-green-600', trend: '+15%' },
    { titulo: t('dashboard.lowStock'), valor: '<10', icono: Package, color: 'from-red-500 to-red-600', trend: '-3%' },
  ];

  // Datos de ejemplo para gráfica semanal si no hay ventas por día
  const ventasSemana = reporte?.ventas_por_dia?.length > 0
    ? reporte.ventas_por_dia.slice(-7)
    : [
        { fecha: 'Lun', total: 4000 },
        { fecha: 'Mar', total: 3000 },
        { fecha: 'Mié', total: 5000 },
        { fecha: 'Jue', total: 4500 },
        { fecha: 'Vie', total: 6000 },
        { fecha: 'Sáb', total: 5500 },
        { fecha: 'Dom', total: 7000 },
      ];

  const ejeColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center">
            <LayoutDashboard className="mr-3 text-purple-600" size={32} />
            {t('dashboard.title')}
          </h2>
          <p className="text-muted mt-1">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className={`bg-gradient-to-br ${kpi.color} rounded-xl shadow-lg p-6 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{kpi.titulo}</p>
                <p className="text-3xl font-bold mt-2">{kpi.valor}</p>
                <div className="flex items-center mt-2 text-sm">
                  {kpi.trend.startsWith('+') ? (
                    <TrendingUp size={16} className="mr-1" />
                  ) : (
                    <TrendingDown size={16} className="mr-1" />
                  )}
                  <span>{kpi.trend.startsWith('+') ? t('dashboard.trendUp', { value: kpi.trend.slice(1) }) : t('dashboard.trendDown', { value: kpi.trend })}</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <kpi.icono size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica de ventas */}
        <div className="lg:col-span-2 bg-surface rounded-xl shadow-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">{t('dashboard.weeklySales')}</h3>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <MoreHorizontal size={20} className="text-gray-400" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasSemana}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="fecha" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <Tooltip
                formatter={(value) => `$${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' }}
              />
              <Bar dataKey="total" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos recientes */}
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4">{t('dashboard.recentOrders')}</h3>
          {pedidos.length === 0 ? (
            <p className="text-muted text-center py-8">{t('dashboard.noOrders')}</p>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">Pedido #{pedido.id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pedido.usuario?.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatearFecha(pedido.fecha)} {formatearHora(pedido.fecha)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">${pedido.total}</p>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                      {pedido.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Productos populares */}
      <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4">{t('dashboard.popularProducts')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reporte?.categorias_top?.slice(0, 4).map((cat, index) => (
            <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-900/30">
              <p className="text-sm text-muted">{cat.categoria}</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{cat.cantidad}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.sales')} • ${cat.total.toLocaleString()}</p>
            </div>
          )) || (
            <p className="text-muted col-span-4 text-center py-4">{t('dashboard.noOrders')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
