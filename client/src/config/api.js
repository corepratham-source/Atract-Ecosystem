/**
 * Backend API base URL configuration.
 * 
 * Development: Uses localhost:5000
 * Production: Uses the current window origin (automatically dynamic for any deployment)
 * 
 * This ensures the API works on any domain without hardcoding URLs.
 */

const isProduction = !import.meta.env.DEV;

export const API_BASE = isProduction
  ? (typeof window !== "undefined" && window.location?.origin)
  : "http://localhost:5000";