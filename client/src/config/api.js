/**
 * Backend API base URL. In dev we call the backend directly on port 5000 (no proxy).
 * Set VITE_API_URL in .env to override (e.g. for production).
 */
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : (typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost:5000"));
