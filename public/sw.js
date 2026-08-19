const CACHE_NAME = 'anis-al-qulub-app-v2';
const RUNTIME_CACHE = 'anis-al-qulub-runtime-v2';

// الموارد الأساسية التي يجب تخزينها فوراً عند التثبيت
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Event: تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.log('Precache error:', err))
  );
});

// Activate Event: تنظيف النسخ القديمة والسيطرة فوراً
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: استراتيجيات الكاش الذكية للعمل 100% بدون اتصال
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // استراتيجية 1: Cache First للملفات الثابتة والصوتيات
  if (
    url.hostname.includes('esm.sh') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('everyayah.com') ||
    url.hostname.includes('cdn.aladhan.com') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|json|mp3|wav|ogg)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return caches.open(RUNTIME_CACHE).then((cache) => {
          return fetch(event.request).then((response) => {
            if (response && response.status === 200 && response.type !== 'error') {
              cache.put(event.request, response.clone());
            }
            return response;
          }).catch(() => null);
        });
      })
    );
    return;
  }

  // استراتيجية 2: Stale-While-Revalidate للواجهة
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// الاستماع للرسائل من التطبيق (مثل طلب تشغيل/إيقاف الأذان وتحديث جدول الصلاة)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'UPDATE_PRAYER_SCHEDULE') {
    // حفظ جدول الصلوات المحسوب محلياً في الكاش للاستخدام بدون اتصال
    caches.open(RUNTIME_CACHE).then((cache) => {
      const response = new Response(JSON.stringify(event.data.data), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('/offline-prayer-schedule.json', response);
    });
  } else if (event.data.type === 'STOP_ADHAN') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: 'STOP_ADHAN' }));
    });
  } else if (event.data.type === 'TRIGGER_ADHAN_PLAYBACK') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({
        type: 'PLAY_ADHAN',
        prayerName: event.data.prayerName,
        muezzinId: event.data.muezzinId
      }));
    });
  }
});

// Background Sync & Periodic Background Sync للتحقق من أوقات الصلاة بالخلفية
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-prayer-times' || event.tag === 'check-adhan-alarm') {
    event.waitUntil(checkPrayerTimesAndNotify());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prayer-times' || event.tag === 'adhan-sync') {
    event.waitUntil(checkPrayerTimesAndNotify());
  }
});

// التعامل مع المزامنة والتنزيل في الخلفية (Background Fetch)
self.addEventListener('backgroundfetchsuccess', (event) => {
  event.waitUntil(
    (async () => {
      const bgFetch = event.registration;
      const cache = await caches.open(RUNTIME_CACHE);
      const records = await bgFetch.matchAll();

      for (const record of records) {
        const response = await record.responseReady;
        await cache.put(record.request, response);
      }

      await bgFetch.updateUI({ title: 'تم تنزيل صلة الأذان أوفلاين بنجاح ✨' });
    })()
  );
});

self.addEventListener('backgroundfetchfail', (event) => {
  console.warn('Background Fetch failed:', event.registration.id);
});

// دالة فحص أوقات الصلاة بالخلفية بدون اتصال
async function checkPrayerTimesAndNotify() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match('/offline-prayer-schedule.json');
    if (!cachedResponse) return;

    const scheduleData = await cachedResponse.json();
    const now = new Date();
    const nowTime = now.getTime();

    if (Array.isArray(scheduleData)) {
      for (const day of scheduleData) {
        if (day.prayersList) {
          for (const prayer of day.prayersList) {
            const prayerTime = new Date(prayer.time).getTime();
            const timeDiff = Math.abs(nowTime - prayerTime);

            // إذا كان موعد الصلاة في خلال دقيقتين من الآن
            if (timeDiff <= 2 * 60 * 1000) {
              await self.registration.showNotification(`حان الآن موعد أذان ${prayer.name}`, {
                body: `الله أكبر، حان وقت صلاة ${prayer.name}.`,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                tag: `adhan-${prayer.name}-${now.toDateString()}`,
                renotify: true,
                requireInteraction: true,
                vibrate: [500, 250, 500, 250, 1000],
                dir: 'rtl',
                lang: 'ar',
                actions: [
                  { action: 'stop-adhan', title: 'إيقاف الأذان' },
                  { action: 'open-app', title: 'فتح التطبيق' }
                ]
              });

              // إرسال إشارة للتطبيق لفتح وتشغيل الأذان تلقائياً
              const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
              clientsList.forEach(client => {
                client.postMessage({
                  type: 'TRIGGER_ADHAN_NOTIFICATION',
                  prayerName: prayer.name
                });
              });
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Background prayer check error:', err);
  }
}

// التعامل مع النقر على إشعارات الأذان في أندرويد و PWA / TWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (action === 'stop-adhan') {
        clientList.forEach((client) => {
          client.postMessage({ type: 'STOP_ADHAN' });
        });
        return;
      }

      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
