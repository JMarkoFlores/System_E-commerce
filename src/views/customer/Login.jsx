import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/common/ThemeToggle';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      let userData;
      if (modoRegistro) {
        userData = await register(form.email, form.password);
      } else {
        userData = await login(form.email, form.password);
      }

      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/catalogo');
      }
    } catch (err) {
      const mensaje = err.response?.data?.detail || 'Error al iniciar sesión';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="bg-surface rounded-2xl shadow-2xl p-8 w-full max-w-md border border-border">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full">
              <ShoppingCart className="text-purple-600 dark:text-purple-300" size={40} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {modoRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-muted mt-2">TechStore AI - Sistema de Recomendación Inteligente</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            required
            className="w-full px-4 py-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            minLength={4}
            className="w-full px-4 py-3 border border-input-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-input-bg text-foreground placeholder-gray-400"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-70"
          >
            {cargando ? 'Procesando...' : (modoRegistro ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <button
          onClick={() => setModoRegistro(!modoRegistro)}
          className="w-full mt-4 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition text-sm"
        >
          {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>

        {/* Admin hint */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-border">
          <div className="flex items-center text-xs text-muted mb-1">
            <Shield size={14} className="mr-1 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">Acceso administrador:</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">admin@losportales.com.pe / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
