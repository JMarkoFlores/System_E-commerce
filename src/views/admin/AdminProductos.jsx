import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { productosApi } from '../../services/api';
import ProductImage from '../../components/common/ProductImage';

const AdminProductos = ({ productos, setProductos }) => {
  const { t } = useTranslation();
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'Electrónica',
    precio: '',
    tags: '',
    imagen: '',
    stock: 100
  });
  const [cargando, setCargando] = useState(false);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirModal = (producto = null) => {
    if (producto) {
      setProductoEditando(producto);
      setForm({
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: producto.precio,
        tags: Array.isArray(producto.tags) ? producto.tags.join(',') : producto.tags,
        imagen: producto.imagen,
        stock: producto.stock
      });
    } else {
      setProductoEditando(null);
      setForm({ nombre: '', categoria: 'Electrónica', precio: '', tags: '', imagen: '', stock: 100 });
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProductoEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      const payload = {
        ...form,
        precio: parseFloat(form.precio),
        stock: parseInt(form.stock),
        tags: form.tags
      };

      if (productoEditando) {
        const res = await productosApi.update(productoEditando.id, payload);
        setProductos(productos.map(p => p.id === productoEditando.id ? { ...res.data, tags: res.data.tags.split(',').filter(Boolean) } : p));
      } else {
        const res = await productosApi.create(payload);
        setProductos([...productos, { ...res.data, tags: res.data.tags.split(',').filter(Boolean) }]);
      }
      cerrarModal();
    } catch (err) {
      alert(t('products.saveError') + ': ' + (err.response?.data?.detail || err.message));
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm(t('products.deleteConfirm'))) return;
    try {
      await productosApi.delete(id);
      setProductos(productos.filter(p => p.id !== id));
    } catch (err) {
      alert(t('products.deleteError') + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('products.title')}</h2>
          <p className="text-muted mt-1">{t('products.subtitle')}</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus size={20} />
          <span>{t('products.addProduct')}</span>
        </button>
      </div>

      <div className="bg-surface rounded-xl shadow-lg p-4 border border-border">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('products.searchPlaceholder')}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('products.image')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.category')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.price')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.stock')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.tags')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {productosFiltrados.map((producto) => (
                <tr key={producto.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3">
                    <ProductImage
                      producto={producto}
                      className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{producto.nombre}</td>
                  <td className="px-4 py-3 text-muted">{t(`categories.${producto.categoria}`, { defaultValue: producto.categoria })}</td>
                  <td className="px-4 py-3 font-semibold text-purple-600 dark:text-purple-400">${producto.precio}</td>
                  <td className="px-4 py-3 text-muted">{producto.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {producto.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">#{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => abrirModal(producto)}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleEliminar(producto.id)}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">
                {productoEditando ? t('products.editProduct') : t('products.newProduct')}
              </h3>
              <button onClick={cerrarModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.name')}</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.category')}</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground"
                  >
                    <option>Electrónica</option>
                    <option>Periféricos</option>
                    <option>Audio</option>
                    <option>Almacenamiento</option>
                    <option>Muebles</option>
                    <option>Iluminación</option>
                    <option>Fotografía</option>
                    <option>Streaming</option>
                    <option>Accesorios</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.price')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.stock')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('products.tagsHint')}</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder={t('products.tagsPlaceholder')}
                    className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('products.imageURL')}</label>
                <input
                  type="text"
                  value={form.imagen}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                  placeholder={t('products.imageURLPlaceholder')}
                  className="w-full px-4 py-2 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-input-border text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-70"
                >
                  {cargando ? t('common.processing') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductos;
