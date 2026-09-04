const CACHE_NAME = 'anis-al-qulub-app-v8';
const RUNTIME_CACHE = 'anis-al-qulub-runtime-v8';

// الموارد الأساسية القليلة الثابتة جداً
const BASE_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/version.json',
  '/build-assets.json',
  '/app-icon.svg',
];

// Install Event: تخزين الملفات الأساسية وحزم البناء بأمان
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. تخزين الملفات الثابتة المعرفة مسبقاً
      const precachePromises = BASE_PRECACHE.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok) {
            await cache.put(url, res);
          }
        } catch (e) {
          console.warn('Precache warning for base static asset:', url, e);
        }
      });
      await Promise.allSettled(precachePromises);

      // 2. فحص وتخزين كافة ملفات المشروع (JS/CSS/Audio/Fonts) من build-assets.json
      try {
        const manifestRes = await fetch('/build-assets.json?t=' + Date.now(), { cache: 'no-store' });
        if (manifestRes.ok) {
          const dynamicAssets = await manifestRes.json();
          if (Array.isArray(dynamicAssets)) {
            const dynamicPromises = dynamicAssets.map(async (assetPath) => {
              try {
                // Ensure we don't re-fetch what's already in BASE_PRECACHE to save slightly
                if (!BASE_PRECACHE.includes(assetPath)) {
                  const aRes = await fetch(assetPath, { cache: 'no-cache' });
                  if (aRes.ok) {
                    await cache.put(assetPath, aRes);
                  }
                }
              } catch (err) {
                console.warn('Precache warning for build chunk/asset:', assetPath, err);
              }
            });
            await Promise.allSettled(dynamicPromises);
          }
        }
      } catch (manifestErr) {
        console.warn('Dynamic build manifest precache skipped or offline:', manifestErr);
      }
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
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (err) {
          console.warn('Navigation network fetch failed, using cache fallback:', err);
        }

        const cachedIndex = await caches.match('/index.html') || await caches.match('/') || await caches.match(event.request);
        if (cachedIndex) {
          return cachedIndex;
        }

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
  } else if (event.data.type === 'CHECK_APK_UPDATE') {
    if (event.data.installedVersion) {
      checkApkVersionAndNotify(event.data.installedVersion);
    }
  } else if (event.data.type === 'UPDATE_PRAYER_SCHEDULE') {
    caches.open(RUNTIME_CACHE).then((cache) => {
      const payload = {
        schedule: Array.isArray(event.data.data) ? event.data.data : (event.data.data?.schedule || []),
        muezzinId: event.data.muezzinId || 'mishary',
        updatedAt: Date.now()
      };
      const response = new Response(JSON.stringify(payload), {
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
  } else if (event.data.type === 'SCHEDULE_DHIKR_REMINDER') {
    // Save or update dhikr schedule and settings in runtime cache for offline/background
    caches.open(RUNTIME_CACHE).then((cache) => {
      const payload = {
        settings: event.data.settings || {},
        database: event.data.database || [],
        timestamp: Date.now()
      };
      const response = new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('/offline-dhikr-settings.json', response);
    });
  } else if (event.data.type === 'CHECK_PWA_UPDATE') {
    checkPwaVersionAndNotify();
  } else if (event.data.type === 'TEST_DHIKR_NOTIFICATION') {
    // Test lock-screen & background notification immediately
    triggerDirectDhikrNotification(event.data.dhikr);
  }
});

// دالة فحص وتنبيه المستخدم بوجود تحديث جديد لنسخة المتصفح / PWA
async function checkPwaVersionAndNotify() {
  try {
    const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const networkData = await res.json();
    
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match('/version.json');
    
    let needsUpdate = false;
    
    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      if (networkData.timestamp && cachedData.timestamp && networkData.timestamp > cachedData.timestamp) {
        needsUpdate = true;
      }
    } else {
      // Save it for the first time
      await cache.put('/version.json', new Response(JSON.stringify(networkData)));
    }
    
    if (needsUpdate) {
      await cache.put('/version.json', new Response(JSON.stringify(networkData)));
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clientsList.forEach((client) => {
        client.postMessage({
          type: 'PWA_UPDATE_AVAILABLE',
          versionInfo: networkData
        });
      });
    }
  } catch (err) {
    console.warn('PWA version check failed:', err);
  }
}

// دالة فحص وتنبيه المستخدم بوجود تحديث جديد لملف الـ APK
async function checkApkVersionAndNotify(currentInstalledVersion) {
  try {
    const res = await fetch('/api/version', { cache: 'no-cache' });
    if (!res.ok) return;
    const data = await res.json();
    
    if (data && data.apk && data.apk.available) {
      const serverVersion = data.apk.version || data.version;
      const isNewer = isVersionNewer(serverVersion, currentInstalledVersion);

      if (isNewer) {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clientsList.forEach((client) => {
          client.postMessage({
            type: 'APK_UPDATE_AVAILABLE',
            versionInfo: {
              version: serverVersion,
              releaseNotes: data.apk.releaseNotes,
              sizeFormatted: data.apk.sizeFormatted,
              downloadUrl: data.apk.downloadUrl || '/app-release.apk'
            }
          });
        });
      }
    }
  } catch (err) {
    console.warn('Error checking APK version in SW:', err);
  }
}

// دالة مقارنة أرقام الإصدارات SemVer
function isVersionNewer(serverVer, currentVer) {
  if (!serverVer) return false;
  if (!currentVer) return true;
  
  const v1Parts = String(serverVer).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const v2Parts = String(currentVer).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;
    if (p1 > p2) return true;
    if (p1 < p2) return false;
  }
  return false;
}

// Periodic Sync & Notification handling in Background
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-prayer-times' || event.tag === 'check-adhan-alarm') {
    event.waitUntil(checkPrayerTimesAndNotify());
  } else if (event.tag === 'check-dhikr-reminder') {
    event.waitUntil(checkDhikrAndNotify());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prayer-times' || event.tag === 'adhan-sync') {
    event.waitUntil(checkPrayerTimesAndNotify());
  } else if (event.tag === 'dhikr-sync') {
    event.waitUntil(checkDhikrAndNotify());
  }
});

// دالة إطلاق إشعار ذكر مباشر ومتقدم على شاشة القفل والخلفية
async function triggerDirectDhikrNotification(customDhikr) {
  try {
    const dhikr = customDhikr || {
      id: 'prophet_salawat_1',
      text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ',
      virtue: 'من صلى عليّ صلاة صلى الله عليه بها عشراً',
      category: 'prophet_salawat',
      categoryName: 'الصلاة على النبي ﷺ'
    };

    const isSalawat = dhikr.category === 'prophet_salawat';
    const title = isSalawat ? '✨ صلِّ على النبي ﷺ' : `🌿 ${dhikr.categoryName || 'ذكر الله وطمأنينة القلب'}`;
    const body = `${dhikr.text}${dhikr.virtue ? `\n\nفضل الذكر: ${dhikr.virtue}` : ''}`;

    await self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `dhikr-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 400],
      dir: 'rtl',
      lang: 'ar',
      data: { 
        dhikrId: dhikr.id, 
        category: dhikr.category,
        text: dhikr.text 
      },
      actions: [
        { action: 'recite', title: '📿 سبّحت / صلّيت' },
        { action: 'open-app', title: '📖 فتح التطبيق' }
      ]
    });
  } catch (err) {
    console.warn('Error showing direct dhikr notification in SW:', err);
  }
}

// دالة فحص وتنبيه الأذكار بالخلفية وشاشة القفل
async function checkDhikrAndNotify() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match('/offline-dhikr-settings.json');
    if (!cachedResponse) return;

    const payload = await cachedResponse.json();
    const settings = payload.settings;
    if (!settings || !settings.enabled) return;

    // Check quiet hours
    if (settings.quietHoursEnabled) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = (settings.quietHoursStart || '23:00').split(':').map(Number);
      const [endH, endM] = (settings.quietHoursEnd || '06:00').split(':').map(Number);
      const startTotal = (startH || 0) * 60 + (startM || 0);
      const endTotal = (endH || 0) * 60 + (endM || 0);
      const inQuiet = startTotal <= endTotal 
        ? (currentMins >= startTotal && currentMins < endTotal)
        : (currentMins >= startTotal || currentMins < endTotal);
      if (inQuiet) return;
    }

    // Select dhikr item from stored database or defaults
    const db = Array.isArray(payload.database) && payload.database.length > 0
      ? payload.database
      : [
          {
            id: 'salawat_bg_1',
            category: 'prophet_salawat',
            categoryName: 'الصلاة على النبي ﷺ',
            text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
            virtue: 'أولى الناس بي يوم القيامة أكثرهم علي صلاة'
          },
          {
            id: 'baqiyat_bg_1',
            category: 'baqiyat_salihat',
            categoryName: 'الباقيات الصالحات',
            text: 'سُبْحَانَ اللَّهِ ، وَالْحَمْدُ لِلَّهِ ، وَلَا إِلَهَ إِلَّا اللَّهُ ، وَاللَّهُ أَكْبَرُ',
            virtue: 'أحب الكلام إلى الله وأحب مما طلعت عليه الشمس'
          },
          {
            id: 'istighfar_bg_1',
            category: 'istighfar',
            categoryName: 'الاستغفار وسيد الاستغفار',
            text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
            virtue: 'غُفرت ذنوبه وإن كان فرّ من الزحف'
          },
          {
            id: 'hawqala_bg_1',
            category: 'hawqala',
            categoryName: 'الحوقلة وتفريج الكروب',
            text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
            virtue: 'كنز من كنوز الجنة وباب من أبواب الفرج'
          }
        ];

    // Filter by user category if selected
    let candidates = db;
    if (settings.category && settings.category !== 'all') {
      const filtered = db.filter(item => item.category === settings.category);
      if (filtered.length > 0) candidates = filtered;
    }

    const item = candidates[Math.floor(Math.random() * candidates.length)];
    await triggerDirectDhikrNotification(item);

    // Also notify active window clients if any are open in background
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientsList.forEach(client => {
      client.postMessage({
        type: 'TRIGGER_DHIKR_ALERT',
        dhikr: item
      });
    });
  } catch (err) {
    console.warn('Background dhikr check error in SW:', err);
  }
}

// دالة فحص أوقات الصلاة بالخلفية بدون اتصال
async function checkPrayerTimesAndNotify() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match('/offline-prayer-schedule.json');
    if (!cachedResponse) return;

    const rawData = await cachedResponse.json();
    let scheduleData = null;
    let targetMuezzinId = 'mishary';

    if (Array.isArray(rawData)) {
      scheduleData = rawData;
    } else if (rawData && typeof rawData === 'object') {
      scheduleData = rawData.schedule || [];
      targetMuezzinId = rawData.muezzinId || 'mishary';
    }

    const now = new Date();
    const nowTime = now.getTime();

    if (Array.isArray(scheduleData)) {
      const SW_PRAYER_VERSES = [
        "۞ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا ۞",
        "۞ وَأَقِمِ الصَّلَاةَ طَرَفَيِ النَّهَارِ وَزُلَفًا مِّنَ اللَّيْلِ ۚ إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ ۞",
        "۞ يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ۞",
        "۞ أَقِمِ الصَّلَاةَ لِدُلُوكِ الشَّمْسِ إِلَىٰ غَسَقِ اللَّيْلِ وَقُرْآنَ الْفَجْرِ ۖ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا ۞",
        "۞ وَأَقِمِ الصَّلَاةَ لِذِكْرِي ۞"
      ];
      const randomVerse = SW_PRAYER_VERSES[Math.floor(Math.random() * SW_PRAYER_VERSES.length)];

      for (const day of scheduleData) {
        if (day.prayersList) {
          for (const prayer of day.prayersList) {
            const prayerTime = new Date(prayer.time).getTime();
            const timeDiff = Math.abs(nowTime - prayerTime);

            if (timeDiff <= 2 * 60 * 1000) {
              await self.registration.showNotification(`🕌 حان الآن موعد أذان ${prayer.name}`, {
                body: `${randomVerse}\n\nالله أكبر، حان وقت صلاة ${prayer.name}. حان وقت لقاء الله وطمأنينة القلب.`,
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                tag: `adhan-${prayer.name}-${now.toDateString()}`,
                renotify: true,
                requireInteraction: true,
                vibrate: [500, 250, 500, 250, 1000],
                silent: false,
                dir: 'rtl',
                lang: 'ar',
                actions: [
                  { action: 'stop-adhan', title: 'إيقاف وإغلاق ❌' }
                ]
              });

              const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
              clientsList.forEach(client => {
                client.postMessage({
                  type: 'TRIGGER_ADHAN_NOTIFICATION',
                  prayerName: prayer.name,
                  muezzinId: targetMuezzinId
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

// معالجة الضغط على إشعارات الخلفية وشاشة القفل
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const notificationData = event.notification.data || {};

  event.waitUntil(
    (async () => {
      // 1. إذا ضغط المستخدم زر التسبيح السريع مباشرة من شاشة القفل
      if (action === 'recite') {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clientsList.forEach((client) => {
          client.postMessage({ 
            type: 'RECORD_RECITATION',
            category: notificationData.category || 'all'
          });
        });

        // إشعار تأكيد خفيف ولطيف
        try {
          await self.registration.showNotification('✨ تقبل الله طاعتكم', {
            body: 'أُجرت بحمد الله! تم تسجيل الذكر والتسبيح في صحيفتك المباركة.',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'dhikr-ack',
            vibrate: [100, 50, 100],
            silent: true,
            dir: 'rtl',
            lang: 'ar'
          });
        } catch {}
        return;
      }

      // 2. إذا ضغط المستخدم إيقاف الأذان
      if (action === 'stop-adhan') {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clientsList.forEach((client) => {
          client.postMessage({ type: 'STOP_ADHAN' });
        });
        return;
      }

      // 3. فتح أو تركيز التطبيق
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'SHOW_DHIKR_BANNER_DIRECT',
            data: notificationData
          });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        const dhikrParam = notificationData.dhikrId ? '&dhikrId=' + encodeURIComponent(notificationData.dhikrId) : '';
        return self.clients.openWindow('/?source=notification' + dhikrParam);
      }
    })()
  );
});
