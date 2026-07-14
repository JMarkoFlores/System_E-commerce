import React, { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, DollarSign, ShoppingBag, Award, BarChart3,
} from "lucide-react";
import { EMOJI_CATEGORIAS } from "../../utils/productos";
import { useTheme } from "../../contexts/ThemeContext";

const COLORES = [
  "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#6366F1",
];

const AdminGraficas = ({ historialCompras }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const datosGraficas = useMemo(() => {
    if (historialCompras.length === 0) {
      return { categorias: [], topProductos: [], gastoPorCategoria: [], evolucionCompras: [], totalGastado: 0, totalProductos: 0 };
    }

    const conteoCategoria = {};
    historialCompras.forEach((compra) => {
      conteoCategoria[compra.categoria] = (conteoCategoria[compra.categoria] || 0) + 1;
    });

    const categorias = Object.entries(conteoCategoria)
      .map(([nombre, cantidad]) => ({ nombre, cantidad, emoji: EMOJI_CATEGORIAS[nombre] || "📦" }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const conteoProductos = {};
    historialCompras.forEach((compra) => {
      const key = compra.nombre;
      if (!conteoProductos[key]) {
        conteoProductos[key] = { nombre: compra.nombre, cantidad: 0, precioUnitario: compra.precio, totalGastado: 0, categoria: compra.categoria };
      }
      conteoProductos[key].cantidad += 1;
      conteoProductos[key].totalGastado += compra.precio;
    });

    const topProductos = Object.values(conteoProductos).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8);

    const gastoPorCategoria = {};
    historialCompras.forEach((compra) => {
      gastoPorCategoria[compra.categoria] = (gastoPorCategoria[compra.categoria] || 0) + compra.precio;
    });

    const gastoCategoria = Object.entries(gastoPorCategoria)
      .map(([nombre, total]) => ({ nombre, total: Math.round(total), emoji: EMOJI_CATEGORIAS[nombre] || "📦" }))
      .sort((a, b) => b.total - a.total);

    const comprasPorFecha = historialCompras.reduce((acc, compra) => {
      const fecha = new Date(compra.fechaCompra).toLocaleDateString("es-ES", { month: "short", day: "numeric" });
      if (!acc[fecha]) acc[fecha] = { fecha, compras: 0, gasto: 0 };
      acc[fecha].compras += 1;
      acc[fecha].gasto += compra.precio;
      return acc;
    }, {});

    const evolucionCompras = Object.values(comprasPorFecha);
    const totalGastado = historialCompras.reduce((sum, c) => sum + c.precio, 0);
    const totalProductos = historialCompras.length;

    return { categorias, topProductos, gastoPorCategoria: gastoCategoria, evolucionCompras, totalGastado, totalProductos };
  }, [historialCompras]);

  const TarjetaEstadistica = ({ icono: Icono, titulo, valor, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-lg shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{titulo}</p>
          <p className="text-3xl font-bold mt-1">{valor}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-full">
          <Icono size={28} />
        </div>
      </div>
    </div>
  );

  const ejeColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const tooltipBg = isDark ? '#1f2937' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#f9fafb' : '#111827';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg shadow-lg border" style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}>
          <p className="font-semibold text-sm" style={{ color: tooltipText }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">{entry.name}: {entry.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (historialCompras.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
        <BarChart3 size={64} className="mx-auto mb-4 text-yellow-500" />
        <h3 className="text-2xl font-bold text-foreground mb-2">No hay datos para mostrar</h3>
        <p className="text-muted">Realiza algunas compras para ver las estadísticas y gráficas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <BarChart3 size={40} />
          <div>
            <h2 className="text-3xl font-bold">Análisis de Compras</h2>
            <p className="text-purple-100">Visualiza los patrones de consumo de los clientes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TarjetaEstadistica icono={ShoppingBag} titulo="Total de Compras" valor={`${datosGraficas.totalProductos} productos`} color="from-purple-500 to-purple-600" />
        <TarjetaEstadistica icono={DollarSign} titulo="Gasto Total" valor={`$${datosGraficas.totalGastado.toLocaleString()}`} color="from-blue-500 to-blue-600" />
        <TarjetaEstadistica icono={Award} titulo="Categoría Favorita" valor={`${datosGraficas.categorias[0]?.emoji} ${datosGraficas.categorias[0]?.nombre}`} color="from-green-500 to-green-600" />
        <TarjetaEstadistica icono={TrendingUp} titulo="Promedio por Compra" valor={`$${Math.round(datosGraficas.totalGastado / datosGraficas.totalProductos)}`} color="from-orange-500 to-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <ShoppingBag className="mr-2 text-purple-600" size={24} /> Productos por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosGraficas.categorias}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <YAxis tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
                {datosGraficas.categorias.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <TrendingUp className="mr-2 text-blue-600" size={24} /> Distribución de Compras
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={datosGraficas.categorias} cx="50%" cy="50%" labelLine={false} label={({ nombre, cantidad }) => `${nombre}: ${cantidad}`} outerRadius={100} fill="#8884d8" dataKey="cantidad">
                {datosGraficas.categorias.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <DollarSign className="mr-2 text-green-600" size={24} /> Gasto Total por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosGraficas.gastoPorCategoria} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis type="number" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <YAxis dataKey="nombre" type="category" width={120} tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                {datosGraficas.gastoPorCategoria.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
            <TrendingUp className="mr-2 text-orange-600" size={24} /> Evolución de Compras
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosGraficas.evolucionCompras}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="fecha" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <YAxis yAxisId="left" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: ejeColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: ejeColor }} />
              <Line yAxisId="left" type="monotone" dataKey="compras" stroke="#8B5CF6" strokeWidth={3} name="Compras" dot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="gasto" stroke="#3B82F6" strokeWidth={3} name="Gasto ($)" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-lg p-6 border border-border">
        <h3 className="text-xl font-bold text-foreground mb-4 flex items-center">
          <Award className="mr-2 text-yellow-600" size={24} /> Top Productos Más Comprados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ranking</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Total Gastado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {datosGraficas.topProductos.map((producto, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">{index + 1}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{producto.nombre}</td>
                  <td className="px-4 py-3 text-muted">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      {EMOJI_CATEGORIAS[producto.categoria]} {producto.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-semibold">{producto.cantidad}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">${producto.totalGastado.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminGraficas;
