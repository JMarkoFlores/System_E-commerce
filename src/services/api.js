import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (email, password, role = 'cliente') => api.post('/api/auth/register', { email, password, role })
};

export const productosApi = {
  getAll: () => api.get('/api/productos'),
  getById: (id) => api.get(`/api/productos/${id}`),
  create: (data) => api.post('/api/productos', data),
  update: (id, data) => api.put(`/api/productos/${id}`, data),
  delete: (id) => api.delete(`/api/productos/${id}`)
};

export const pedidosApi = {
  create: (data) => api.post('/api/pedidos', data),
  getMisPedidos: () => api.get('/api/pedidos/mis-pedidos'),
  getAll: () => api.get('/api/pedidos')
};

export const usuariosApi = {
  getAll: () => api.get('/api/usuarios'),
  create: (data) => api.post('/api/usuarios', data),
  update: (id, data) => api.put(`/api/usuarios/${id}`, data),
  delete: (id) => api.delete(`/api/usuarios/${id}`)
};

export const reportesApi = {
  operacional: (params) => api.get('/api/reportes/operacional', { params }),
  gestion: (params) => api.get('/api/reportes/gestion', { params })
};
