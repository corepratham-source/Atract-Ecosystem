// Service Worker for ATRact PWA
// Provides offline support and caching strategies

const CACHE_NAME = 'atract-v5';
const STATIC_CACHE = 'atract-static-v5';
const DYNAMIC_CACHE = 'atract-dynamic-v5';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/atract.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => {
            return key !== STATIC_CACHE && key !== DYNAMIC_CACHE;
          }).map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extensions and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network First strategy (no caching for API)
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Static assets in /public - Cache First strategy
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/) && !url.pathname.startsWith('/src')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages - Network First with cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default - Network Only (don't cache other assets)
  event.respondWith(networkOnly(request));
});

// Network Only - Always try network, fail if offline (no fallback for API)
async function networkOnly(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network Only - Failed:', request.url, error.message);
    // Return a proper error response instead of "Offline" text
    return new Response(JSON.stringify({ error: 'Network unavailable', message: 'Please check your internet connection' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache First Strategy - Check cache, then network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache First - Network failed:', error);
    // Return a proper error instead of "Offline" text
    return new Response('Service unavailable', { 
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Network First Strategy - Try network, then cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network First - Falling back to cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const offlinePage = await caches.match('/');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Return a proper JSON error response
    return new Response(JSON.stringify({ error: 'Offline', message: 'Please check your internet connection' }), { 
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from ATRact',
      icon: '/atract.svg',
      badge: '/atract.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ATRact', options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
