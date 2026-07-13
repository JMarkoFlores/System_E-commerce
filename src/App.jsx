import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext';
import { productosApi, pedidosApi } from './services/api';
import RedNeuronalRecomendacion from './utils/RedNeuronal';

import Login from './views/customer/Login';
import CustomerLayout from './components/customer/CustomerLayout';
import Catalogo from './views/customer/Catalogo';
import Recomendaciones from './views/customer/Recomendaciones';
import Historial from './views/customer/Historial';
import Carrito from './views/customer/Carrito';
import PaymentModal from './components/common/PaymentModal';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './views/admin/AdminDashboard';
import AdminProductos from './views/admin/AdminProductos';
import AdminUsuarios from './views/admin/AdminUsuarios';
import AdminGraficas from './views/admin/AdminGraficas';
import AdminMetricas from './views/admin/AdminMetricas';
import AdminReportes from './views/admin/AdminReportes';
import AdminPruebas from './views/admin/AdminPruebas';

// Número dinámico de recomendaciones
const calcularNumeroRecomendaciones = (historialCompras) => {
  const numCompras = historialCompras.length;
  if (numCompras === 0) return 0;
  if (numCompras <= 2) return 4;
  if (numCompras <= 4) return 5;
  if (numCompras <= 7) return 6;
  if (numCompras <= 9) return 8;
  return 10;
};

// Normalizar productos del backend (tags string → array)
const normalizarProducto = (p) => ({
  ...p,
  tags: typeof p.tags === 'string' ? p.tags.split(',').filter(Boolean) : (p.tags || [])
});

function App() {
  const { user, loading } = useAuth();

  const [productos, setProductos] = useState([]);
  const [historialCompras, setHistorialCompras] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [redNeuronal] = useState(new RedNeuronalRecomendacion());
  const [carrito, setCarrito] = useState([]);
  const [estadisticasIA, setEstadisticasIA] = useState(null);

  const [mostrarPago, setMostrarPago] = useState(false);
  const [itemsPago, setItemsPago] = useState([]);

  // Cargar productos del backend
  useEffect(() => {
    if (user) {
      productosApi.getAll()
        .then(res => setProductos(res.data.map(normalizarProducto)))
        .catch(err => console.error('Error cargando productos:', err));
    }
  }, [user]);

  // Cargar pedidos del usuario y convertir a historial
  useEffect(() => {
    if (user?.role === 'cliente') {
      pedidosApi.getMisPedidos()
        .then(res => {
          const historial = [];
          res.data.forEach(pedido => {
            pedido.detalles.forEach(detalle => {
              for (let i = 0; i < detalle.cantidad; i++) {
                historial.push({
                  ...normalizarProducto(detalle.producto),
                  fechaCompra: pedido.fecha,
                  metodo_pago: pedido.metodo_pago,
                  pedido_id: pedido.id
                });
              }
            });
          });
          setHistorialCompras(historial);
        })
        .catch(err => console.error('Error cargando pedidos:', err));
    }
  }, [user]);

  // Actualizar recomendaciones
  const actualizarRecomendaciones = useCallback(async () => {
    if (historialCompras.length > 0) {
      try {
        await redNeuronal.entrenar(historialCompras);
        const numRecomendaciones = calcularNumeroRecomendaciones(historialCompras);
        const nuevas = await redNeuronal.recomendar(historialCompras, numRecomendaciones);
        setRecomendaciones(nuevas);
        setEstadisticasIA(redNeuronal.obtenerEstadisticas());
      } catch (err) {
        console.error('Error entrenando IA:', err);
      }
    } else {
      setRecomendaciones([]);
      setEstadisticasIA(null);
    }
  }, [historialCompras, redNeuronal]);

  useEffect(() => {
    if (user?.role === 'cliente') {
      actualizarRecomendaciones();
    }
  }, [historialCompras, user, actualizarRecomendaciones]);

  // Carrito
  const agregarAlCarrito = (producto) => {
    setCarrito([...carrito, producto]);
    mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
  };

  const removerDelCarrito = (index) => {
    const producto = carrito[index];
    setCarrito(carrito.filter((_, i) => i !== index));
    mostrarToast(`${producto.nombre} eliminado del carrito`, 'error');
  };

  const mostrarToast = (mensaje, tipo = 'success') => {
    const Toast = document.createElement('div');
    Toast.className = `fixed top-20 right-4 ${tipo === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    Toast.innerHTML = mensaje;
    document.body.appendChild(Toast);
    setTimeout(() => Toast.remove(), 2000);
  };

  // Iniciar pago
  const iniciarPago = (items) => {
    setItemsPago(items);
    setMostrarPago(true);
  };

  const comprarProducto = (producto) => {
    iniciarPago([producto]);
  };

  const finalizarCompra = () => {
    if (carrito.length === 0) return;
    iniciarPago([...carrito]);
  };

  // Procesar pago confirmado
  const procesarPago = async (metodoPago) => {
    try {
      // Agrupar items por producto_id para cantidades
      const agrupados = {};
      itemsPago.forEach(p => {
        if (!agrupados[p.id]) {
          agrupados[p.id] = { producto: p, cantidad: 0 };
        }
        agrupados[p.id].cantidad += 1;
      });

      const payload = {
        metodo_pago: metodoPago,
        items: Object.values(agrupados).map(g => ({
          producto_id: g.producto.id,
          cantidad: g.cantidad
        }))
      };

      await pedidosApi.create(payload);

      // Agregar al historial local
      const nuevasCompras = itemsPago.map(p => ({
        ...p,
        fechaCompra: new Date().toISOString(),
        metodo_pago: metodoPago
      }));

      setHistorialCompras(prev => [...prev, ...nuevasCompras]);
      setCarrito([]);
      setMostrarPago(false);
      setItemsPago([]);

      mostrarToast('✅ Compra realizada exitosamente', 'success');
    } catch (err) {
      console.error('Error en pago:', err);
      const mensaje = err.response?.data?.detail || 'Error al procesar el pago';
      alert(`❌ ${mensaje}`);
    }
  };

  // Rutas protegidas
  const ProtectedRoute = ({ children, rol }) => {
    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    if (!user) return <Navigate to="/" replace />;
    if (rol && user.role !== rol) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <>
      <Routes>
        {/* Pública */}
        <Route path="/" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/catalogo'} replace />} />

        {/* Cliente */}
        <Route
          path="/"
          element={<ProtectedRoute rol="cliente"><CustomerLayout carritoCount={carrito.length} /></ProtectedRoute>}
        >
          <Route path="catalogo" element={<Catalogo productos={productos} onAddToCart={agregarAlCarrito} onBuyNow={comprarProducto} />} />
          <Route path="recomendaciones" element={
            <Recomendaciones
              recomendaciones={recomendaciones}
              historialCompras={historialCompras}
              estadisticasIA={estadisticasIA}
              onAddToCart={agregarAlCarrito}
              onBuyNow={comprarProducto}
            />
          } />
          <Route path="historial" element={<Historial historialCompras={historialCompras} />} />
          <Route path="carrito" element={
            <Carrito
              carrito={carrito}
              onRemoverDelCarrito={removerDelCarrito}
              onFinalizarCompra={finalizarCompra}
            />
          } />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={<ProtectedRoute rol="admin"><AdminLayout /></ProtectedRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="productos" element={<AdminProductos productos={productos} setProductos={setProductos} />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="graficas" element={<AdminGraficas historialCompras={historialCompras} />} />
          <Route path="metricas" element={<AdminMetricas historialCompras={historialCompras} recomendaciones={recomendaciones} estadisticasIA={estadisticasIA} />} />
          <Route path="reportes" element={<AdminReportes />} />
          <Route path="pruebas" element={<AdminPruebas />} />
        </Route>
      </Routes>

      {/* Modal de pago */}
      {mostrarPago && (
        <PaymentModal
          total={itemsPago.reduce((sum, p) => sum + p.precio, 0)}
          onClose={() => {
            setMostrarPago(false);
            setItemsPago([]);
          }}
          onConfirm={procesarPago}
        />
      )}
    </>
  );
}

export default App;
