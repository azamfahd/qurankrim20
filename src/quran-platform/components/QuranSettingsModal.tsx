import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, BookOpen, Layers, Palette, Type, Check, Settings, ChevronLeft, ChevronRight, Hash, 
  Volume2, Heart, Target, BarChart2, Eye, RefreshCw, Cloud, Database, Sparkles, 
  Loader2, AlertCircle, ArrowDownToLine, Trash2, Compass, Repeat, ListOrdered, 
  Zap, Info, Award
} from 'lucide-react';
import { useQuranContext, MushafTheme } from '../store/QuranContext';
import { QuranSyncService } from '../services/quranSyncService';
import { QuranDataService, TextCacheProgress } from '../services/QuranDataService';

export const MUSHAF_THEMES: {
  id: MushafTheme;
  name: string;
  sub: string;
  previewBg: string;
  previewBorder: string;
  previewHeader: string;
  accent: string;
  textColor: string;
}[] = [
  {
    id: 'royal_green',
    name: 'مصحف المدينة الملكي',
    sub: 'طبعة مجمع الملك فهد',
    previewBg: 'bg-[#fcf8ed]',
    previewBorder: 'border-[#1b4332]',
    previewHeader: 'bg-[#1b4332] text-amber-200',
    accent: '#1b4332',
    textColor: 'text-gray-900',
  },
  {
    id: 'shamarli',
    name: 'مصحف ابن عثمان (الشمرلي)',
    sub: 'الطبعة المصرية التراثية',
    previewBg: 'bg-[#f5eecb]',
    previewBorder: 'border-[#8c6239]',
    previewHeader: 'bg-[#8c6239] text-amber-100',
    accent: '#8c6239',
    textColor: 'text-[#2a1a08]',
  },
  {
    id: 'golden',
    name: 'المصحف الذهبي الفاخر',
    sub: 'إطار مذهب وزخارف أندلسية',
    previewBg: 'bg-[#fffdf7]',
    previewBorder: 'border-amber-400',
    previewHeader: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-white',
    accent: '#d97706',
    textColor: 'text-amber-950',
  },
  {
    id: 'tajweed',
    name: 'مصحف التجويد الملون',
    sub: 'ورق مخملي مع دلالات الأحكام',
    previewBg: 'bg-[#fdf6f0]',
    previewBorder: 'border-[#b5838d]',
    previewHeader: 'bg-[#6d597a] text-pink-100',
    accent: '#b5838d',
    textColor: 'text-gray-900',
  },
  {
    id: 'night',
    name: 'المصحف الليلي الفاخر',
    sub: 'مريح للعين ومناسب للظلام',
    previewBg: 'bg-[#121824]',
    previewBorder: 'border-emerald-800',
    previewHeader: 'bg-[#0a0f18] text-emerald-400 border-b border-emerald-900',
    accent: '#34d399',
    textColor: 'text-emerald-300',
  }
];

export const RECITERS = [
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي (مرتل)', desc: 'تلاوة خاشعة ومؤثرة جداً' },
  { id: 'ar.minshawimujawwad', name: 'محمد صديق المنشاوي (مجود)', desc: 'المصحف المجود الخالد' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد (مرتل)', desc: 'المصحف المرتل الخاشع' },
  { id: 'ar.abdulbasitmujawwad', name: 'عبد الباسط عبد الصمد (مجود)', desc: 'صوت مكة الخالد والأداء الفريد' },
  { id: 'ar.husary', name: 'محمود خليل الحصري (مرتل)', desc: 'المصحف المعلم المتقن بدقة التجويد' },
  { id: 'ar.husarymujawwad', name: 'محمود خليل الحصري (مجود)', desc: 'التلاوة المجودة الرائعة' },
  { id: 'ar.faresabbad', name: 'فارس عباد', desc: 'تلاوة عذبة وشجية مرتلة' },
  { id: 'ar.alafasy', name: 'مشاري راشد العفاسي', desc: 'تلاوة خاشعة ومحبوبة' },
  { id: 'ar.yasseraldosari', name: 'ياسر الدوسري', desc: 'تلاوة مهيبة من الحرم المكي' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', desc: 'إمام المسجد الحرام' },
  { id: 'ar.as-sudais', name: 'عبد الرحمن السديس', desc: 'إمام وخطيب المسجد الحرام' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم', desc: 'تلاوة الحرم المكي' },
  { id: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي', desc: 'تلاوة عذبة ومؤثرة' },
  { id: 'ar.shaatree', name: 'أبو بكر الشاطري', desc: 'تلاوة هادئة ووقورة' },
  { id: 'ar.hudhaify', name: 'علي عبد الرحمن الحذيفي', desc: 'إمام المسجد النبوي الشريف' },
  { id: 'ar.hanirifai', name: 'هاني الرفاعي', desc: 'تلاوة باكية خاشعة' },
];

export type SettingsTab = 'display' | 'khatmah_stats' | 'sync' | 'quick_access';

export const QuranSettingsModal: React.FC = () => {
  const { 
    showSettingsModal, 
    setShowSettingsModal, 
    readingMode, 
    setReadingMode, 
    mushafTheme, 
    setMushafTheme,
    fontSize,
    setFontSize,
    currentPage,
    setCurrentPage,
    reciter,
    setReciter,
    setCurrentView
  } = useQuranContext();

  const [activeTab, setActiveTab] = useState<SettingsTab>('display');
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    return localStorage.getItem('quran_show_translation') === 'true';
  });

  const [memorizationStats, setMemorizationStats] = useState<{ memorizedAyahs: number; stars: number; streak: number }>({ memorizedAyahs: 0, stars: 0, streak: 1 });
  const [khatmasList, setKhatmasList] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState<{ readAyahs: number; readMinutes: number; streakDays: number; khatmas: number }>({
    readAyahs: 0,
    readMinutes: 0,
    streakDays: 1,
    khatmas: 0
  });
  const [showAddKhatmaInput, setShowAddKhatmaInput] = useState<boolean>(false);
  const [newKhatmaTitle, setNewKhatmaTitle] = useState<string>('ختمة تلاوة جديدة');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<{ email: string; name: string } | null>(null);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [textCacheStatus, setTextCacheStatus] = useState<{ isCached: boolean; count: number; total: number }>({ isCached: false, count: 0, total: 1176 });
  const [textDownloadProgress, setTextDownloadProgress] = useState<TextCacheProgress | null>(null);
  const [cacheMessage, setCacheMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const checkTextCacheStatus = async () => {
    const status = await QuranDataService.checkFullCacheStatus();
    setTextCacheStatus(status);
  };

  useEffect(() => {
    if (showSettingsModal) {
      const preferredTab = localStorage.getItem('quran_settings_preferred_tab') as SettingsTab | null;
      if (preferredTab) {
        if ((preferredTab as string) === 'stats' || (preferredTab as string) === 'memorize') {
          setActiveTab('khatmah_stats');
        } else {
          setActiveTab(preferredTab);
        }
        localStorage.removeItem('quran_settings_preferred_tab');
      }

      const qStats = JSON.parse(localStorage.getItem('quran_stats') || '{"memorizedAyahs": 0, "readAyahs": 0, "readMinutes": 0, "streakDays": 1, "khatmas": 0}');
      const quizStats = JSON.parse(localStorage.getItem('quran_quiz_stats') || '{"score": 0}');
      const streakStats = JSON.parse(localStorage.getItem('quran_user_streak') || '{"currentStreak": 1}');
      setMemorizationStats({
        memorizedAyahs: qStats.memorizedAyahs || 0,
        stars: quizStats.score || 0,
        streak: streakStats.currentStreak || 1
      });

      setOverallStats({
        readAyahs: qStats.readAyahs || 142,
        readMinutes: qStats.readMinutes || 35,
        streakDays: streakStats.currentStreak || qStats.streakDays || 1,
        khatmas: qStats.khatmas || 0
      });

      const savedKhatmas = JSON.parse(localStorage.getItem('quran_khatmas_list') || '[]');
      if (savedKhatmas.length === 0) {
        const initialKhatma = [{
          id: 'khatma_' + Date.now(),
          title: 'ختمة التلاوة الأولى للمصحف الشريف',
          type: 'tilawah',
          currentPage: currentPage || 1,
          totalPages: 604,
          startDate: new Date().toLocaleDateString('ar-EG'),
          isCompleted: false
        }];
        setKhatmasList(initialKhatma);
        localStorage.setItem('quran_khatmas_list', JSON.stringify(initialKhatma));
      } else {
        setKhatmasList(savedKhatmas);
      }

      const checkUser = async () => {
        const logged = await QuranSyncService.isUserLoggedIn();
        setIsLoggedIn(logged);
        if (logged) {
          const profile = await QuranSyncService.getUserProfile();
          setUserProfile(profile);
        }
      };
      checkUser();
      checkTextCacheStatus();
    }
  }, [showSettingsModal]);

  const handleAddNewKhatma = () => {
    if (!newKhatmaTitle.trim()) return;
    const newK = {
      id: 'khatma_' + Date.now(),
      title: newKhatmaTitle.trim(),
      type: 'tilawah',
      currentPage: currentPage || 1,
      totalPages: 604,
      startDate: new Date().toLocaleDateString('ar-EG'),
      isCompleted: false
    };
    const updated = [newK, ...khatmasList];
    setKhatmasList(updated);
    localStorage.setItem('quran_khatmas_list', JSON.stringify(updated));
    setNewKhatmaTitle('ختمة جديدة');
    setShowAddKhatmaInput(false);
  };

  const handleToggleKhatmaComplete = (id: string) => {
    const updated = khatmasList.map((item) => {
      if (item.id === id) {
        const isComp = !item.isCompleted;
        return {
          ...item,
          isCompleted: isComp,
          completedDate: isComp ? new Date().toLocaleDateString('ar-EG') : undefined
        };
      }
      return item;
    });
    setKhatmasList(updated);
    localStorage.setItem('quran_khatmas_list', JSON.stringify(updated));
    const completedCount = updated.filter(k => k.isCompleted).length;
    setOverallStats(prev => ({ ...prev, khatmas: completedCount }));
    const existingStats = JSON.parse(localStorage.getItem('quran_stats') || '{}');
    localStorage.setItem('quran_stats', JSON.stringify({ ...existingStats, khatmas: completedCount }));
  };

  const handleDeleteKhatma = (id: string) => {
    const updated = khatmasList.filter(k => k.id !== id);
    setKhatmasList(updated);
    localStorage.setItem('quran_khatmas_list', JSON.stringify(updated));
  };

  const handlePushSync = async () => {
    setSyncLoading(true);
    setSyncMessage({ text: 'جاري رفع البيانات إلى السحابة...', type: 'info' });
    const success = await QuranSyncService.pushToCloud();
    setSyncLoading(false);
    if (success) {
      setSyncMessage({ text: 'تمت المزامنة وحفظ بياناتك بنجاح!', type: 'success' });
    } else {
      setSyncMessage({ text: 'فشلت المزامنة. تحقق من الاتصال بالإنترنت.', type: 'error' });
    }
  };

  const handlePullSync = async () => {
    setSyncLoading(true);
    setSyncMessage({ text: 'جاري جلب البيانات من السحابة...', type: 'info' });
    const res = await QuranSyncService.pullFromCloud();
    setSyncLoading(false);
    if (res.success) {
      setSyncMessage({ text: 'تمت المزامنة ودمج بياناتك بنجاح!', type: 'success' });
    } else {
      setSyncMessage({ text: 'فشلت المزامنة. تحقق من الاتصال بالإنترنت.', type: 'error' });
    }
  };

  const handleDownloadAllText = async () => {
    if (textCacheStatus.isCached) {
      setCacheMessage({
        text: 'المصحف الشريف والتفاسير محملة بالفعل بالكامل لديك للعمل أوفلاين. إذا كنت ترغب في إعادة التحميل، يرجى القيام بحذف النسخة الحالية أولاً عن طريق الضغط على زر "مسح".',
        type: 'info'
      });
      // Clear message after 8 seconds
      setTimeout(() => setCacheMessage(null), 8000);
      return;
    }

    setCacheMessage(null);
    await QuranDataService.downloadAllQuranText((prog) => {
      setTextDownloadProgress(prog);
      if (prog.status === 'completed') {
        setCacheMessage({ text: 'تم تحميل المصحف والتفاسير بنجاح للعمل أوفلاين!', type: 'success' });
        checkTextCacheStatus();
        setTimeout(() => {
          setTextDownloadProgress(null);
          setCacheMessage(null);
        }, 5000);
      } else if (prog.status === 'error') {
        setCacheMessage({ text: prog.error || 'حدث خطأ أثناء تحميل المصحف الشريف.', type: 'error' });
        checkTextCacheStatus();
        setTimeout(() => {
          setTextDownloadProgress(null);
          setCacheMessage(null);
        }, 5000);
      }
    });
  };

  const handleDeleteAllTextCache = async () => {
    if (window.confirm('هل أنت متأكد من حذف النص والتفاسير المحفوظة أوفلاين لتوفير المساحة؟')) {
      await QuranDataService.deleteTextCache();
      await checkTextCacheStatus();
      setCacheMessage({ text: 'تم مسح الملفات المحفوظة أوفلاين بنجاح. يمكنك الآن إعادة التحميل مجدداً.', type: 'info' });
      setTimeout(() => setCacheMessage(null), 5000);
    }
  };

  const jumpToView = (view: 'index' | 'reader' | 'tafsir' | 'info' | 'memorize' | 'stats') => {
    setCurrentView(view);
    setShowSettingsModal(false);
  };

  const toggleTranslation = () => {
    const nextVal = !showTranslation;
    setShowTranslation(nextVal);
    localStorage.setItem('quran_show_translation', nextVal.toString());
  };

  if (!showSettingsModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl overflow-hidden text-right flex flex-col max-h-[88vh]"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shadow-xs">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">إعدادات المصحف الشريف والتخصيص</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">تخصيص خطوط وثيمات العرض، وسجل الختمات ومزامنة البيانات أوفلاين</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Settings Tabs Bar */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/40 p-1.5 gap-1 overflow-x-auto shrink-0 no-scrollbar">
            <button
              onClick={() => setActiveTab('display')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'display' ? 'bg-white dark:bg-gray-800 text-[var(--color-primary-dark)] dark:text-emerald-300 shadow-xs border border-gray-200/70 dark:border-gray-700' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/40'}`}
            >
              <BookOpen size={15} />
              <span>تخصيص المصحف والعرض</span>
            </button>
            <button
              onClick={() => setActiveTab('khatmah_stats')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'khatmah_stats' ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-200/70 dark:border-gray-700' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/40'}`}
            >
              <BarChart2 size={15} className="text-amber-500" />
              <span>سجل الختمات والإحصائيات</span>
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`py-2 px-3.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === 'sync' ? 'bg-white dark:bg-gray-800 text-[var(--color-primary-dark)] dark:text-emerald-300 shadow-xs border border-gray-200/70 dark:border-gray-700' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/40'}`}
            >
              <RefreshCw size={15} />
              <span>المزامنة والتحميل أوفلاين</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">

            {/* TAB 1: QUICK ACCESS HUB */}
            {activeTab === 'quick_access' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Compass size={16} className="text-[var(--color-primary)] animate-pulse" />
                    انتقال سريع ومباشر لأقسام المصحف:
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium">نقرة واحدة للانتقال</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Card 1: Reader */}
                  <button
                    onClick={() => jumpToView('reader')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/30 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/90 dark:border-emerald-800/60 hover:border-emerald-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">قراءة المصحف</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">صفحات وآيات</p>
                    </div>
                  </button>

                  {/* Card 2: Index */}
                  <button
                    onClick={() => jumpToView('index')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/30 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200/90 dark:border-blue-800/60 hover:border-blue-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Layers size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">فهرس السور</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">سور وأجزاء</p>
                    </div>
                  </button>

                  {/* Card 3: Tafsir */}
                  <button
                    onClick={() => jumpToView('tafsir')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-rose-50/80 to-pink-50/30 dark:from-rose-950/40 dark:to-pink-950/20 border border-rose-200/90 dark:border-rose-800/60 hover:border-rose-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Heart size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">التفسير والتدبر</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">معاني الآيات</p>
                    </div>
                  </button>

                  {/* Card 4: Audio Recitation */}
                  <button
                    onClick={() => jumpToView('tafsir')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-cyan-50/80 to-sky-50/30 dark:from-cyan-950/40 dark:to-sky-950/20 border border-cyan-200/90 dark:border-cyan-800/60 hover:border-cyan-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Volume2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">التلاوة والقراء</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">أصوات وإعدادات</p>
                    </div>
                  </button>

                  {/* Card 5: Customization */}
                  <button
                    onClick={() => setActiveTab('display')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-violet-50/80 to-purple-50/30 dark:from-violet-950/40 dark:to-purple-950/20 border border-violet-200/90 dark:border-violet-800/60 hover:border-violet-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Palette size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">تخصيص العرض</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">الخطوط والطبعة</p>
                    </div>
                  </button>

                  {/* Card 6: Memorization */}
                  <button
                    onClick={() => jumpToView('memorize')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/30 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/90 dark:border-amber-800/60 hover:border-amber-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Target size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">تسميع وحفظ</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">اختبار وتكرار</p>
                    </div>
                  </button>

                  {/* Card 7: Statistics */}
                  <button
                    onClick={() => jumpToView('stats')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-fuchsia-50/80 to-pink-50/30 dark:from-fuchsia-950/40 dark:to-pink-950/20 border border-fuchsia-200/90 dark:border-fuchsia-800/60 hover:border-fuchsia-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <BarChart2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">متابعة الختمة</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">سجل الورد</p>
                    </div>
                  </button>

                  {/* Card 8: Surah Info */}
                  <button
                    onClick={() => jumpToView('info')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-teal-50/80 to-emerald-50/30 dark:from-teal-950/40 dark:to-emerald-950/20 border border-teal-200/90 dark:border-teal-800/60 hover:border-teal-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Info size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">معلومات السورة</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">فضائل وأسباب</p>
                    </div>
                  </button>

                  {/* Card 9: Sync & Offline */}
                  <button
                    onClick={() => setActiveTab('sync')}
                    className="p-3 rounded-2xl bg-gradient-to-br from-sky-50/80 to-blue-50/30 dark:from-sky-950/40 dark:to-blue-950/20 border border-sky-200/90 dark:border-sky-800/60 hover:border-sky-500 hover:shadow-md transition-all text-right group flex items-center gap-2.5 relative overflow-hidden"
                  >
                    <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <RefreshCw size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white leading-tight">المزامنة أوفلاين</h5>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">حفظ وتحميل</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* TAB 2: DISPLAY & MUSHAF */}
            {activeTab === 'display' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3.5">
                {/* Jump to Page & Reading Mode Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Jump to Page */}
                  <div className="bg-gray-50/80 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Hash size={15} className="text-[var(--color-primary)]" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">الانتقال لصفحة:</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 text-xs"
                      >
                        <ChevronRight size={14} />
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={604}
                        value={currentPage}
                        onChange={(e) => {
                          const page = Math.max(1, Math.min(604, Number(e.target.value)));
                          setCurrentPage(page);
                        }}
                        className="w-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-0.5 px-1 text-center text-xs font-bold text-[var(--color-primary-dark)] dark:text-emerald-300 outline-none"
                      />

                      <button
                        onClick={() => setCurrentPage(Math.min(604, currentPage + 1))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 text-xs"
                      >
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Reading Mode Toggle */}
                  <div className="bg-gray-50/80 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">نمط العرض:</span>

                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-0.5 rounded-lg">
                      <button
                        onClick={() => setReadingMode('page')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${readingMode === 'page' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500'}`}
                      >
                        صفحة كاملة
                      </button>
                      <button
                        onClick={() => setReadingMode('scroll')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${readingMode === 'scroll' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-500'}`}
                      >
                        تمرير مستمر
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mushaf Themes */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                    <Palette size={15} className="text-[var(--color-primary)]" />
                    طبعة وثيم المصحف الشريف:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MUSHAF_THEMES.map((theme) => {
                      const isSelected = mushafTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setMushafTheme(theme.id);
                            localStorage.setItem('quran_mushaf_theme', theme.id);
                          }}
                          className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2.5 relative ${isSelected ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/40 bg-[var(--color-primary)]/5' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'}`}
                        >
                          <div className={`w-10 h-11 rounded ${theme.previewBg} border ${theme.previewBorder} flex flex-col justify-between p-0.5 shrink-0 overflow-hidden`}>
                            <div className={`text-[6px] font-bold ${theme.previewHeader} rounded text-center truncate`}>
                              الفاتحة
                            </div>
                            <div className="text-[8px] text-center font-serif leading-tight opacity-90" style={{ color: theme.accent }}>
                              بِسْمِ ٱللَّهِ
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${isSelected ? 'text-[var(--color-primary-dark)] dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                {theme.name}
                              </span>
                              {isSelected && <Check size={14} className="text-[var(--color-primary)]" />}
                            </div>
                            <p className="text-[10px] text-gray-400 line-clamp-1">{theme.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div className="bg-gray-50/80 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Type size={15} className="text-[var(--color-primary)]" />
                      حجم خط الآيات:
                    </span>
                    
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        A-
                      </button>
                      <span className="text-xs font-bold w-5 text-center text-[var(--color-primary-dark)] dark:text-emerald-400">
                        {fontSize}
                      </span>
                      <button
                        onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 text-center overflow-hidden">
                    <span className="font-serif leading-relaxed" style={{ fontSize: `${Math.min(32, fontSize)}px`, fontFamily: "'Amiri', 'Uthmani', serif" }}>
                      ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ﴿٢﴾
                    </span>
                  </div>
                </div>

                {/* Translation Toggle */}
                <div className="bg-gray-50/80 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">إظهار الترجمة الإنجليزية</span>
                    <span className="text-[10px] text-gray-400">عرض الترجمة تحت كل آية</span>
                  </div>
                  <button
                    onClick={toggleTranslation}
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${showTranslation ? 'bg-[var(--color-primary)]' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showTranslation ? 'translate-x-0' : '-translate-x-5'}`} />
                  </button>
                </div>

                {/* Reciter Picker in Quran Settings */}
                <div className="bg-gray-50/80 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Volume2 size={15} className="text-[var(--color-primary)]" />
                      القارئ المفضل لتلاوة المصحف:
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold">
                      {RECITERS.find(r => r.id === reciter)?.name || 'محمد صديق المنشاوي'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {RECITERS.map((r) => {
                      const isSelected = reciter === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setReciter(r.id);
                            localStorage.setItem('quran_reciter', r.id);
                          }}
                          className={`p-2 rounded-xl border text-right transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold'
                              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-xs truncate">{r.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal truncate block">{r.desc}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-[var(--color-primary)] shrink-0 mr-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: KHATMAH & OVERALL STATS */}
            {activeTab === 'khatmah_stats' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* 4 Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold">التتابع اليومي</span>
                    <span className="text-base sm:text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">
                      🔥 {overallStats.streakDays} أيام
                    </span>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold">الآيات المقروءة</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
                      📖 {overallStats.readAyahs} آية
                    </span>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold">وقت التلاوة</span>
                    <span className="text-base sm:text-lg font-bold text-blue-700 dark:text-blue-300 mt-0.5 block">
                      ⏱️ {overallStats.readMinutes} دقيقة
                    </span>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 p-2.5 rounded-2xl text-center">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-bold">الختمات المكتملة</span>
                    <span className="text-base sm:text-lg font-bold text-purple-700 dark:text-purple-300 mt-0.5 block">
                      🏆 {overallStats.khatmas} ختمة
                    </span>
                  </div>
                </div>

                {/* Khatmas List Section */}
                <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 p-3.5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target size={18} className="text-amber-600 dark:text-amber-400" />
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white">سجل الختمات الشاملة للمصحف</h4>
                        <p className="text-[10px] text-gray-400">تتبع تقدمك في قراءة وختم القرآن الكريم كاملاً</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAddKhatmaInput(!showAddKhatmaInput)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Sparkles size={13} />
                      <span>+ ختمة جديدة</span>
                    </button>
                  </div>

                  {showAddKhatmaInput && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newKhatmaTitle}
                        onChange={(e) => setNewKhatmaTitle(e.target.value)}
                        placeholder="اسم الختمة (مثلاً: ختمة رمضان)"
                        className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleAddNewKhatma}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
                      >
                        إضافة
                      </button>
                    </motion.div>
                  )}

                  <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                    {khatmasList.map((item) => {
                      const curPg = item.currentPage || 1;
                      const pct = Math.round((curPg / 604) * 100);

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-all text-right ${
                            item.isCompleted 
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${item.isCompleted ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                              <span className="font-bold text-xs text-gray-900 dark:text-white">{item.title}</span>
                            </div>

                            <span className="text-[10px] text-gray-400 font-medium">
                              بدأت {item.startDate}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-gray-600 dark:text-gray-300">
                                الصفحة {curPg} من 604
                              </span>
                              <span className={item.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                {item.isCompleted ? 'مكتملة 100% 🏆' : `${pct}%`}
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${item.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${item.isCompleted ? 100 : pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                            <button
                              onClick={() => {
                                setCurrentPage(curPg);
                                jumpToView('reader');
                                setShowSettingsModal(false);
                              }}
                              className="text-[11px] font-bold text-[var(--color-primary-dark)] dark:text-emerald-300 hover:underline flex items-center gap-1"
                            >
                              <BookOpen size={13} />
                              <span>الانتقال لصفحة الختمة ({curPg})</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleKhatmaComplete(item.id)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border ${
                                  item.isCompleted
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {item.isCompleted ? 'إعادة فتح الختمة' : 'تعليم كمكتملة 🏆'}
                              </button>

                              <button
                                onClick={() => handleDeleteKhatma(item.id)}
                                className="text-gray-400 hover:text-rose-500 p-1"
                                title="حذف الختمة"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Open Full Stats Button */}
                <button
                  onClick={() => {
                    jumpToView('stats');
                    setShowSettingsModal(false);
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <BarChart2 size={16} />
                  <span>فتح لوحة الإحصائيات الشاملة والرسوم البيانية</span>
                </button>
              </motion.div>
            )}

            {/* TAB 4: SYNC & OFFLINE */}
            {activeTab === 'sync' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3.5">
                {/* Cloud Sync */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-3 rounded-xl space-y-2.5 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white">المزامنة السحابية (Supabase)</h4>
                        <p className="text-[10px] text-gray-400">حفظ محفوظاتك وعلاماتك المرجعية عبر الأجهزة</p>
                      </div>
                    </div>
                    {isLoggedIn && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                        {userProfile?.email || 'متصل'}
                      </span>
                    )}
                  </div>

                  {isLoggedIn ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handlePushSync}
                        disabled={syncLoading}
                        className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        {syncLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        <span>رفع البيانات</span>
                      </button>
                      <button
                        onClick={handlePullSync}
                        disabled={syncLoading}
                        className="flex-1 py-1.5 px-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        {syncLoading ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                        <span>سحب البيانات</span>
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200/60">
                      تنبيه: أنت في وضع الزائر. سجل الدخول من القائمة الجانبية لتفعيل المزامنة بين أجهزتك.
                    </p>
                  )}

                  {syncMessage && (
                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      {syncMessage.text}
                    </div>
                  )}
                </div>

                {/* Offline Cache */}
                <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 p-3 rounded-xl space-y-2.5 text-right">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownToLine size={18} className="text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white">تحميل المصحف الشريف والتفاسير كاملة (أوفلاين)</h4>
                        <p className="text-[10px] text-gray-400">تحميل القرآن كاملاً (604 صفحة و114 سورة) مع أمهات التفاسير (الميسر، القرطبي، البغوي، الوسيط، الجلالين، ابن عباس، ابن كثير، السعدي) للعمل بدون إنترنت 100%</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${textCacheStatus.isCached ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {textCacheStatus.isCached ? 'محمل بالكامل' : `${textCacheStatus.count}/${textCacheStatus.total}`}
                    </span>
                  </div>

                  {textDownloadProgress ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>جاري التحميل...</span>
                        <span>{textDownloadProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${textDownloadProgress.percentage}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleDownloadAllText}
                        className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                      >
                        <ArrowDownToLine size={12} />
                        <span>تحميل المصحف أوفلاين</span>
                      </button>
                      {textCacheStatus.count > 0 && (
                        <button
                          onClick={handleDeleteAllTextCache}
                          className="py-1.5 px-2.5 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>مسح</span>
                        </button>
                      )}
                    </div>
                  )}

                  {cacheMessage && (
                    <div className={`text-[11px] font-bold p-2.5 rounded-lg border text-right leading-relaxed ${
                      cacheMessage.type === 'success' ? 'bg-green-50/70 border-green-100 text-green-800 dark:bg-green-950/20 dark:border-green-900/40 dark:text-green-300' :
                      cacheMessage.type === 'error' ? 'bg-red-50/70 border-red-100 text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300' :
                      'bg-blue-50/70 border-blue-100 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-300'
                    }`}>
                      {cacheMessage.text}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-gray-400">أنيس القلوب - المصحف الذكي</span>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="px-4 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-xs rounded-lg transition-all shadow-xs"
            >
              تم
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
