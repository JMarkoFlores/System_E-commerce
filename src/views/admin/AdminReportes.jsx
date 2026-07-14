import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart, FileSpreadsheet } from 'lucide-react';
import { reportesApi } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdminReportes = () => {
  const [tipoReporte, setTipoReporte] = useState('operacional');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);

  const generarReporte = async () => {
    setCargando(true);
    try {
      const params = {};
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = tipoReporte === 'operacional'
        ? await reportesApi.operacional(params)
        : await reportesApi.gestion(params);

      setReporte(res.data);
    } catch (err) {
      alert('Error generando reporte: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!reporte) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Reporte ${tipoReporte === 'operacional' ? 'Operacional' : 'de Gesti\u00f3n'} - TechStore AI`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 30);

      if (tipoReporte === 'operacional') {
        autoTable(doc, {
          startY: 40,
          head: [['Fecha', 'Total Ventas', 'N\u00b0 Pedidos']],
          body: reporte.ventas_por_dia.map(v => [v.fecha, `$${v.total.toLocaleString()}`, v.pedidos]),
        });

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Producto', 'Cantidad', 'Total']],
          body: reporte.productos_top.map(p => [p.nombre, p.cantidad, `$${p.total.toLocaleString()}`]),
        });
      } else {
        autoTable(doc, {
          startY: 40,
          head: [['M\u00e9trica', 'Valor']],
          body: [
            ['Total Ingresos', `$${reporte.total_ingresos.toLocaleString()}`],
            ['Total Pedidos', reporte.total_pedidos],
            ['Total Clientes', reporte.total_usuarios],
          ],
        });

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [['Categor\u00eda', 'Cantidad', 'Total']],
          body: reporte.categorias_top.map(c => [c.categoria, c.cantidad, `$${c.total.toLocaleString()}`]),
        });
      }

      doc.save(`reporte-${tipoReporte}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Error al exportar PDF: ' + err.message);
    }
  };

  const exportarExcel = () => {
    if (!reporte) return;
    try {
      const wb = XLSX.utils.book_new();

      if (tipoReporte === 'operacional') {
        const ws1 = XLSX.utils.json_to_sheet(reporte.ventas_por_dia);
        XLSX.utils.book_append_sheet(wb, ws1, 'Ventas por D\u00eda');

        const ws2 = XLSX.utils.json_to_sheet(reporte.productos_top);
        XLSX.utils.book_append_sheet(wb, ws2, 'Productos Top');

        const ws3 = XLSX.utils.json_to_sheet(reporte.pedidos_recientes.map(p => ({
          id: p.id,
          cliente: p.cliente_email,
          total: p.total,
          metodo_pago: p.metodo_pago,
          estado: p.estado,
          fecha: p.fecha
        })));
        XLSX.utils.book_append_sheet(wb, ws3, 'Pedidos Recientes');
      } else {
        const ws1 = XLSX.utils.json_to_sheet([
          { metrica: 'Total Ingresos', valor: reporte.total_ingresos },
          { metrica: 'Total Pedidos', valor: reporte.total_pedidos },
          { metrica: 'Total Clientes', valor: reporte.total_usuarios },
        ]);
        XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

        const ws2 = XLSX.utils.json_to_sheet(reporte.categorias_top);
        XLSX.utils.book_append_sheet(wb, ws2, 'Categor\u00edas Top');
      }

      XLSX.writeFile(wb, `reporte-${tipoReporte}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert('Error al exportar Excel: ' + err.message);
    }
  };

  const exportarWord = () => {
    if (!reporte) return;
    try {
      const titulo = tipoReporte === 'operacional' ? 'Reporte Operacional' : 'Reporte de Gesti\u00f3n';
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>${titulo}</title></head>
        <body>
          <h1>${titulo} - TechStore AI</h1>
          <p>Generado: ${new Date().toLocaleString('es-PE')}</p>`;

      if (tipoReporte === 'operacional') {
        html += '<h2>Ventas por D\u00eda</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>Fecha</th><th>Total</th><th>N\u00b0 Pedidos</th></tr>';
        reporte.ventas_por_dia.forEach(v => {
          html += `<tr><td>${v.fecha}</td><td>$${v.total.toLocaleString()}</td><td>${v.pedidos}</td></tr>`;
        });
        html += '</table>';

        html += '<h2>Productos Top</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr>';
        reporte.productos_top.forEach(p => {
          html += `<tr><td>${p.nombre}</td><td>${p.cantidad}</td><td>$${p.total.toLocaleString()}</td></tr>`;
        });
        html += '</table>';

        html += '<h2>Pedidos Recientes</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>ID</th><th>Cliente</th><th>Total</th><th>M\u00e9todo</th><th>Estado</th><th>Fecha</th></tr>';
        reporte.pedidos_recientes.forEach(p => {
          html += `<tr><td>${p.id}</td><td>${p.cliente_email}</td><td>$${p.total.toLocaleString()}</td><td>${p.metodo_pago}</td><td>${p.estado}</td><td>${new Date(p.fecha).toLocaleDateString()}</td></tr>`;
        });
        html += '</table>';
      } else {
        html += '<h2>Resumen</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>M\u00e9trica</th><th>Valor</th></tr>';
        html += `<tr><td>Total Ingresos</td><td>$${reporte.total_ingresos.toLocaleString()}</td></tr>`;
        html += `<tr><td>Total Pedidos</td><td>${reporte.total_pedidos}</td></tr>`;
        html += `<tr><td>Total Clientes</td><td>${reporte.total_usuarios}</td></tr>`;
        html += '</table>';

        html += '<h2>Categor\u00edas Top</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>Categor\u00eda</th><th>Cantidad</th><th>Total</th></tr>';
        reporte.categorias_top.forEach(c => {
          html += `<tr><td>${c.categoria}</td><td>${c.cantidad}</td><td>$${c.total.toLocaleString()}</td></tr>`;
        });
        html += '</table>';
      }

      html += '</body></html>';

      const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${tipoReporte}-${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando Word:', err);
      alert('Error al exportar Word: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center">
          <FileText className="mr-3 text-purple-600" size={32} />
          Reportes
        </h2>
        <p className="text-muted mt-1">Genera reportes operacionales y de gestión</p>
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de reporte</label>
            <select
              value={tipoReporte}
              onChange={(e) => { setTipoReporte(e.target.value); setReporte(null); }}
              className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground"
            >
              <option value="operacional">Operacional</option>
              <option value="gestion">Gestión</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha inicio</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha fin</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={generarReporte}
              disabled={cargando}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-70 flex items-center justify-center"
            >
              <BarChart3 size={18} className="mr-2" />
              {cargando ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {reporte && (
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-foreground flex items-center">
              {tipoReporte === 'operacional' ? <BarChart3 className="mr-2 text-purple-600" size={24} /> : <PieChart className="mr-2 text-blue-600" size={24} />}
              Resultados del Reporte
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={exportarPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Download size={18} />
                <span>PDF</span>
              </button>
              <button
                onClick={exportarExcel}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download size={18} />
                <span>Excel</span>
              </button>
              <button
                onClick={exportarWord}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FileSpreadsheet size={18} />
                <span>Word</span>
              </button>
            </div>
          </div>

          {tipoReporte === 'operacional' ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Ventas por Día</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Pedidos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {reporte.ventas_por_dia.map((v, i) => (
                        <tr key={i}><td className="px-4 py-2 text-foreground">{v.fecha}</td><td className="px-4 py-2 font-semibold text-foreground">${v.total.toLocaleString()}</td><td className="px-4 py-2 text-foreground">{v.pedidos}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Productos Más Vendidos</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {reporte.productos_top.map((p, i) => (
                        <tr key={i}><td className="px-4 py-2 text-foreground">{p.nombre}</td><td className="px-4 py-2 text-foreground">{p.cantidad}</td><td className="px-4 py-2 font-semibold text-foreground">${p.total.toLocaleString()}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 text-white">
                  <p className="text-sm opacity-90">Total Ingresos</p>
                  <p className="text-3xl font-bold">${reporte.total_ingresos.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white">
                  <p className="text-sm opacity-90">Total Pedidos</p>
                  <p className="text-3xl font-bold">{reporte.total_pedidos}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white">
                  <p className="text-sm opacity-90">Total Clientes</p>
                  <p className="text-3xl font-bold">{reporte.total_usuarios}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Categorías Top</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Categoría</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {reporte.categorias_top.map((c, i) => (
                        <tr key={i}><td className="px-4 py-2 text-foreground">{c.categoria}</td><td className="px-4 py-2 text-foreground">{c.cantidad}</td><td className="px-4 py-2 font-semibold text-foreground">${c.total.toLocaleString()}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReportes;
