// Central API configuration
// In production (Vercel), VITE_API_URL is set via Vercel Environment Variables
// In development, it falls back to localhost:5001
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
export const API_URL = `${API_BASE_URL}/api`;
