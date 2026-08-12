import axios from 'axios';

// Central API configuration
// In production (Vercel), VITE_API_URL is set via Vercel Environment Variables
// In development, it falls back to localhost:5001
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('client-alpha-jet-54'))
    ? 'https://green-skills-api.onrender.com' 
    : 'http://localhost:5001');
export const API_URL = `${API_BASE_URL}/api`;

// Pre-warm backend API server immediately on load to prevent cold-start delays
if (typeof window !== 'undefined') {
  fetch(API_BASE_URL, { cache: 'no-store' }).catch(() => {});
}

// Add a request interceptor to attach JWT token automatically
axios.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
