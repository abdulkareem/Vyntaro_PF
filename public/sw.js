const CACHE = 'vyntaro-static-v4'
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

function shouldHandle(request) {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)

  // Never intercept cross-origin requests (e.g. Railway API)
  if (url.origin !== self.location.origin) return false

  // Never cache API responses
  if (url.pathname.startsWith('/api/')) return false

  return true
}

function networkFirst(request) {
  return fetch(request)
    .then(response => {
      const copy = response.clone()
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {})
      return response
    })
    .catch(() => caches.match(request))
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(cached => {
    const network = fetch(request)
      .then(response => {
        const copy = response.clone()
        caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {})
        return response
      })
      .catch(() => undefined)

    return cached || network
  })
}

self.addEventListener('fetch', event => {
  const request = event.request
  if (!shouldHandle(request)) return

  const acceptsHtml = request.headers.get('accept')?.includes('text/html')
  if (request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(networkFirst(request))
    return
  }

  // Prefer fresh JS/CSS so frontend picks up latest API config quickly.
  event.respondWith(staleWhileRevalidate(request))
})
