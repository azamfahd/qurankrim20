import React from 'react';
import { PieChart, BarChart2, Hash, Scale, Zap, BookOpen, Divide } from 'lucide-react';

export const NumericalAnalysisViewer = ({ id }: { id: string }) => {
  if (id === 'sea-land-ratio') {
    return (
      <div className="bg-sky-50 dark:bg-sky-950/20 p-5 rounded-xl border border-sky-100 dark:border-sky-900/30 my-4 space-y-4">
        <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-black">
          <PieChart className="w-5 h-5" />
          <span>تحليل النسبة الجغرافية</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm border-t-4 border-blue-500">
            <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">32</span>
            <span className="text-xs font-bold text-stone-500">تكرار كلمة (البحر)</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm border-t-4 border-amber-600">
            <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">13</span>
            <span className="text-xs font-bold text-stone-500">تكرار كلمة (البر)</span>
          </div>
        </div>
        <div className="w-full bg-amber-200 dark:bg-amber-900/50 rounded-full h-6 flex overflow-hidden shadow-inner relative">
          <div className="bg-blue-500 h-6 flex items-center justify-center text-[10px] font-black text-white" style={{ width: '71.11%' }}>
            البحر 71.11%
          </div>
          <div className="flex-1 h-6 flex items-center justify-center text-[10px] font-black text-amber-800 dark:text-amber-200">
            البر 28.89%
          </div>
        </div>
        <div className="text-center text-xs font-bold text-stone-600 dark:text-gray-400">
          المجموع: 45 كلمة (32 بحر + 13 بر)
        </div>
      </div>
    );
  }

  if (id === 'isa-adam-equality') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 my-4 space-y-4">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black">
          <Scale className="w-5 h-5" />
          <span>معادلة التماثل الرقمي</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm border-b-4 border-emerald-500">
            <span className="block text-xl font-bold text-stone-500">تكرار (عيسى)</span>
            <span className="block text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">25</span>
          </div>
          <div className="text-3xl font-black text-emerald-300 dark:text-emerald-700">=</div>
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm border-b-4 border-emerald-500">
            <span className="block text-xl font-bold text-stone-500">تكرار (آدم)</span>
            <span className="block text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">25</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'month-day-balance') {
    return (
      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 my-4 space-y-4">
        <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-black">
          <BarChart2 className="w-5 h-5" />
          <span>المقياس الزمني الفلكي</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow-sm border-b-4 border-indigo-400">
            <span className="block text-sm font-bold text-stone-500 mb-2">تكرار (شَهْر)</span>
            <span className="block text-4xl font-black text-indigo-600 dark:text-indigo-400">12</span>
            <span className="text-[10px] font-bold text-stone-400 mt-1 block">شهراً في السنة</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow-sm border-b-4 border-amber-400">
            <span className="block text-sm font-bold text-stone-500 mb-2">تكرار (يَوْم)</span>
            <span className="block text-4xl font-black text-amber-500 dark:text-amber-400">365</span>
            <span className="text-[10px] font-bold text-stone-400 mt-1 block">يوماً في السنة الشمسية</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'prostrations-daily-prayers') {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 p-5 rounded-xl border border-rose-100 dark:border-rose-900/30 my-4">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black mb-4">
          <Hash className="w-5 h-5" />
          <span>إحصاء السجود والصلوات</span>
        </div>
        <div className="flex items-center justify-around bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="text-center">
            <span className="block text-sm font-bold text-stone-500">تكرار (سجد) للمكلفين</span>
            <span className="block text-3xl font-black text-rose-600 dark:text-rose-400">34</span>
          </div>
          <div className="text-2xl font-black text-stone-300">=</div>
          <div className="text-center">
            <span className="block text-sm font-bold text-stone-500">عدد سجدات الصلوات الخمس</span>
            <span className="block text-3xl font-black text-rose-600 dark:text-rose-400">34</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'iron-atomic-number') {
    return (
      <div className="bg-stone-100 dark:bg-gray-800/50 p-5 rounded-xl border border-stone-200 dark:border-gray-700 my-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
        <div className="bg-white dark:bg-gray-900 w-32 h-32 rounded-xl shadow-md border-2 border-stone-300 dark:border-gray-600 flex flex-col p-2 relative shrink-0">
          <span className="absolute top-2 left-2 text-xs font-black text-stone-500">26</span>
          <span className="absolute top-2 right-2 text-xs font-bold text-stone-400">56.845</span>
          <div className="flex-1 flex items-center justify-center flex-col">
            <span className="text-4xl font-black text-stone-800 dark:text-white">Fe</span>
            <span className="text-xs font-bold text-stone-500">الحديد</span>
          </div>
        </div>
        <div className="space-y-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
            <div className="w-8 h-8 rounded bg-stone-200 dark:bg-gray-700 flex items-center justify-center font-black text-stone-700 dark:text-gray-300 shrink-0">57</div>
            <span className="text-xs sm:text-sm font-bold text-stone-600 dark:text-gray-400">رقم سورة الحديد = الوزن الذري</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
            <div className="w-8 h-8 rounded bg-stone-200 dark:bg-gray-700 flex items-center justify-center font-black text-stone-700 dark:text-gray-300 shrink-0">26</div>
            <span className="text-xs sm:text-sm font-bold text-stone-600 dark:text-gray-400">حساب الجُمَّل لـ(حديد) = الرقم الذري</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'dunya-akhirah-balance' || id === 'benefit-corruption-balance') {
    return (
      <div className="bg-fuchsia-50 dark:bg-fuchsia-950/20 p-5 rounded-xl border border-fuchsia-100 dark:border-fuchsia-900/30 my-4">
        <div className="flex items-center gap-2 text-fuchsia-800 dark:text-fuchsia-300 font-black mb-4">
          <Scale className="w-5 h-5" />
          <span>ميزان الكلمات المتقابلة</span>
        </div>
        <div className="space-y-3">
          {id === 'dunya-akhirah-balance' ? (
            <>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-r-4 border-fuchsia-500">
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-right">الدُّنْيَا</span>
                <span className="font-black text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/50 px-3 py-1 rounded-md">115</span>
                <span className="font-black text-stone-300 dark:text-gray-600">=</span>
                <span className="font-black text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-100 dark:bg-fuchsia-900/50 px-3 py-1 rounded-md">115</span>
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-left">الآخِرَة</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-r-4 border-sky-500">
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-right">المَلائِكَة</span>
                <span className="font-black text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-3 py-1 rounded-md">88</span>
                <span className="font-black text-stone-300 dark:text-gray-600">=</span>
                <span className="font-black text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-3 py-1 rounded-md">88</span>
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-left">الشَّيَاطِين</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-r-4 border-emerald-500">
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-right">الحَيَاة</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-md">145</span>
                <span className="font-black text-stone-300 dark:text-gray-600">=</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-md">145</span>
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-left">المَوْت</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-r-4 border-amber-500">
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-right">النَّفْع</span>
                <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-md">50</span>
                <span className="font-black text-stone-300 dark:text-gray-600">=</span>
                <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-md">50</span>
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-left">الفَسَاد</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-r-4 border-indigo-500">
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-right">الزَّكَاة</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-md">32</span>
                <span className="font-black text-stone-300 dark:text-gray-600">=</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-md">32</span>
                <span className="font-bold text-stone-600 dark:text-gray-300 w-24 text-left">البَرَكَة</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (id === 'qaf-surah-letter-count') {
    return (
      <div className="bg-cyan-50 dark:bg-cyan-950/20 p-5 rounded-xl border border-cyan-100 dark:border-cyan-900/30 my-4 text-center">
        <BookOpen className="w-6 h-6 text-cyan-600 mx-auto mb-3" />
        <div className="flex justify-center items-center gap-4 text-xl sm:text-2xl font-black text-cyan-800 dark:text-cyan-300 mb-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-stone-500 mb-1">سورة ق</span>
            <span>57</span>
          </div>
          <span className="text-stone-300">+</span>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-stone-500 mb-1">سورة الشورى</span>
            <span>57</span>
          </div>
          <span className="text-stone-300">=</span>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-stone-500 mb-1">عدد سور القرآن</span>
            <span className="text-amber-500">114</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'number-19-structure') {
    return (
      <div className="bg-teal-50 dark:bg-teal-950/20 p-5 rounded-xl border border-teal-100 dark:border-teal-900/30 my-4 text-center">
        <Hash className="w-8 h-8 text-teal-600 mx-auto mb-2" />
        <div className="text-4xl font-black text-teal-700 dark:text-teal-400 mb-4 tracking-widest">19</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-xs font-bold text-stone-600 dark:text-gray-300">
            حروف البسملة = 19
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-xs font-bold text-stone-600 dark:text-gray-300">
            سور القرآن = 114 (19 × 6)
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-xs font-bold text-stone-600 dark:text-gray-300">
            تكرار (الرحمن) = 57 (19 × 3)
          </div>
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-sm text-xs font-bold text-stone-600 dark:text-gray-300">
            تكرار (الرحيم) = 114 (19 × 6)
          </div>
        </div>
      </div>
    );
  }


  if (id === "word-letter-precision") {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 my-4">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black mb-4">
          <BarChart2 className="w-5 h-5" />
          <span>إحصائيات الكلمات التشريعية والكونية</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm border-t-2 border-emerald-400">
            <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">5</span>
            <span className="text-[10px] font-bold text-stone-600 dark:text-gray-300 block">تكرار كلمة (الصلوات)</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm border-t-2 border-sky-400">
            <span className="block text-2xl font-black text-sky-600 dark:text-sky-400">5</span>
            <span className="text-[10px] font-bold text-stone-600 dark:text-gray-300 block">تكرار كلمة (العزم)</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm border-t-2 border-fuchsia-400">
            <span className="block text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">7</span>
            <span className="text-[10px] font-bold text-stone-600 dark:text-gray-300 block">تكرار كلمة (الطواف)</span>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm border-t-2 border-indigo-400">
            <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">7</span>
            <span className="text-[10px] font-bold text-stone-600 dark:text-gray-300 block">تكرار (السماوات السبع)</span>
          </div>
        </div>
      </div>
    );
  }


  if (id === "man-woman-equality") {
    return (
      <div className="bg-pink-50 dark:bg-pink-950/20 p-5 rounded-xl border border-pink-100 dark:border-pink-900/30 my-4">
        <div className="flex items-center gap-2 text-pink-800 dark:text-pink-300 font-black mb-4">
          <Scale className="w-5 h-5" />
          <span>التوازن والتكافؤ العددي</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm border-b-4 border-sky-400">
            <span className="block text-xl font-bold text-stone-500">تكرار (الرَّجُل)</span>
            <span className="block text-4xl font-black text-sky-600 dark:text-sky-400 mt-2">24</span>
          </div>
          <div className="text-3xl font-black text-pink-300 dark:text-pink-700">=</div>
          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm border-b-4 border-pink-400">
            <span className="block text-xl font-bold text-stone-500">تكرار (المَرْأَة)</span>
            <span className="block text-4xl font-black text-pink-600 dark:text-pink-400 mt-2">24</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === "hardship-ease-ratio") {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30 my-4 space-y-4">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black">
          <BarChart2 className="w-5 h-5" />
          <span>الوعد الإلهي المضاعف</span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="w-16 font-bold text-stone-600 dark:text-gray-300 text-left">العسر</span>
            <div className="flex-1 h-8 bg-stone-200 dark:bg-gray-700 rounded-md overflow-hidden flex">
              <div className="bg-rose-500 h-full flex items-center justify-center text-xs font-black text-white" style={{ width: "33.33%" }}>
                12
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-16 font-bold text-stone-600 dark:text-gray-300 text-left">اليسر</span>
            <div className="flex-1 h-8 bg-stone-200 dark:bg-gray-700 rounded-md overflow-hidden flex">
              <div className="bg-emerald-500 h-full flex items-center justify-center text-xs font-black text-white" style={{ width: "100%" }}>
                36 (ثلاثة أضعاف)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === "cave-sleep-words") {
    return (
      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 my-4 text-center">
        <Hash className="w-6 h-6 text-indigo-600 mx-auto mb-3" />
        <p className="text-sm font-bold text-stone-600 dark:text-gray-300 mb-4">مسافة الكلمات تطابق مسافة الزمن</p>
        <div className="flex items-center justify-center flex-wrap gap-2 text-xl sm:text-2xl font-black">
          <span className="text-stone-400">الكلمة رقم 1</span>
          <span className="text-stone-300">...</span>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border-2 border-indigo-400 text-indigo-700 dark:text-indigo-400">
            <span className="block text-xs font-bold text-stone-500 mb-1">الكلمة رقم 300</span>
            <span>( ثَلَاثَ مِائَةٍ )</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === "bee-chromosomes") {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30 my-4 flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* Hexagon shape roughly using a rotated div or SVG */}
        <div className="relative w-24 h-24 bg-amber-400 dark:bg-amber-600 flex items-center justify-center transform rotate-45 rounded-xl shadow-md shrink-0 border-4 border-amber-200 dark:border-amber-800">
          <div className="transform -rotate-45 text-center">
            <span className="block text-3xl font-black text-white drop-shadow-md">16</span>
          </div>
        </div>
        <div className="space-y-3 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-r-4 border-amber-400">
            <span className="text-sm font-bold text-stone-600 dark:text-gray-400">ترتيب سورة النحل في المصحف</span>
            <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded">16</span>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-r-4 border-amber-400">
            <span className="text-sm font-bold text-stone-600 dark:text-gray-400">عدد كروموسومات ذكر النحل</span>
            <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded">16</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === "golden-ratio-mecca") {
    return (
      <div className="bg-sky-50 dark:bg-sky-950/20 p-5 rounded-xl border border-sky-100 dark:border-sky-900/30 my-4">
        <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-black mb-4">
          <Divide className="w-5 h-5" />
          <span>تطبيق النسبة الذهبية (Golden Ratio)</span>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-stone-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-md">
            <span>إجمالي حروف الآية (47)</span>
            <span>÷</span>
            <span>حروف ما قبل بكة (29)</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-sky-600 dark:bg-sky-500 text-white p-4 rounded-xl shadow-lg font-black text-3xl tracking-widest relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 transform rotate-45 -translate-y-4"></div>
              = 1.618...
            </div>
          </div>
          <p className="text-center text-xs font-bold text-sky-700 dark:text-sky-400">النسبة الذهبية المعبرة عن مركز الأرض</p>
        </div>
      </div>
    );
  }

  return null;
};
