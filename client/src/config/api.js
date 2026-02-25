/**
 * Backend API base URL configuration.
 * 
 * Development: Uses localhost:5000
 * Production: Uses VITE_API_URL from .env or falls back to the current window origin
 * 
 * Set VITE_API_URL in client/.env for production deployment.
 */
const isProduction = !import.meta.env.DEV;

export const API_BASE = isProduction
  ? (import.meta.env.VITE_API_URL || window.location.origin)
  : "http://localhost:5000";
