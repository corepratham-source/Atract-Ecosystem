/**
 * Central API base URL for all backend requests.
 * Set VITE_API_URL in .env for production (e.g. https://your-api.com)
 */
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
