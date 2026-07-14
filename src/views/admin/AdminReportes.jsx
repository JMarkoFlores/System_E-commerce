import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, PieChart, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportesApi } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const AdminReportes = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('en') ? 'en-US' : 'es-PE';
  const [tipoReporte, setTipoReporte] = useState('operacional');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);

  const reportTypeLabel = tipoReporte === 'operacional'
    ? t('reports.operational')
    : t('reports.management');

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
      alert(t('reports.generateError') + ': ' + (err.response?.data?.detail || err.message));
    } finally {
      setCargando(false);
    }
  };

  const exportarPDF = () => {
    if (!reporte) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(t('reports.pdfTitle', { type: reportTypeLabel }), 14, 20);
      doc.setFontSize(11);
      doc.text(t('reports.generatedAt', { date: new Date().toLocaleString(locale) }), 14, 30);

      if (tipoReporte === 'operacional') {
        autoTable(doc, {
          startY: 40,
          head: [[t('common.date'), t('reports.dailySalesTotal'), t('reports.dailyOrders')]],
          body: reporte.ventas_por_dia.map(v => [v.fecha, `$${v.total.toLocaleString()}`, v.pedidos]),
        });

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [[t('common.name'), t('common.quantity'), t('common.total')]],
          body: reporte.productos_top.map(p => [p.nombre, p.cantidad, `$${p.total.toLocaleString()}`]),
        });
      } else {
        autoTable(doc, {
          startY: 40,
          head: [[t('reports.metric'), t('common.total')]],
          body: [
            [t('reports.totalIncome'), `$${reporte.total_ingresos.toLocaleString()}`],
            [t('reports.totalOrders'), reporte.total_pedidos],
            [t('reports.totalCustomers'), reporte.total_usuarios],
          ],
        });

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [[t('common.category'), t('common.quantity'), t('common.total')]],
          body: reporte.categorias_top.map(c => [c.categoria, c.cantidad, `$${c.total.toLocaleString()}`]),
        });
      }

      doc.save(`reporte-${tipoReporte}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert(t('reports.pdfError') + ': ' + err.message);
    }
  };

  const exportarExcel = () => {
    if (!reporte) return;
    try {
      const wb = XLSX.utils.book_new();

      if (tipoReporte === 'operacional') {
        const ws1 = XLSX.utils.json_to_sheet(reporte.ventas_por_dia.map(v => ({
          [t('common.date')]: v.fecha,
          [t('common.total')]: v.total,
          [t('reports.dailyOrders')]: v.pedidos,
        })));
        XLSX.utils.book_append_sheet(wb, ws1, t('reports.sheetDailySales'));

        const ws2 = XLSX.utils.json_to_sheet(reporte.productos_top.map(p => ({
          [t('common.name')]: p.nombre,
          [t('common.quantity')]: p.cantidad,
          [t('common.total')]: p.total,
        })));
        XLSX.utils.book_append_sheet(wb, ws2, t('reports.sheetTopProducts'));

        const ws3 = XLSX.utils.json_to_sheet(reporte.pedidos_recientes.map(p => ({
          [t('users.id')]: p.id,
          [t('common.client')]: p.cliente_email,
          [t('common.total')]: p.total,
          [t('payment.method')]: t(`order.method.${p.metodo_pago}`, { defaultValue: p.metodo_pago }),
          [t('common.status')]: t(`order.status.${p.estado}`, { defaultValue: p.estado }),
          [t('common.date')]: p.fecha,
        })));
        XLSX.utils.book_append_sheet(wb, ws3, t('reports.sheetRecentOrders'));
      } else {
        const ws1 = XLSX.utils.json_to_sheet([
          { [t('reports.metric')]: t('reports.totalIncome'), [t('common.total')]: reporte.total_ingresos },
          { [t('reports.metric')]: t('reports.totalOrders'), [t('common.total')]: reporte.total_pedidos },
          { [t('reports.metric')]: t('reports.totalCustomers'), [t('common.total')]: reporte.total_usuarios },
        ]);
        XLSX.utils.book_append_sheet(wb, ws1, t('reports.sheetSummary'));

        const ws2 = XLSX.utils.json_to_sheet(reporte.categorias_top.map(c => ({
          [t('common.category')]: c.categoria,
          [t('common.quantity')]: c.cantidad,
          [t('common.total')]: c.total,
        })));
        XLSX.utils.book_append_sheet(wb, ws2, t('reports.sheetTopCategories'));
      }

      XLSX.writeFile(wb, `reporte-${tipoReporte}-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exportando Excel:', err);
      alert(t('reports.excelError') + ': ' + err.message);
    }
  };

  const exportarWord = () => {
    if (!reporte) return;
    try {
      const titulo = t(`reports.${tipoReporte === 'operacional' ? 'operational' : 'management'}Report`);
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>${titulo}</title></head>
        <body>
          <h1>${titulo} - TechStore AI</h1>
          <p>${t('reports.generatedAt', { date: new Date().toLocaleString(locale) })}</p>`;

      if (tipoReporte === 'operacional') {
        html += `<h2>${t('reports.dailySales')}</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>${t('common.date')}</th><th>${t('common.total')}</th><th>${t('reports.dailyOrders')}</th></tr>`;
        reporte.ventas_por_dia.forEach(v => {
          html += `<tr><td>${v.fecha}</td><td>$${v.total.toLocaleString()}</td><td>${v.pedidos}</td></tr>`;
        });
        html += '</table>';

        html += `<h2>${t('reports.topProducts')}</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>${t('common.name')}</th><th>${t('common.quantity')}</th><th>${t('common.total')}</th></tr>`;
        reporte.productos_top.forEach(p => {
          html += `<tr><td>${p.nombre}</td><td>${p.cantidad}</td><td>$${p.total.toLocaleString()}</td></tr>`;
        });
        html += '</table>';

        html += `<h2>${t('dashboard.recentOrders')}</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>${t('users.id')}</th><th>${t('common.client')}</th><th>${t('common.total')}</th><th>${t('payment.method')}</th><th>${t('common.status')}</th><th>${t('common.date')}</th></tr>`;
        reporte.pedidos_recientes.forEach(p => {
          html += `<tr><td>${p.id}</td><td>${p.cliente_email}</td><td>$${p.total.toLocaleString(locale)}</td><td>${t(`order.method.${p.metodo_pago}`, { defaultValue: p.metodo_pago })}</td><td>${t(`order.status.${p.estado}`, { defaultValue: p.estado })}</td><td>${new Date(p.fecha).toLocaleDateString(locale)}</td></tr>`;
        });
        html += '</table>';
      } else {
        html += `<h2>${t('reports.sheetSummary')}</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>${t('reports.metric')}</th><th>${t('common.total')}</th></tr>`;
        html += `<tr><td>${t('reports.totalIncome')}</td><td>$${reporte.total_ingresos.toLocaleString()}</td></tr>`;
        html += `<tr><td>${t('reports.totalOrders')}</td><td>${reporte.total_pedidos}</td></tr>`;
        html += `<tr><td>${t('reports.totalCustomers')}</td><td>${reporte.total_usuarios}</td></tr>`;
        html += '</table>';

        html += `<h2>${t('reports.topCategories')}</h2><table border="1" cellpadding="5" cellspacing="0"><tr><th>${t('common.category')}</th><th>${t('common.quantity')}</th><th>${t('common.total')}</th></tr>`;
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
      alert(t('reports.wordError') + ': ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground flex items-center">
          <FileText className="mr-3 text-purple-600" size={32} />
          {t('reports.title')}
        </h2>
        <p className="text-muted mt-1">{t('reports.subtitle')}</p>
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reports.type')}</label>
            <select
              value={tipoReporte}
              onChange={(e) => { setTipoReporte(e.target.value); setReporte(null); }}
              className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground"
            >
              <option value="operacional">{t('reports.operational')}</option>
              <option value="gestion">{t('reports.management')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reports.dateStart')}</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('reports.dateEnd')}</label>
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
              {cargando ? t('reports.generating') : t('reports.generate')}
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
              {t('reports.results')}
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={exportarPDF}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Download size={18} />
                <span>{t('reports.export.pdf')}</span>
              </button>
              <button
                onClick={exportarExcel}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download size={18} />
                <span>{t('reports.export.excel')}</span>
              </button>
              <button
                onClick={exportarWord}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FileSpreadsheet size={18} />
                <span>{t('reports.export.word')}</span>
              </button>
            </div>
          </div>

          {tipoReporte === 'operacional' ? (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('reports.dailySales')}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.date')}</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.total')}</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('reports.dailyOrders')}</th>
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
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('reports.topProducts')}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.name')}</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.quantity')}</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.total')}</th>
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
                  <p className="text-sm opacity-90">{t('reports.totalIncome')}</p>
                  <p className="text-3xl font-bold">${reporte.total_ingresos.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white">
                  <p className="text-sm opacity-90">{t('reports.totalOrders')}</p>
                  <p className="text-3xl font-bold">{reporte.total_pedidos}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white">
                  <p className="text-sm opacity-90">{t('reports.totalCustomers')}</p>
                  <p className="text-3xl font-bold">{reporte.total_usuarios}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('reports.topCategories')}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.category')}</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.quantity')}</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.total')}</th>
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
