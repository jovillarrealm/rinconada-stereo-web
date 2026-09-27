// Service Worker — Rinconada Stereo (Carga instantánea 0 ms y modo sin conexión)
const CACHE_NAME = 'rinconada-stereo-v1';

// Recursos estáticos esenciales para el cascarón de la aplicación (App Shell)
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'favicon.ico',
  'assets/favicon.svg',
  'assets/logo-rinconada.avif',
  'assets/logo-rinconada.webp',
  'assets/logo-rinconada.png',
  'assets/locupez.avif',
  'assets/locupez.webp',
  'assets/locupez.png'
];

// Instalación: Precargar recursos del shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // Tolerancia si algún recurso individual falla en precargar
        console.warn('Precarga parcial en Service Worker:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de versiones obsoletas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. NO cachear transmisiones de audio en vivo ni APIs externas en tiempo real
  if (
    url.hostname.includes('tikast.com') ||
    url.hostname.includes('cbox.ws') ||
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('virtualtronics.com') ||
    req.destination === 'audio' ||
    req.method !== 'GET'
  ) {
    return; // Petición directa a la red sin intervenir
  }

  // 2. Estrategia para navegación HTML: Network-First con respaldo en caché
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('index.html') || caches.match('./');
        })
    );
    return;
  }

  // 3. Estrategia para recursos locales (CSS, JS, imágenes estáticas): Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
