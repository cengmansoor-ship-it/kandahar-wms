const CACHE_NAME = 'ku-wms-v3';
const API_CACHE = 'ku-wms-api-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/manifest.json']).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip Vite internal dev paths — never cache or intercept these
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/__') ||
    url.pathname.includes('?') && url.pathname === '/'
  ) return;

  // API calls: network-first, fall back to cached response or offline JSON
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request, { cacheName: API_CACHE }).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ success: false, offline: true, data: null, message: 'آفلاین — شبکه اتصال نشته' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          })
        )
    );
    return;
  }

  // Navigation requests (page loads): always go to network — never serve stale HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html', { cacheName: CACHE_NAME })
          .then((r) => r || fetch('/index.html'))
          .catch(() => new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // All other static assets: network-first (not cache-first) to avoid stale Vite bundles
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((r) => r || new Response('Offline', { status: 503 }))
      )
  );
});
