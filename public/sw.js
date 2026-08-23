const CACHE_NAME = 'anis-al-qulub-app-v4';
const RUNTIME_CACHE = 'anis-al-qulub-runtime-v4';

// الموارد الأساسية التي يجب تخزينها فوراً عند التثبيت
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Event: تخزين الملفات الأساسية بأمان بدون إلغاء التثبيت في حال تعثر ملف واحد
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // استخدام Promise.allSettled لضمان عدم توقف التثبيت إذا تعذر تحميل أي عنصر فردي
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok) {
              await cache.put(url, res);
            }
          } catch (e) {
            console.warn('Precache warning for url:', url, e);
          }
        })
      );
    })
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

// Fetch Event: استراتيجيات الكاش الذكية للعمل 100% بدون تعثر أو أخطاء غير متوقعة
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. التعامل مع طلبات التصفح (Navigation Requests) - عند فتح أو تحديث التطبيق
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // المحاولة من الشبكة أولاً للحصول على أحدث نسخة عند التحديث
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (err) {
          console.warn('Navigation network fetch failed, using cache fallback:', err);
        }

        // في حال فشل الشبكة أو وضع عدم الاتصال، جلب الصفحة الرئيسية من الكاش
        const cachedIndex = await caches.match('/index.html') || await caches.match('/') || await caches.match(event.request);
        if (cachedIndex) {
          return cachedIndex;
        }

        // استجابة احتياطية ناعمة في أقسى الظروف
        return new Response(
          '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>أنيس القلوب</title></head><body style="font-family:sans-serif;text-align:center;padding:2rem;background:#022c22;color:#fff;"><h2>أنيس القلوب</h2><p>تتم إعادة الاتصال بالشبكة...</p><button onclick="window.location.reload()" style="padding:10px 20px;border-radius:20px;background:#d4af37;border:none;color:#000;font-weight:bold;cursor:pointer;">إعادة المحاولة</button></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })()
    );
    return;
  }

  // 2. استراتيجية Cache First للملفات الثابتة والصوتيات والأيقونات وحزم الواجهة
  if (
    url.hostname.includes('esm.sh') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('everyayah.com') ||
    url.hostname.includes('cdn.aladhan.com') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|json|mp3|wav|ogg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            const contentType = (networkResponse.headers.get('content-type') || '').toLowerCase();
            const isAudioReq = url.pathname.match(/\.(mp3|wav|ogg)$/) || url.hostname.includes('aladhan.com') || url.hostname.includes('everyayah.com');

            if (!isAudioReq || (!contentType.includes('text/html') && !contentType.includes('application/xhtml'))) {
              cache.put(event.request, networkResponse.clone());
            }
          }
          return networkResponse;
        } catch (err) {
          console.warn('Asset fetch error:', url.href, err);
          // لإرجاع أداة احتياطية للصور/الأيقونات دون إلقاء خطأ قاتل في المتصفح
          if (url.pathname.match(/\.(svg|png|jpg|jpeg)$/)) {
            const svgFallback = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
            return new Response(svgFallback, { headers: { 'Content-Type': 'image/svg+xml' } });
          }
          return new Response('Asset Unavailable', { status: 503, statusText: 'Service Unavailable' });
        }
      })()
    );
    return;
  }

  // 3. استراتيجية Stale-While-Revalidate/Network-First لبقية الموارد (JS / CSS)
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('Resource Unavailable Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});

// الاستماع للرسائل من التطبيق
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'UPDATE_PRAYER_SCHEDULE') {
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

// Periodic Sync & Notification handling
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
