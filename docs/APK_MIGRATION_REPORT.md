# تقرير ودليل التحويل إلى تطبيق أندرويد (APK / AAB)
**هذا الملف مصمم ليكون دليلاً شاملاً وتفصيلياً للمطورين، وكذلك كدليل إرشادي (Prompt) لأي وكيل ذكاء اصطناعي (مثل GitHub Copilot أو Cursor أو غيره) ليتمكن من تحويل المشروع إلى تطبيق أندرويد بشكل مستقل.**

## 1. آلية عمل التطبيق كـ APK مستقل
عند تحويل هذا المشروع إلى تطبيق APK/AAB، سيعمل كتطبيق أندرويد أصلي ومستقل (Native-like) مع الميزات التالية:
- **المفاتيح والمتغيرات البيئية (API Keys)**: لا تحتاج لإدخال مفاتيح `Supabase` أو `Gemini` يدوياً في ملفات الأندرويد. سيتم حقنها أثناء عملية البناء (`npm run build`) داخل حزمة الجافاسكربت. ستعمل الاتصالات مع Supabase و Gemini بسلاسة من داخل التطبيق كما تعمل في المتصفح.
- **قاعدة البيانات**: 
  - **السحابية**: سيستمر الاتصال بقاعدة بيانات Supabase لرفع ومزامنة البيانات بشكل طبيعي عبر الـ API.
  - **المحلية (SQLite)**: بدلاً من الاعتماد على `IndexedDB` التي قد يحذفها نظام أندرويد لتوفير المساحة، سنستبدلها بـ `SQLite` لضمان بقاء بيانات المصحف والتلاوات محفوظة بشكل دائم على الجهاز.
- **التنبيهات والأذان في الخلفية**: سيتطلب التطبيق إضافة صلاحيات (Permissions) لنظام الأندرويد للعمل في الخلفية، وسنستخدم إضافات Capacitor المخصصة للتنبيهات المجدولة (Local Notifications) لتشغيل الأذان حتى لو كان التطبيق مغلقاً.
- **الوصول للملفات**: سنحتاج صلاحيات لقراءة وكتابة الملفات (Storage Permissions) لتنزيل التلاوات الصوتية وحفظها في ذاكرة الهاتف.

---

## 2. خطوات التحويل الآلي (دليل لوكيل الذكاء الاصطناعي)
**أيها الوكيل الذكي (AI Agent)، إذا طُلب منك تحويل هذا المشروع إلى تطبيق APK، يرجى قراءة وتطبيق الخطوات التالية بالترتيب بدقة:**

### الخطوة صفر: التجهيز المسبق واستكمال الميزات (Pre-Migration Feature Check)
**أيها الوكيل الذكي، قبل البدء في أوامر Capacitor والتحويل، يجب عليك مراجعة كود React الحالي والتأكد من اكتمال الميزات التالية، وإذا كانت ناقصة، قم ببرمجتها أولاً:**
1. **نظام الأذان ومواقيت الصلاة**: تأكد من وجود واجهة مستخدم (UI) لعرض مواقيت الصلاة (باستخدام مكتبة `adhan` الموجودة في `package.json`).
2. **المؤذنون والصوتيات**: تأكد من إضافة قائمة منسدلة لاختيار المؤذن، وتوفير روابط أو ملفات صوتية (`mp3`) للأذان لكل مؤذن.
3. **التخزين المؤقت**: تأكد من أن حالة التطبيق (State) مصممة بشكل يسمح بحفظ إعدادات الأذان والمؤذن المختار.
**لا تنتقل للخطوات التالية إلا بعد التأكد من أن هذه الميزات مكتملة وتعمل في بيئة الويب (React).**

### الخطوة الأولى: تثبيت أدوات Capacitor الأساسية
قم بتشغيل الأوامر التالية في الطرفية (Terminal):
```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init "Anis Al-Qulub" "com.anis.alqulub" --web-dir dist
npm install @capacitor/android
npx cap add android
```

### الخطوة الثانية: تثبيت إضافات Capacitor المطلوبة
لتحقيق التوافق مع النظام الأصلي (Background، SQLite، Notifications، Files)، قم بتثبيت الإضافات التالية:
```bash
npm install @capacitor-community/sqlite
npm install @capacitor/local-notifications
npm install @capacitor/background-runner
npm install @capacitor/filesystem
npm install @capacitor/device
```

### الخطوة الثالثة: تعديل الصلاحيات في ملف `AndroidManifest.xml`
افتح الملف `android/app/src/main/AndroidManifest.xml` وأضف الصلاحيات التالية داخل وسم `<manifest>`:
```xml
<!-- أذونات الإنترنت -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- أذونات التنبيهات والأذان -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<!-- أذونات التخزين لتنزيل التلاوات -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<!-- أذونات العمل في الخلفية (Background Services) -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### الخطوة الرابعة: دمج SQLite بدلاً من IndexedDB (تجريد البيانات)
1. قم بإنشاء ملف `src/db/sqlite.ts`.
2. استورد `@capacitor-community/sqlite` وقم بإنشاء اتصال بقاعدة بيانات SQLite.
3. قم بتعديل ملف `src/db/index.ts` (الذي يستخدم Dexie حالياً) لإضافة فحص: 
   - إذا كانت بيئة العمل هي تطبيق (عبر `Capacitor.isNativePlatform()`)، استخدم `sqlite.ts`.
   - إذا كانت متصفح، استمر في استخدام Dexie.

### الخطوة الخامسة: إعداد التنبيهات المجدولة للأذان
1. أنشئ ملف `src/services/notifications.ts`.
2. استخدم `@capacitor/local-notifications` لجدولة مواقيت الصلاة (الأذان).
3. قم بتعيين الصوت (ملف أذان بصيغة mp3) ليعمل مع الـ Notification Channel الخاصة بالأندرويد.

### الخطوة السادسة: تحميل الملفات الصوتية (التلاوات) للملفات المحلية
بدلاً من تشغيل الصوتيات عبر الروابط المباشرة (التي تحتاج إنترنت)، استخدم `@capacitor/filesystem` لتحميل ملفات mp3 إلى مجلد الـ Data الخاص بالتطبيق، ثم قم بتشغيلها من المسار المحلي.

### الخطوة السابعة: البناء والمزامنة
بعد الانتهاء من كتابة وتعديل الكود، يجب بناء الواجهة الأمامية ثم مزامنتها مع مشروع الأندرويد:
```bash
npm run build
npx cap sync android
```

### الخطوة الثامنة: استخراج ملف APK / AAB
1. قم بفتح المشروع في Android Studio:
   ```bash
   npx cap open android
   ```
2. في Android Studio، انتقل إلى `Build > Generate Signed Bundle / APK`.
3. قم بإنشاء `Keystore` (مفتاح التوقيع) واحفظ بياناته.
4. قم باختيار `Release` واضغط على `Finish` لبناء ملف الـ `app-release.apk` أو `.aab` الجاهز للنشر على متجر Google Play.

---

## 3. تنويهات إضافية للمطور
- **الأذان في الخلفية**: في هواتف أندرويد الحديثة (Android 12+)، نظام توفير الطاقة (Doze Mode) قد يمنع التنبيهات من العمل بدقة. يجب توجيه المستخدم من داخل التطبيق لاستثناء التطبيق من "تحسين البطارية" (Battery Optimization) لضمان انطلاق الأذان في وقته بالضبط.
- **التوجيه (Routing)**: تأكد من التعامل مع زر الرجوع الفعلي في هواتف أندرويد. قم بإضافة `App.addListener('backButton', ...)` الخاص بـ Capacitor لإغلاق النوافذ المنبثقة أولاً قبل الخروج من التطبيق.
