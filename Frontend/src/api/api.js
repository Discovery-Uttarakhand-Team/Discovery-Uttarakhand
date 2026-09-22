import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
if (!baseURL) {
  if (import.meta.env.PROD) {
    // In production without explicit env, fall back to relative /api (served via reverse proxy)
    baseURL = '/api';
  } else {
    baseURL = 'http://localhost:5000/api';
  }
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
