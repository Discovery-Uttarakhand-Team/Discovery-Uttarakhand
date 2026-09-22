import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) {
  if (import.meta.env.PROD) {
    throw new Error('VITE_API_URL is not configured for production build.');
  }
  baseURL = 'http://localhost:5000/api';
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
