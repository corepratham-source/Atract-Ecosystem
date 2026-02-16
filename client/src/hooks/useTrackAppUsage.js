import { useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

/**
 * Hook to track app usage and update dashboard metrics
 * Call this in any app component to increment user count
 * @param {string} appId - The app ID from microApps
 */
export const useTrackAppUsage = (appId) => {
  useEffect(() => {
    if (!appId) return;

    const trackUsage = async () => {
      try {
        // Get or find app in database by ID
        const res = await axios.get(`${API_BASE}/apps`);
        const apps = res.data || [];
        
        // Find app matching the ID (handle both microApps.id and app._id)
        let app = apps.find(a => a._id === appId || a.appName?.toLowerCase().includes(appId));
        
        if (!app) {
          // If not found, might be a new app - don't fail
          console.log(`App ${appId} not found in dashboard yet`);
          return;
        }

        // Increment usage counters
        const updatedApp = {
          ...app,
          users7d: (app.users7d || 0) + 1,
          users30d: (app.users30d || 0) + 1,
          status: app.status === 'Build' ? 'Live' : app.status, // Auto-promote to Live if in Build
          lastAccessed: new Date().toISOString()
        };

        // Update in backend
        await axios.put(`${API_BASE}/apps/${app._id}`, updatedApp);
      } catch (err) {
        // Silently fail - don't disrupt the user's app usage
        console.debug('Failed to track app usage:', err.message);
      }
    };

    // Track usage once when app loads
    trackUsage();
  }, [appId]);
};
