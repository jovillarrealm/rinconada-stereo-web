// Service Worker — Rinconada Stereo (recursos locales y modo sin conexión)
const CACHE_PREFIX = `rinconada-stereo:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v5`;

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
  'assets/locupez.avif'
];

// Instalación: Precargar recursos del shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de versiones obsoletas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
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

  async function cacheResponse(response) {
    if (response.status === 200) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(req, response.clone());
      } catch (err) {
        // Un fallo de almacenamiento no debe impedir entregar la respuesta de red.
      }
    }
    return response;
  }

  // 2. Estrategia para navegación HTML: Network-First con respaldo en caché
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(cacheResponse)
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(req);
          if (cached) return cached;
          return await cache.match(new URL('index.html', self.registration.scope).href) ||
            await cache.match(self.registration.scope) || Response.error();
        })
    );
    return;
  }

  // 3. Estrategia para recursos locales (CSS, JS, imágenes estáticas): Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    const responsePromise = caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(req);
      const fetchPromise = fetch(req)
        .then(cacheResponse)
        .catch(() => cachedResponse || Response.error());
      event.waitUntil(fetchPromise);
      return cachedResponse || fetchPromise;
    });
    event.respondWith(responsePromise);
    event.waitUntil(responsePromise);
  }
});
