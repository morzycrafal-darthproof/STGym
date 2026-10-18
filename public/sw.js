// Network-first service worker: always fresh when online, last copy from cache when offline (e.g. in the gym basement).
const CACHE = 'stgym-v2'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(async () => {
        // ignoreVary: hosts send Vary (Origin, Accept-Encoding) and module scripts differ in those headers.
        const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate', ignoreVary: true })
        if (cached) return cached
        // Any page request falls back to the app shell; routing happens after the #.
        if (req.mode === 'navigate')
          return (await caches.match(self.registration.scope, { ignoreSearch: true, ignoreVary: true })) ?? Response.error()
        return Response.error()
      }),
  )
})
