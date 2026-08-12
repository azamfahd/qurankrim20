import React, { useState, useEffect } from 'react';
import { 
  BarChart2, BookOpen, Clock, Award, Flame, Target, Star, Shield, Trophy, 
  Plus, Check, Trash2, Calendar, Sparkles, CheckCircle2, ChevronLeft, Layers, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface KhatmaItem {
  id: string;
  title: string;
  type: 'tilawah' | 'memorization' | 'tadabbur';
  currentPage: number;
  totalPages: number;
  startDate: string;
  completedDate?: string;
  isCompleted: boolean;
}

const QuranStats: React.FC = () => {
  const [stats, setStats] = useState({
    readAyahs: 0,
    readMinutes: 0,
    streakDays: 0,
    khatmas: 0,
    memorizedAyahs: 0,
  });

  const [khatmasList, setKhatmasList] = useState<KhatmaItem[]>([]);
  const [showAddKhatmaModal, setShowAddKhatmaModal] = useState<boolean>(false);
  const [newKhatmaTitle, setNewKhatmaTitle] = useState<string>('ختمة تلاوة جديدة');
  const [newKhatmaType, setNewKhatmaType] = useState<'tilawah' | 'memorization' | 'tadabbur'>('tilawah');
  
  // Daily Wird Tracking
  const [weeklyHabit, setWeeklyHabit] = useState<Record<string, boolean>>({});

  // Certified Memorized Surahs
  const [memorizedSurahsList, setMemorizedSurahsList] = useState<Array<{
    surahNumber: number;
    surahName: string;
    score: number;
    date: string;
    totalAyahs: number;
    accuracy: number;
    grade: string;
    hasDistinctionStar?: boolean;
    evalMode?: string;
    evalModeLabel?: string;
  }>>([]);

  // Memorization History Data (mocked based on current stats for demo purposes)
  const [historyData, setHistoryData] = useState<any[]>([]);

  const generateHistoryData = (totalMemorized: number) => {
    // Generate some mock history data that leads up to the current total
    const data = [];
    const days = 7;
    let current = Math.max(0, totalMemorized - 30); // start from some baseline
    
    const dayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const today = new Date().getDay();
    
    for (let i = 6; i >= 0; i--) {
      const dayIdx = (today - i + 7) % 7;
      const increase = i === 0 ? (totalMemorized - current) : Math.floor(Math.random() * 8);
      current += increase;
      
      data.push({
        name: dayNames[dayIdx],
        ayahs: current,
        daily: increase
      });
    }
    return data;
  };

  const loadStatsAndKhatmas = () => {
    // Load Stats
    const savedStats = JSON.parse(
      localStorage.getItem('quran_stats') || 
      '{"readAyahs": 0, "readMinutes": 0, "streakDays": 0, "khatmas": 0, "memorizedAyahs": 0}'
    );
    setStats(savedStats);

    // Load Certified Memorized Surahs
    const savedMemorized: Array<any> = JSON.parse(localStorage.getItem('quran_memorized_surahs') || '[]');
    setMemorizedSurahsList(savedMemorized);

    // Load Khatmas
    const savedKhatmas: KhatmaItem[] = JSON.parse(localStorage.getItem('quran_khatmas_list') || '[]');
    if (savedKhatmas.length === 0) {
      // Default initial Khatmah if none exists
      const initialKhatma: KhatmaItem = {
        id: 'default_khatma_1',
        title: 'ختمة التلاوة الأولى',
        type: 'tilawah',
        currentPage: 1,
        totalPages: 604,
        startDate: new Date().toLocaleDateString('ar-EG'),
        isCompleted: false
      };
      setKhatmasList([initialKhatma]);
      localStorage.setItem('quran_khatmas_list', JSON.stringify([initialKhatma]));
    } else {
      setKhatmasList(savedKhatmas);
    }

    // Load Weekly Habit Tracker
    const savedHabit = JSON.parse(localStorage.getItem('quran_weekly_habit') || '{}');
    setWeeklyHabit(savedHabit);

    setHistoryData(generateHistoryData(savedStats.memorizedAyahs || 0));
  };

  useEffect(() => {
    loadStatsAndKhatmas();
  }, []);

  // Calculation for daily goal
  const dailyGoalAyahs = 50;
  const progressPercent = Math.min(100, Math.round(((stats.readAyahs || 0) / dailyGoalAyahs) * 100));

  // Khatma Handlers
  const handleAddKhatma = () => {
    if (!newKhatmaTitle.trim()) return;
    const newItem: KhatmaItem = {
      id: `khatma_${Date.now()}`,
      title: newKhatmaTitle.trim(),
      type: newKhatmaType,
      currentPage: 1,
      totalPages: 604,
      startDate: new Date().toLocaleDateString('ar-EG'),
      isCompleted: false
    };

    const updated = [newItem, ...khatmasList];
    setKhatmasList(updated);
    localStorage.setItem('quran_khatmas_list', JSON.stringify(updated));
    setShowAddKhatmaModal(false);
    setNewKhatmaTitle('ختمة تلاوة جديدة');
  };

  const updateKhatmaProgress = (id: string, pagesToAdd: number) => {
    const updated = khatmasList.map(k => {
      if (k.id === id) {
        const newPage = Math.min(k.totalPages, k.currentPage + pagesToAdd);
        const isDone = newPage >= k.totalPages;
        return {
          ...k,
          currentPage: newPage,
          isCompleted: isDone,
          completedDate: isDone ? new Date().toLocaleDateString('ar-EG') : k.completedDate
        };
      }
      return k;
    });

    setKhatmasList(updated);
    localStorage.setItem('quran_khatmas_list', JSON.stringify(updated));

    // Update global stats count if finished
    const completedCount = updated.filter(k => k.isCompleted).length;
    const newStats = { ...stats, khatmas: completedCount };
    setStats(newStats);
    localStorage.setItem('quran_stats', JSON.stringify(newStats));
  };

  const deleteKhatma = (id: string) => {
    const updated = khatmasList.filter(k => k.id !== id);
    setKhatmasList(updated);
    localStorage.setItem('quran_khatmas_list', JSON.stringify(updated));
  };

  const toggleWeeklyDay = (dayKey: string) => {
    const updated = { ...weeklyHabit, [dayKey]: !weeklyHabit[dayKey] };
    setWeeklyHabit(updated);
    localStorage.setItem('quran_weekly_habit', JSON.stringify(updated));

    // Recalculate streak
    const activeDaysCount = Object.values(updated).filter(Boolean).length;
    const newStats = { ...stats, streakDays: activeDaysCount };
    setStats(newStats);
    localStorage.setItem('quran_stats', JSON.stringify(newStats));
  };

  // Days of week in Arabic
  const daysOfWeek = [
    { key: 'sun', label: 'الأحد' },
    { key: 'mon', label: 'الإثنين' },
    { key: 'tue', label: 'الثلاثاء' },
    { key: 'wed', label: 'الأربعاء' },
    { key: 'thu', label: 'الخميس' },
    { key: 'fri', label: 'الجمعة' },
    { key: 'sat', label: 'السبت' },
  ];

  const achievements = [
    {
      id: 'streak_1',
      title: 'شعلة البداية',
      description: 'واظبت على ورد القراءة لهذا اليوم.',
      icon: <Flame size={22} />,
      isUnlocked: stats.streakDays >= 1,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      id: 'streak_7',
      title: 'قارئ مواظب (أسبوع كامل)',
      description: 'واظبت على القراءة لـ 7 أيام متتالية.',
      icon: <Star size={22} />,
      isUnlocked: stats.streakDays >= 7,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      id: 'read_100',
      title: 'محب التلاوة',
      description: 'قرأت أكثر من 100 آية مباركة.',
      icon: <BookOpen size={22} />,
      isUnlocked: stats.readAyahs >= 100,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'memorize_10',
      title: 'حافظ مبتدئ',
      description: 'أتممت حفظ أكثر من 10 آيات.',
      icon: <Shield size={22} />,
      isUnlocked: stats.memorizedAyahs >= 10,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
    {
      id: 'khatma_1',
      title: 'نور الختمة',
      description: 'أتممت ختمة كاملة للقرآن الكريم.',
      icon: <Trophy size={22} />,
      isUnlocked: stats.khatmas >= 1,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    }
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full h-full pb-32">
      {/* Title */}
      <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-primary-dark)] mb-1 flex items-center gap-2">
            <BarChart2 className="text-[var(--color-primary)]" />
            سجل الختمات والإحصائيات
          </h2>
          <p className="text-gray-500 text-sm">تابع ختماتك، وردك اليومي، وتقدمك في حفظ وتلاوة كتاب الله.</p>
        </div>

        <button
          onClick={() => setShowAddKhatmaModal(true)}
          className="bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus size={18} />
          <span>إنشاء ختمة جديدة</span>
        </button>
      </div>

      {/* Top 5 Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <BookOpen size={20} />
          </div>
          <h4 className="font-bold text-2xl text-gray-800">{stats.readAyahs || 0}</h4>
          <p className="text-xs text-gray-500 mt-1">الآيات المقروءة</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock size={20} />
          </div>
          <h4 className="font-bold text-2xl text-gray-800">{stats.readMinutes || 0}</h4>
          <p className="text-xs text-gray-500 mt-1">دقائق التلاوة</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Flame size={20} />
          </div>
          <h4 className="font-bold text-2xl text-gray-800">{stats.streakDays || 0}</h4>
          <p className="text-xs text-gray-500 mt-1">أيام المواظبة</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Award size={20} />
          </div>
          <h4 className="font-bold text-2xl text-gray-800">{stats.khatmas || 0}</h4>
          <p className="text-xs text-gray-500 mt-1">الختمات المنجزة</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center col-span-2 md:col-span-1">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Target size={20} />
          </div>
          <h4 className="font-bold text-2xl text-gray-800">{stats.memorizedAyahs || 0}</h4>
          <p className="text-xs text-gray-500 mt-1">آيات تم حفظها</p>
        </motion.div>
      </div>

      {/* CERTIFIED MEMORIZED SURAHS SECTION */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <Award className="text-amber-500" size={24} />
            <div>
              <h3 className="font-black text-lg text-gray-800">السور المحفوظة المعتمدة باختبار التسميع الصوتي</h3>
              <p className="text-xs text-gray-500">قائمة السور المستوفية لشروط الحفظ والتقييم المزدوج (شفوي وتحريري):</p>
            </div>
          </div>
          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
            إجمالي: {memorizedSurahsList.length} سورة معتمدة
          </span>
        </div>

        {memorizedSurahsList.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <CheckCircle2 className="text-gray-300 mx-auto mb-2" size={32} />
            <p className="text-xs font-bold text-gray-600">لا توجد سور معتمدة رسمياً حتى الآن.</p>
            <p className="text-[11px] text-gray-400 mt-1">قم باجتياز اختبار التسميع الصوتي المباشر والترتيب للسورة في قسم التسميع لاعتمادها هنا!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {memorizedSurahsList.map((item) => (
              <div key={item.surahNumber} className="p-3 rounded-xl bg-gradient-to-br from-emerald-50/70 to-amber-50/60 border border-emerald-200/90 shadow-2xs space-y-2 hover:shadow-xs transition-all">
                <div className="flex justify-between items-center gap-1">
                  <span className="font-black text-xs text-emerald-950 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                    {item.surahName}
                  </span>
                  <span className="text-[9px] text-gray-500 font-bold shrink-0">{item.date}</span>
                </div>

                {/* Distinction Star Badge vs Normal Certified Badge */}
                {item.hasDistinctionStar || item.evalMode === 'tajweed_strict' ? (
                  <div className="px-2 py-1 bg-amber-100/90 border border-amber-300/80 rounded-md text-amber-950 font-black text-[10px] flex items-center justify-between shadow-2xs">
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-amber-500 fill-amber-400 shrink-0" />
                      <span>ترتيل وتجويد</span>
                    </span>
                    <span>⭐</span>
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-emerald-100/80 border border-emerald-200 rounded-md text-emerald-950 font-bold text-[10px] flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span>قراءة عادية</span>
                    </span>
                    <span>✔️</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-0.5 text-[11px]">
                  <div className="font-extrabold text-gray-800">
                    {item.totalAyahs} آية <span className="text-gray-500 text-[9px] font-medium">({item.accuracy}%)</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    {item.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 1: MEMORIZATION CHARTS */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-emerald-600" size={24} />
          <h3 className="font-bold text-lg text-gray-800">مؤشر الإنجاز والحفظ</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-600 text-center">تراكم الآيات المحفوظة (أسبوعياً)</h4>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAyahs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="ayahs" name="إجمالي المحفوظ" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAyahs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-600 text-center">معدل الحفظ اليومي</h4>
            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="daily" name="آيات اليوم" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: KHATMAH MANAGER */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Trophy className="text-[var(--color-primary)]" size={22} />
            <h3 className="font-bold text-lg text-gray-800">سجل ومتابعة الختمات</h3>
          </div>
          <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {khatmasList.filter(k => !k.isCompleted).length} ختمات جارية
          </span>
        </div>

        <div className="space-y-4">
          {khatmasList.map((khatma) => {
            const percent = Math.min(100, Math.round((khatma.currentPage / khatma.totalPages) * 100));
            return (
              <div 
                key={khatma.id}
                className={`p-5 rounded-2xl border transition-all ${khatma.isCompleted ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50/60 border-gray-100'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800">{khatma.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        khatma.type === 'tilawah' ? 'bg-blue-100 text-blue-700' :
                        khatma.type === 'memorization' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {khatma.type === 'tilawah' ? 'تلاوة' : khatma.type === 'memorization' ? 'حفظ' : 'تدبر'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      تاريخ البدء: {khatma.startDate} {khatma.completedDate && `• اكتملت في: ${khatma.completedDate}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-[var(--color-primary-dark)]">
                      {khatma.currentPage} <span className="text-xs text-gray-400 font-normal">/ {khatma.totalPages} صفحة</span>
                    </span>
                    <button 
                      onClick={() => deleteKhatma(khatma.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="حذف الختمة"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mb-4">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-700 ${khatma.isCompleted ? 'bg-emerald-500' : 'bg-[var(--color-primary)]'}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                {/* Quick Add Pages Controls */}
                {!khatma.isCompleted ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
                    <span className="text-xs text-gray-500 font-medium">تحديث التقدم اليومي:</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateKhatmaProgress(khatma.id, 1)}
                        className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100"
                      >
                        +1 صفحة
                      </button>
                      <button 
                        onClick={() => updateKhatmaProgress(khatma.id, 5)}
                        className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100"
                      >
                        +5 صفحات
                      </button>
                      <button 
                        onClick={() => updateKhatmaProgress(khatma.id, 10)}
                        className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100"
                      >
                        +10 صفحات
                      </button>
                      <button 
                        onClick={() => updateKhatmaProgress(khatma.id, khatma.totalPages - khatma.currentPage)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                      >
                        إتمام الختمة 🎉
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                    <CheckCircle2 size={16} /> تهانينا! تمت هذه الختمة بنجاح نسأل الله أن يتقبل منك.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: DAILY WIRD & WEEKLY HABIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-[var(--color-primary)]" size={24} />
            <h3 className="font-bold text-lg text-gray-800">تتبع الورد اليومي (الأسبوعي)</h3>
          </div>
          <p className="text-xs text-gray-500 mb-6">حدد أيام القراءة هذا الأسبوع للمواظبة على وردك:</p>

          <div className="grid grid-cols-7 gap-2 mb-6">
            {daysOfWeek.map((day) => {
              const isDone = !!weeklyHabit[day.key];
              return (
                <button
                  key={day.key}
                  onClick={() => toggleWeeklyDay(day.key)}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    isDone 
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm' 
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-[11px] font-bold mb-1">{day.label}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDone ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {isDone ? <Check size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-400"></div>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-2">
            <div className="flex justify-between items-center">
              <span>الهدف اليومي الموصى به:</span>
              <span className="font-bold text-[var(--color-primary-dark)]">{dailyGoalAyahs} آية / يوم</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[var(--color-primary)] h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* SECTION 3: ACHIEVEMENTS & BADGES */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-[var(--color-primary)]" size={24} />
            <h3 className="font-bold text-lg text-gray-800">لوحة الإنجازات والأوسمة</h3>
          </div>
          
          <div className="space-y-3.5">
            {achievements.map((achievement, index) => (
              <motion.div 
                key={achievement.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * index }}
                className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${achievement.isUnlocked ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50/60 opacity-60 grayscale'}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${achievement.bgColor} ${achievement.color}`}>
                  {achievement.icon}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${achievement.isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>{achievement.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{achievement.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: ADD NEW KHATMAH */}
      <AnimatePresence>
        {showAddKhatmaModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="text-[var(--color-primary)]" />
                إنشاء ختمة قرآنية جديدة
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">اسم الختمة:</label>
                  <input 
                    type="text"
                    value={newKhatmaTitle}
                    onChange={(e) => setNewKhatmaTitle(e.target.value)}
                    placeholder="مثال: ختمة رمضان، ختمة حفظ..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">نوع الختمة:</label>
                  <select 
                    value={newKhatmaType}
                    onChange={(e) => setNewKhatmaType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="tilawah">ختمة تلاوة وقراءة</option>
                    <option value="memorization">ختمة حفظ وتثبيت</option>
                    <option value="tadabbur">ختمة تدبر وتفسير</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowAddKhatmaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleAddKhatma}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm"
                >
                  إنشاء الختمة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuranStats;

