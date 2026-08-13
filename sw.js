/* ================================================================
   KENVEN HUB - SERVICE WORKER
   PWA: Offline Support + Caching
   ================================================================ */

const CACHE_VERSION = 'kenven-hub-v1';
const CACHE_NAME = `kenven-hub-${CACHE_VERSION}`;

// Core assets to pre-cache on install
const CORE_ASSETS = [
    './',
    './index.html',
    './admin.html',
    './style.css',
    './app.js',
    './admin.js',
    './manifest.json'
];

// ==================== INSTALL ====================
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                console.log('[SW] Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Install failed:', error);
            })
    );
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('kenven-hub-') && name !== CACHE_NAME)
                        .map((oldCache) => {
                            console.log('[SW] Removing old cache:', oldCache);
                            return caches.delete(oldCache);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activated successfully');
                return self.clients.claim();
            })
    );
});

// ==================== FETCH ====================
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Only handle GET requests
    if (request.method !== 'GET') return;
    
    // Skip Firebase and external API requests
    if (url.hostname.includes('firebase') || 
        url.hostname.includes('googleapis') ||
        url.hostname.includes('gstatic')) {
        return;
    }
    
    // Navigation requests: Network first, fallback to cached index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match('./index.html');
                })
        );
        return;
    }
    
    // Static assets: Cache first, then network (stale-while-revalidate)
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                const fetchPromise = fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);
                
                return cachedResponse || fetchPromise;
            })
    );
});

// ==================== MESSAGE HANDLING ====================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[SW] Cache cleared');
        });
    }
});
