// Augmented Core Service Worker with Push Daemon & High-Performance Caching
const CACHE_NAME = "myth-os-core-v2";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

// Offline precaching during installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[OFFLINE CORE] Pre-caching critical application shells.");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Cache clearing on activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[OFFLINE CORE] Purging stale offline cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Hybrid interception fetch handler
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  
  const url = new URL(event.request.url);

  // Bypass other origins (CDN loads, etc.), internal control plane, and api routes
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/__aistudio") || 
    url.pathname.startsWith("/api") || 
    url.pathname.includes("/firestore/")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fetch failed! Pull from cache or return SPA html shells
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get("accept")?.includes("text/html")) {
            console.log("[OFFLINE CORE] Offline detected. Routing through SPA fallback shell.");
            return caches.match("/index.html");
          }
        });
      })
  );
});

// Push notification hooks
self.addEventListener("push", (event) => {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { notification: { title: "Quantum OS Message", body: event.data.text() } };
    }
    
    const title = data.notification?.title || "Quantum OS Alert";
    const options = {
      body: data.notification?.body || "Subsystem completed compilation.",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png"
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});
