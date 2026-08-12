# معمارية المشروع (ARCHITECTURE.md)

يعتمد تطبيق "أنيس القلوب" على مبدأ التوزيع وفصل الاهتمامات (Separation of Concerns).

## الطبقات الأساسية (Core Layers)

1. **Presentation Layer (واجهة المستخدم)**
   - مكونة من مكونات React.
   - التصميم باستخدام Tailwind CSS.
   - الحركات والرسوم المتحركة باستخدام Framer Motion.

2. **State Management (إدارة الحالة)**
   - تُدار من خلال React Hooks و Context API.
   - فصل المنطق المعقد في Custom Hooks.

3. **Data Access Layer (طبقة الوصول للبيانات)**
   - الاتصال بقاعدة البيانات المحلية (IndexedDB) عبر Dexie.
   - التجريد عبر خدمات مساعدة (`src/services`).

4. **Sync Layer (طبقة المزامنة)**
   - التعامل مع Supabase لإرسال واستقبال البيانات بين التخزين المحلي والسحابي.
   - تعمل بشكل غير متزامن (Asynchronous) في الخلفية ولا توقف واجهة المستخدم.

## تنظيم الملفات
```
src/
 ├── components/    # المكونات المشتركة
 ├── pages/         # الشاشات الرئيسية
 ├── hooks/         # دوال الهوكس المخصصة
 ├── services/      # الاتصال بالخدمات الخارجية (Supabase, Gemini)
 ├── db/            # إعدادات Dexie لـ IndexedDB
 ├── utils/         # دوال مساعدة لتهيئة النصوص والأدوات
 ├── types/         # واجهات TypeScript
 ├── App.tsx        # نقطة البداية
 └── main.tsx       # إعداد التطبيق في الـ DOM
```
