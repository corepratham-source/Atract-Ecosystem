/**
 * Central API base URL for all backend requests.
 * Set VITE_API_URL in .env for production (e.g. https://your-api.com)
 */
// If VITE_API_URL is set during build, use it. Otherwise default to the current
// origin (so the frontend and backend can be served from the same host), and
// finally fall back to localhost for local development.
export const API_BASE = import.meta.env.VITE_API_URL || (
	typeof window !== 'undefined' && window.location && window.location.origin
		? window.location.origin
		: 'http://localhost:5000'
);
