const CACHE = 'vyntaro-static-v3'
const CORE_ASSETS = ['/', '/index.html']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

function networkFirst(request) {
  return fetch(request)
    .then(response => {
      const copy = response.clone()
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {})
      return response
    })
    .catch(() => caches.match(request))
}

function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) return cached

    return fetch(request).then(response => {
      const copy = response.clone()
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {})
      return response
    })
  })
}

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return

  const acceptsHtml = request.headers.get('accept')?.includes('text/html')
  if (request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(cacheFirst(request))
})
