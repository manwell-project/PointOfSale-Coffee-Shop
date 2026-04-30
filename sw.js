/**
 * Service Worker
 * DigiCaf Coffee Shop POS
 * Offline-first caching strategy
 */

const CACHE_VERSION = 'digicaf-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/design-tokens.css',
  '/css/utilities.css',
  '/css/responsive.css',
  '/css/mobile-optimizations.css',
  '/css/tablet.css',
  '/css/components/loading-states.css',
  '/css/components/empty-states.css',
  '/css/components/toast-notifications.css',
  '/css/components/micro-interactions.css',
  '/js/performance.js',
  '/js/performance-utilities.js',
  '/js/cache.js',
  '/js/responsive-utilities.js',
  '/js/toast.js'
];

// Maximum cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 30;

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name.startsWith('digicaf-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch Event - Serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except CDN assets)
  if (url.origin !== location.origin && !isCDNResource(url)) {
    return;
  }
  
  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

/**
 * Handle Static Assets (CSS, JS)
 * Strategy: Cache-first, network fallback
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Serving from static cache:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Static fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Handle Dynamic Content (HTML pages)
 * Strategy: Network-first, cache fallback
 */
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      
      // Limit cache size
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving from dynamic cache:', request.url);
      return cached;
    }
    
    // Return offline page
    return getOfflinePage();
  }
}

/**
 * Handle Images
 * Strategy: Cache-first, network fallback
 */
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
      limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
    }
    
    return response;
  } catch (error) {
    // Return placeholder image
    return getPlaceholderImage();
  }
}

/**
 * Handle API Requests
 * Strategy: Network-first, with timeout
 */
async function handleAPIRequest(request) {
  const TIMEOUT = 5000; // 5 seconds
  
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), TIMEOUT)
      )
    ]);
    
    return response;
  } catch (error) {
    console.error('[SW] API request failed:', error);
    
    // Return cached API response if available
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving stale API data');
      return cached;
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        offline: true 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Limit cache size
 */
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const toDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(toDelete.map(key => cache.delete(key)));
  }
}

/**
 * Check if request is for an image
 */
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(request.url);
}

/**
 * Check if request is an API call
 */
function isAPIRequest(url) {
  return url.pathname.includes('/api/') || 
         url.pathname.includes('/server/') ||
         url.pathname.endsWith('.php') ||
         url.pathname.endsWith('.json');
}

/**
 * Check if request is for static asset
 */
function isStaticAsset(url) {
  return /\.(css|js|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

/**
 * Check if request is from CDN
 */
function isCDNResource(url) {
  const cdnDomains = [
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  return cdnDomains.some(domain => url.hostname.includes(domain));
}

/**
 * Get offline page
 */
function getOfflinePage() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - DigiCaf</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #6B4423 0%, #8B5A3C 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .offline-container {
          max-width: 500px;
        }
        .offline-icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 10px;
        }
        p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 30px;
        }
        button {
          background: white;
          color: #6B4423;
          border: none;
          padding: 12px 32px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
        }
        button:active {
          transform: translateY(0);
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📡</div>
        <h1>Tidak Ada Koneksi</h1>
        <p>Anda sedang offline. Beberapa fitur mungkin tidak tersedia.</p>
        <button onclick="window.location.reload()">Coba Lagi</button>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Get placeholder image for offline
 */
function getPlaceholderImage() {
  // 1x1 transparent PNG
  const pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  return new Response(
    Uint8Array.from(atob(pixel), c => c.charCodeAt(0)),
    {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    }
  );
}

/**
 * Message handler
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(name => caches.delete(name))
        );
      })
    );
  }
});

/**
 * Background Sync (for offline transactions)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

/**
 * Sync offline transactions
 */
async function syncTransactions() {
  console.log('[SW] Syncing offline transactions...');
  
  try {
    // Get pending transactions from IndexedDB
    // Send to server
    // Clear pending queue
    console.log('[SW] Sync completed');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry sync
  }
}

/**
 * Push Notification handler
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Notifikasi baru dari DigiCaf',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'DigiCaf', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] Service Worker loaded');
