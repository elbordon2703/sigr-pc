/* ============================================================
   SIGR-PC V3.0 — Service Worker (PWA offline-first)
   ============================================================ */

const CACHE_NOMBRE = 'sigr-pc-v3';
const CACHE_VERSION = '2026-09-12-01';

/* Archivos que se cachean al instalar (la app completa) */
const ARCHIVOS_APP = [
  './',
  './index.html',
  './manifest',
  './LOGO%20PC.png',
  './LOGO%20GOBERNACION.png',
  './PIE%20DE%20PAGIAN2.png',
  './SELLO.png',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
];

/* Instalar: cachear todo */
self.addEventListener('install', function(event){
  console.log('[SW] Instalando…');
  event.waitUntil(
    caches.open(CACHE_NOMBRE + '-' + CACHE_VERSION)
      .then(function(cache){
        return cache.addAll(ARCHIVOS_APP).catch(function(err){
          console.warn('[SW] Algunos archivos no se pudieron cachear:', err);
        });
      })
      .then(function(){ return self.skipWaiting(); })
  );
});

/* Activar: limpiar cachés viejas */
self.addEventListener('activate', function(event){
  console.log('[SW] Activando…');
  event.waitUntil(
    caches.keys().then(function(nombres){
      return Promise.all(
        nombres.filter(function(n){
          return n.indexOf(CACHE_NOMBRE) === 0 && n.indexOf(CACHE_VERSION) === -1;
        }).map(function(n){ return caches.delete(n); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Fetch: primero caché, si no hay, red (offline-first) */
self.addEventListener('fetch', function(event){
  // Solo interceptar GET
  if(event.request.method !== 'GET') return;

  // No interceptar llamadas a Firebase (necesitan red)
  var url = event.request.url;
  if(url.indexOf('firestore.googleapis.com') !== -1 ||
     url.indexOf('identitytoolkit.googleapis.com') !== -1 ||
     url.indexOf('securetoken.googleapis.com') !== -1 ||
     url.indexOf('firebaseio.com') !== -1){
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        // Guardar en caché lo nuevo que se descargue
        if(response && response.status === 200 && response.type === 'basic'){
          var copia = response.clone();
          caches.open(CACHE_NOMBRE + '-' + CACHE_VERSION).then(function(cache){
            cache.put(event.request, copia).catch(function(){});
          });
        }
        return response;
      }).catch(function(){
        // Si no hay red y no está en caché, devolver index.html como fallback
        if(event.request.destination === 'document'){
          return caches.match('./index.html');
        }
      });
    })
  );
});

/* Mensajes desde la app (por si más adelante se necesita) */
self.addEventListener('message', function(event){
  if(event.data && event.data.tipo === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
