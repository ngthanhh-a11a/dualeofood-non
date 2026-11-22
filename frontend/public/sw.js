const CACHE_NAME = 'dualeofood-pwa-v1.0.0';

// Các tài nguyên giao diện cơ bản cần lưu trữ trước
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 1. Cài đặt Service Worker: Lưu trước tài nguyên cơ sở
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Lỗi khi precache một số tài nguyên tĩnh:', err);
      });
    })
  );
});

// 2. Kích hoạt: Tự động dọn dẹp các phiên bản cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xử lý tải dữ liệu (Fetch): AN TOÀN TUYỆT ĐỐI CHO DATA & REALTIME
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // QUY TẮC VÀNG 1: Không can thiệp các request không phải GET
  if (request.method !== 'GET') {
    return;
  }

  // QUY TẮC VÀNG 2: Tuyệt đối NETWORK-ONLY cho API và Socket.io (Không bao giờ cache dữ liệu động)
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/socket.io') ||
    url.hostname.includes('vietqr.io') ||
    url.hostname.includes('nominatim.openstreetmap.org') ||
    url.hostname.includes('router.project-osrm.org')
  ) {
    return; // Để trình duyệt trực tiếp gọi mạng bình thường
  }

  // Đối với điều hướng trang HTML (Navigation): Network-First, mất mạng mới dùng cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Đối với tài nguyên giao diện tĩnh (JS, CSS, Ảnh, Font chữ): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Sẵn sàng nhận thông báo đẩy Web Push (Mô-đun 05)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Bạn có thông báo mới từ DualeoFood!',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'DualeoFood', options)
    );
  } catch (err) {
    console.warn('Lỗi xử lý push notification:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
