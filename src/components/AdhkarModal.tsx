import React, { useState, useEffect } from 'react';
import { 
  X, Sun, Moon, Bed, CheckCircle2, RotateCcw, Sparkles, Calendar, 
  BookOpen, Copy, ChevronDown, ChevronUp, Search, 
  Check, Layers, Compass, Heart, Share2, Flame, Award
} from 'lucide-react';
import { 
  MORNING_ADHKAR, EVENING_ADHKAR, SLEEP_ADHKAR, POST_PRAYER_ADHKAR, 
  DEEP_ISTIGHFAR_ADHKAR, HIJRI_MONTHS_ADHKAR, DAILY_HIJRI_ADHKAR, 
  DAILY_LIFE_ADHKAR, Dhikr, HijriMonthAdhkarInfo, DailyHijriDhikrInfo 
} from '../data/adhkar';
import { getCurrentHijriDate, HIJRI_MONTHS_AR } from '../utils/hijri';
import { motion, AnimatePresence } from 'framer-motion';

interface AdhkarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabCategory = 'morning' | 'evening' | 'sleep' | 'post_prayer' | 'deep_istighfar' | 'daily_hijri' | 'hijri_month' | 'daily_life';

export const AdhkarModal: React.FC<AdhkarModalProps> = ({ isOpen, onClose }) => {
  const hijri = getCurrentHijriDate();
  
  const [activeTab, setActiveTab] = useState<TabCategory>(() => {
    try {
      const saved = localStorage.getItem('anis_adhkar_active_tab');
      return (saved as TabCategory) || 'morning';
    } catch {
      return 'morning';
    }
  });

  const [completed, setCompleted] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('anis_adhkar_completed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [expandedReflections, setExpandedReflections] = useState<Record<string, boolean>>({});
  const [selectedHijriMonth, setSelectedHijriMonth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anis_adhkar_hijri_month');
      return saved !== null ? parseInt(saved, 10) : hijri.month;
    } catch {
      return hijri.month;
    }
  });

  const [selectedHijriDay, setSelectedHijriDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anis_adhkar_hijri_day');
      return saved !== null ? parseInt(saved, 10) : hijri.day;
    } catch {
      return hijri.day;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('anis_adhkar_completed', JSON.stringify(completed));
    } catch (e) {
      console.error('Failed to save adhkar progress', e);
    }
  }, [completed]);

  useEffect(() => {
    try {
      localStorage.setItem('anis_adhkar_active_tab', activeTab);
      localStorage.setItem('anis_adhkar_hijri_month', selectedHijriMonth.toString());
      localStorage.setItem('anis_adhkar_hijri_day', selectedHijriDay.toString());
    } catch (e) {}
  }, [activeTab, selectedHijriMonth, selectedHijriDay]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReflection = (id: string) => {
    setExpandedReflections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleTap = (dhikrId: string, maxCount: number) => {
    setCompleted(prev => {
      const current = prev[dhikrId] || 0;
      if (current < maxCount) {
        return { ...prev, [dhikrId]: current + 1 };
      }
      return prev;
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    } catch (e) {
      // Ignore vibration errors inside iframe sandboxes
    }
  };

  const resetCurrentCategory = () => {
    const list = getActiveList();
    const idsToRemove = new Set(list.map(d => d.id));
    setCompleted(prev => {
      const next = { ...prev };
      idsToRemove.forEach(id => delete next[id]);
      return next;
    });
    setShowResetConfirm(false);
  };

  const resetAllCategories = () => {
    setCompleted({});
    setShowResetConfirm(false);
  };

  // Resolve current active list based on tab
  const getActiveList = (): Dhikr[] => {
    switch (activeTab) {
      case 'morning':
        return MORNING_ADHKAR;
      case 'evening':
        return EVENING_ADHKAR;
      case 'sleep':
        return SLEEP_ADHKAR;
      case 'post_prayer':
        return POST_PRAYER_ADHKAR;
      case 'deep_istighfar':
        return DEEP_ISTIGHFAR_ADHKAR;
      case 'daily_life':
        return DAILY_LIFE_ADHKAR;
      case 'hijri_month': {
        const monthInfo = HIJRI_MONTHS_ADHKAR[selectedHijriMonth] || HIJRI_MONTHS_ADHKAR[1];
        return [
          {
            id: `hm_main_${monthInfo.monthNumber}`,
            text: monthInfo.mainDhikr,
            count: monthInfo.recommendedCount,
            reference: `ورد شهر ${monthInfo.monthName}`,
            category: 'hijri_month',
            virtue: monthInfo.virtue,
            deepReflection: monthInfo.deepReflection
          },
          ...monthInfo.adhkars
        ];
      }
      case 'daily_hijri': {
        const dayInfo = DAILY_HIJRI_ADHKAR[selectedHijriDay] || DAILY_HIJRI_ADHKAR[1];
        return [
          {
            id: `dh_${dayInfo.dayNumber}`,
            text: dayInfo.text,
            count: dayInfo.count,
            reference: dayInfo.reference,
            category: 'daily_hijri',
            virtue: dayInfo.virtue,
            deepReflection: dayInfo.deepReflection
          }
        ];
      }
      default:
        return MORNING_ADHKAR;
    }
  };

  const currentList = getActiveList();
  
  // Search filter
  const filteredList = currentList.filter(d => 
    searchQuery.trim() === '' || 
    d.text.includes(searchQuery) || 
    d.reference.includes(searchQuery) || 
    (d.virtue && d.virtue.includes(searchQuery)) ||
    (d.deepReflection && d.deepReflection.includes(searchQuery))
  );

  // Overall completion calculation
  const totalCountInTab = currentList.reduce((acc, d) => acc + d.count, 0);
  const currentCompletedInTab = currentList.reduce((acc, d) => acc + Math.min(completed[d.id] || 0, d.count), 0);
  const completionPercentage = totalCountInTab > 0 ? Math.round((currentCompletedInTab / totalCountInTab) * 100) : 0;

  const currentMonthData = HIJRI_MONTHS_ADHKAR[selectedHijriMonth];
  const currentDayData = DAILY_HIJRI_ADHKAR[selectedHijriDay];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="adhkar-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-2 sm:p-4 z-50" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div 
            key="adhkar-modal-container"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="bg-[var(--color-background)] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh] border border-[var(--color-border)] rounded-3xl" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 shrink-0 overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/20 shadow-inner">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-wide">رياض الأذكار والأوراد</h2>
                      <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">تأمل وتدبر</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-emerald-100/80 text-xs">
                      <Calendar size={13} className="text-amber-300" />
                      <span className="font-medium">{hijri.formattedAr}</span>
                      <span className="opacity-40">•</span>
                      <span>ورد اليوم {hijri.day} من {hijri.monthNameAr}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setShowResetConfirm(true)} 
                    className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all border border-white/10"
                    title="إعادة تعيين التقدم"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={onClose} 
                    className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full transition-all border border-white/10"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Progress & Context Banner */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-100">
                <div className="flex items-center gap-2">
                  <Award size={14} className="text-amber-300" />
                  <span>إنجاز الذكر الحالي: <strong className="text-amber-300 font-bold">{completionPercentage}%</strong></span>
                </div>
                <div className="w-32 sm:w-48 bg-black/20 h-2 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    className="bg-gradient-to-r from-amber-300 to-emerald-400 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            </div>

            {/* Main Tabs Navigation */}
            <div className="bg-[var(--color-primary-light)]/20 border-b border-[var(--color-border)] p-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5 px-1">
                <button
                  onClick={() => setActiveTab('morning')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'morning' 
                      ? 'bg-emerald-700 text-white shadow-sm' 
                      : 'text-[var(--color-text)] hover:bg-white/60'
                  }`}
                >
                  <Sun size={15} />
                  أذكار الصباح
                </button>

                <button
                  onClick={() => setActiveTab('evening')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'evening' 
                      ? 'bg-emerald-700 text-white shadow-sm' 
                      : 'text-[var(--color-text)] hover:bg-white/60'
                  }`}
                >
                  <Moon size={15} />
                  أذكار المساء
                </button>

                <button
                  onClick={() => setActiveTab('daily_hijri')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'daily_hijri' 
                      ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/30' 
                      : 'text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20'
                  }`}
                >
                  <Flame size={15} className="text-amber-400" />
                  ذكر اليوم الهجري ({hijri.day})
                </button>

                <button
                  onClick={() => setActiveTab('hijri_month')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'hijri_month' 
                      ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-400/30' 
                      : 'text-emerald-900 dark:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20'
                  }`}
                >
                  <Calendar size={15} className="text-emerald-400" />
                  ورد الشهر ({hijri.monthNameAr})
                </button>

                <button
                  onClick={() => setActiveTab('sleep')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'sleep' 
                      ? 'bg-indigo-700 text-white shadow-sm' 
                      : 'text-[var(--color-text)] hover:bg-white/60'
                  }`}
                >
                  <Bed size={15} />
                  النوم والاستيقاظ
                </button>

                <button
                  onClick={() => setActiveTab('deep_istighfar')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'deep_istighfar' 
                      ? 'bg-purple-700 text-white shadow-sm' 
                      : 'text-[var(--color-text)] hover:bg-white/60'
                  }`}
                >
                  <Heart size={15} />
                  استغفار وتدبر
                </button>

                <button
                  onClick={() => setActiveTab('post_prayer')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'post_prayer' 
                      ? 'bg-teal-700 text-white shadow-sm' 
                      : 'text-[var(--color-text)] hover:bg-white/60'
                  }`}
                >
                  <Compass size={15} />
                  بعد الصلاة
                </button>

                <button
                  onClick={() => setActiveTab('daily_life')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'daily_life' 
                      ? 'bg-cyan-700 text-white shadow-sm' 
                      : 'text-[var(--color-text)] hover:bg-white/60'
                  }`}
                >
                  <Layers size={15} />
                  أذكار الحياة
                </button>
              </div>
            </div>

            {/* Sub-selectors for Hijri Month and Hijri Day tabs */}
            {activeTab === 'hijri_month' && (
              <div className="bg-emerald-900/5 p-3 border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                    <Calendar size={13} /> اختر الشهر الهجري للتصفح:
                  </span>
                  <button 
                    onClick={() => setSelectedHijriMonth(hijri.month)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    الشهر الحالي ({hijri.monthNameAr})
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {HIJRI_MONTHS_AR.map((monthName, idx) => {
                    const monthNum = idx + 1;
                    const isCurrent = monthNum === hijri.month;
                    const isSelected = monthNum === selectedHijriMonth;
                    return (
                      <button
                        key={monthNum}
                        onClick={() => setSelectedHijriMonth(monthNum)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-sm'
                            : isCurrent
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-white/80 text-gray-700 border border-gray-200 hover:bg-white'
                        }`}
                      >
                        <span>{monthNum}. {monthName}</span>
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'daily_hijri' && (
              <div className="bg-amber-900/5 p-3 border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                    <Flame size={13} /> اختر اليوم الهجري (من 1 إلى 30):
                  </span>
                  <button 
                    onClick={() => setSelectedHijriDay(hijri.day)}
                    className="text-[11px] font-bold text-amber-700 hover:underline"
                  >
                    اليوم الحالي ({hijri.day})
                  </button>
                </div>
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(dayNum => {
                    const isCurrent = dayNum === hijri.day;
                    const isSelected = dayNum === selectedHijriDay;
                    return (
                      <button
                        key={dayNum}
                        onClick={() => setSelectedHijriDay(dayNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-sm'
                            : isCurrent
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-1 ring-amber-400'
                            : 'bg-white/80 text-gray-700 border border-gray-200 hover:bg-white'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="p-3 border-b border-[var(--color-border)] bg-white/40 dark:bg-black/10 shrink-0 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث في الأذكار والأوراد والفضائل..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border border-[var(--color-border)] bg-white dark:bg-gray-800 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  إلغاء
                </button>
              )}
            </div>

            {/* Dhikr Cards List */}
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-[var(--color-primary-light)]/5">
              
              {/* Context Banner for Hijri Month */}
              {activeTab === 'hijri_month' && currentMonthData && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/10 via-emerald-800/10 to-teal-900/10 border border-emerald-500/20 text-[var(--color-text)]"
                >
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1">
                    <Calendar size={16} />
                    <span>{currentMonthData.title}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mb-2">
                    {currentMonthData.virtue}
                  </p>
                  <div className="p-2.5 bg-white/80 dark:bg-black/20 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 border border-emerald-500/10 font-serif leading-relaxed">
                    <strong>وقفة تدبرية: </strong> {currentMonthData.deepReflection}
                  </div>
                </motion.div>
              )}

              {/* Context Banner for Hijri Day */}
              {activeTab === 'daily_hijri' && currentDayData && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-orange-500/10 border border-amber-500/20 text-[var(--color-text)]"
                >
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm mb-1">
                    <Flame size={16} className="text-amber-500" />
                    <span>{currentDayData.title}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mb-2">
                    {currentDayData.virtue}
                  </p>
                  <div className="p-2.5 bg-white/80 dark:bg-black/20 rounded-xl text-xs text-amber-900 dark:text-amber-200 border border-amber-500/10 font-serif leading-relaxed">
                    <strong>تأمل اليوم {currentDayData.dayNumber}: </strong> {currentDayData.deepReflection}
                  </div>
                </motion.div>
              )}

              {filteredList.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">
                  لا توجد أذكار تطابق بحثك
                </div>
              ) : (
                <div className="flex flex-col gap-4 pb-6">
                  {filteredList.map((dhikr, index) => {
                    const currentCount = completed[dhikr.id] || 0;
                    const isDone = currentCount >= dhikr.count;
                    const isExpanded = !!expandedReflections[dhikr.id];
                    const isCopied = copiedId === dhikr.id;

                    return (
                      <motion.div
                        key={dhikr.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border transition-all relative overflow-hidden ${
                          isDone 
                            ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/20' 
                            : 'border-[var(--color-border)] hover:border-emerald-500/30 hover:shadow-md'
                        }`}
                      >
                        {isDone && (
                          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 opacity-10 rounded-bl-full pointer-events-none"></div>
                        )}

                        {/* Top controls & badge */}
                        <div className="flex justify-between items-center mb-3 text-xs">
                          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            {dhikr.reference}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(dhikr.text, dhikr.id)}
                              className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-600 transition-all flex items-center gap-1 text-xs"
                              title="نسخ النص"
                            >
                              {isCopied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                              <span className="text-[11px] hidden sm:inline">نسخ</span>
                            </button>
                          </div>
                        </div>

                        {/* Main Dhikr Text */}
                        <p 
                          onClick={() => handleTap(dhikr.id, dhikr.count)}
                          className={`font-serif text-lg sm:text-xl leading-[2.3] mb-4 text-center transition-colors duration-300 cursor-pointer select-none ${
                            isDone ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-[var(--color-primary-dark)] dark:text-emerald-100'
                          }`} 
                          dir="rtl"
                        >
                          {dhikr.text}
                        </p>

                        {/* Virtue info if available */}
                        {dhikr.virtue && (
                          <div className="mb-3 text-xs text-emerald-900/80 dark:text-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-900/20 p-2.5 rounded-xl border border-emerald-500/10 flex items-start gap-2">
                            <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-emerald-950 dark:text-emerald-100">فضله: </strong>
                              {dhikr.virtue}
                            </div>
                          </div>
                        )}

                        {/* Deep Reflection Accordion */}
                        {dhikr.deepReflection && (
                          <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                            <button
                              onClick={() => toggleReflection(dhikr.id)}
                              className="w-full flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 py-1"
                            >
                              <span className="flex items-center gap-1.5">
                                <BookOpen size={14} />
                                وقفة تأملية عميقة وفهم روحاني
                              </span>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  key={`dhikr-deep-reflection-${dhikr.id}`}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden mt-2"
                                >
                                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50 text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-serif">
                                    {dhikr.deepReflection}
                                    
                                    {dhikr.benefits && dhikr.benefits.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-amber-200/40">
                                        <strong className="block text-[11px] text-amber-800 dark:text-amber-300 mb-1">فوائد الذكر العميقة:</strong>
                                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                                          {dhikr.benefits.map((b, i) => (
                                            <li key={`dhikr-b-${dhikr.id || 'dhikr'}-${i}`}>{b}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Bottom action bar & Counter button */}
                        <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-3 mt-3">
                          <span className="text-[11px] text-text-muted font-medium">
                            التكرار المطلوب: <strong className="text-[var(--color-text)]">{dhikr.count}</strong>
                          </span>

                          <button
                            onClick={() => handleTap(dhikr.id, dhikr.count)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                              isDone
                                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                                : 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white hover:from-emerald-800 hover:to-teal-900 shadow-emerald-900/20'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <CheckCircle2 size={16} />
                                <span>تم الاكتفاء ({dhikr.count})</span>
                              </>
                            ) : (
                              <>
                                <span>اضغط للذكر</span>
                                <span className="bg-white/20 text-white px-2 py-0.5 rounded-md font-mono text-xs">
                                  {currentCount} / {dhikr.count}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reset Confirmation Dialog Overlay */}
            <AnimatePresence>
              {showResetConfirm && (
                <motion.div
                  key="adhkar-reset-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowResetConfirm(false)}
                >
                  <motion.div
                    key="adhkar-reset-card"
                    initial={{ scale: 0.9, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 10 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-center border border-gray-100 dark:border-gray-700"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <RotateCcw size={24} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">إعادة تعيين تقدم الأذكار</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                      اختر خيار إعادة التعيين المناسب لك:
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={resetCurrentCategory}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                      >
                        تصفير هذا القسم فقط
                      </button>
                      <button
                        onClick={resetAllCategories}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                      >
                        تصفير جميع الأذكار كلياً
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
