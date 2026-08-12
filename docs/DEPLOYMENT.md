# دليل النشر (DEPLOYMENT.md)

تطبيق أنيس القلوب هو تطبيق واجهة أمامية (SPA / PWA) تم بناؤه باستخدام Vite.

## المتطلبات الأساسية للنشر
يجب أن يتم تعيين المتغيرات البيئية التالية في منصة الاستضافة:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY` (لخدمات الذكاء الاصطناعي - اختياري للميزات الأساسية)

## خيارات النشر

### 1. النشر على Vercel
تم إعداد المشروع بملف `vercel.json` لمعالجة الـ SPA Routing.
- قم بربط مستودع GitHub بحسابك على Vercel.
- سيكتشف Vercel تلقائياً أن المشروع مبني بـ Vite ويعين إعدادات البناء:
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
- أضف المتغيرات البيئية في إعدادات المشروع (Settings > Environment Variables).

### 2. النشر على Netlify
تم إعداد المشروع بملف `netlify.toml` لتوجيه كل الطلبات لـ `index.html`.
- اسحب المستودع في منصة Netlify.
- أضف المتغيرات البيئية.
- انقر على "Deploy".

### 3. خوادم أخرى (Nginx / Apache)
- قم بتشغيل `npm run build`.
- قم برفع محتويات مجلد `dist` إلى مسار الويب الخاص بك.
- تأكد من إعداد الخادم لتوجيه كافة طلبات الـ 404 (Fallbacks) إلى `index.html` (مثل `try_files $uri $uri/ /index.html;` في Nginx).
