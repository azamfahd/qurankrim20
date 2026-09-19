# تطبيق أنيس القلوب - النسخة الأصيلة للأندرويد (Native Android App)
### مبني بلغة Kotlin و Jetpack Compose & Material Design 3

هذا المجلد يحتوي على **المشروع البرمجي الأصيل الكامل لتطبيق أنيس القلوب لنظام أندرويد**، مصمم ومكتوب بأحدث المعايير البرمجية لشركة Google لعام 2026.

---

## 🌟 المواصفات التقنية للمشروع:
- **لغة البرمجة**: Kotlin 2.0.0
- **واجهة المستخدم (UI Toolkit)**: Jetpack Compose + Material Design 3 (M3)
- **دعم الاتجاه (RTL)**: دعم كامل وتلقائي للغة العربية من اليمين إلى اليسار (`CompositionLocalProvider`).
- **قواعد البيانات المحلية**: Room Database (تخزين سور، آيات، تفاسير، أذكار، وعلامات حفظ).
- **محرك الصوت في الخلفية**: Google Media3 / ExoPlayer مع `MediaSessionService` وشريط تحكم دائم في شاشة القفل والإشعارات.
- **تنبيهات الأذان الدقيقة**: `AlarmManager` بنظام `SCHEDULE_EXACT_ALARM` مع `WakeLock` لتفادي وضع السكون وتجاوز حظر Doze Mode.
- **تذكيرات الأذكار الخلفية**: `WorkManager` الدوري.
- **حساب المواقيت والقبلة**: خوارزميات فلكية رياضية دقيقة بالاعتماد على إحداثيات GPS.

---

## 🚀 كيفية فتح وتشغيل وبناء التطبيق عبر Android Studio:

### 1. المتطلبات:
- تثبيت **Android Studio** (إصدار Iguana أو Jellyfish أو Koala فما فوق).
- تثبيت **JDK 17** أو **JDK 21**.

### 2. فتح المشروع:
1. افتح **Android Studio**.
2. اختر **Open** ثم حدد مجلد `android-native`.
3. انتظر حتى ينتهي الـ Gradle من تحميل المكاتب وفهرسة المشروع (Sync Project with Gradle Files).

### 3. بناء ملف APK للتجربة (Debug APK):
من الطرفية (Terminal) داخل مجلد `android-native`:
```bash
./gradlew assembleDebug
```
ستجد ملف الـ APK في المسار:
`app/build/outputs/apk/debug/app-debug.apk`

### 4. بناء ملف APK النهائي للإنتاج (Release APK):
```bash
./gradlew assembleRelease
```
ستجد الملف في المسار:
`app/build/outputs/apk/release/app-release.apk`

### 5. تصدير حزمة النشر لمتجر Google Play (AAB):
```bash
./gradlew bundleRelease
```
ستجد ملف الـ AAB في المسار:
`app/build/outputs/bundle/release/app-release.aab`

---

## 📁 هيكلية المجلدات الرئيسية:
```text
android-native/
├── app/
│   ├── build.gradle.kts           # إعدادات المكتبات وبناء التطبيق
│   ├── src/main/
│   │   ├── AndroidManifest.xml   # أذونات النظام والخدمات
│   │   ├── java/com/anisalqulub/app/
│   │   │   ├── MainActivity.kt        # نقطة الدخول الرئيسية و NavHost
│   │   │   ├── AnisApplication.kt     # قنوات الإشعارات وقاعدة بيانات Room
│   │   │   ├── theme/                 # ألوان وخطوط وأنماط Material 3
│   │   │   ├── data/
│   │   │   │   ├── model/             # نماذج الآيات، السور، التفاسير، والمواقيت
│   │   │   │   ├── local/             # Room Database & DAOs
│   │   │   │   └── repository/        # مستودعات جلب البيانات والحسابات الفلكية
│   │   │   ├── service/               # خدمات الأذان والصوت Media3 و WorkManager
│   │   │   └── ui/
│   │   │       ├── screens/           # شاشات المصحف، المواقيت، الأذكار، والإعدادات
│   │   │       └── components/        # أشرطة التنقل وقوائم التفسير
│   │   └── res/                       # القيم والنصوص والأيقونات
├── build.gradle.kts
└── settings.gradle.kts
```
