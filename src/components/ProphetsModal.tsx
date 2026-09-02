import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  BookOpen, 
  Sparkles, 
  Crown, 
  Bookmark, 
  BookmarkCheck, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Share2, 
  ArrowRight, 
  ArrowLeft, 
  Scroll, 
  ZoomIn, 
  ZoomOut, 
  Info, 
  Feather,
  ChevronRight,
  ChevronLeft,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';
import { PROPHETS_DATA, Prophet } from '../data/prophetsData';

interface ProphetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

type FilterCategory = 'all' | 'ulul_azm' | 'early' | 'israel' | 'arabia';

export const ProphetsModal: React.FC<ProphetsModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [selectedProphetId, setSelectedProphetId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('anis_prophet_selected_id') || null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState<'story' | 'miracles' | 'wisdoms' | 'quiz'>(() => {
    try {
      const saved = localStorage.getItem('anis_prophet_active_tab');
      return (saved as any) || 'story';
    } catch {
      return 'story';
    }
  });

  // Save state on change
  useEffect(() => {
    try {
      if (selectedProphetId) {
        localStorage.setItem('anis_prophet_selected_id', selectedProphetId);
      } else {
        localStorage.removeItem('anis_prophet_selected_id');
      }
      localStorage.setItem('anis_prophet_active_tab', activeTab);
    } catch (e) {}
  }, [selectedProphetId, activeTab]);

  // Listen for hardware back request inside Prophets modal
  useEffect(() => {
    const handleProphetsBack = (e: CustomEvent) => {
      if (selectedProphetId) {
        setSelectedProphetId(null);
        e.preventDefault();
        if (e.detail && typeof e.detail.stopProp === 'function') e.detail.stopProp();
      }
    };
    window.addEventListener('anis_back_prophet_detail', handleProphetsBack as EventListener);
    return () => window.removeEventListener('anis_back_prophet_detail', handleProphetsBack as EventListener);
  }, [selectedProphetId]);
  
  // Font Size scaling
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(1); // 0 = small, 1 = normal, 2 = large, 3 = xl

  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('anis_prophet_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Quiz State
  const [quizAnswerIndex, setQuizAnswerIndex] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  // Selected Prophet Object
  const currentProphet = selectedProphetId 
    ? PROPHETS_DATA.find(p => p.id === selectedProphetId) || null 
    : null;

  // Reset quiz when prophet or tab changes
  useEffect(() => {
    setQuizAnswerIndex(null);
    setIsQuizSubmitted(false);
  }, [selectedProphetId, activeTab]);

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isBookmarked = bookmarkedIds.includes(id);
    let updated: string[];
    if (isBookmarked) {
      updated = bookmarkedIds.filter(bId => bId !== id);
      if (onShowToast) onShowToast('تم إزالة القصة من المحفوظات', 'info');
    } else {
      updated = [...bookmarkedIds, id];
      if (onShowToast) onShowToast('تم حفظ القصة في المفضلة والمحفوظات بنجاح 🌟', 'success');
    }
    setBookmarkedIds(updated);
    localStorage.setItem('anis_prophet_bookmarks', JSON.stringify(updated));
  };

  // Filter logic
  const filteredProphets = PROPHETS_DATA.filter(p => {
    const matchesSearch = 
      p.name.includes(searchQuery) ||
      p.title.includes(searchQuery) ||
      p.summary.includes(searchQuery) ||
      p.people.includes(searchQuery) ||
      p.location.includes(searchQuery) ||
      p.miracles.some(m => m.title.includes(searchQuery) || m.description.includes(searchQuery));

    if (!matchesSearch) return false;

    if (selectedFilter === 'ulul_azm') return p.isUlulAzm;
    if (selectedFilter === 'early') return p.chronologicalOrder <= 5;
    if (selectedFilter === 'israel') return p.people.includes('إسرائيل') || p.location.includes('فلسطين') || p.location.includes('القدس');
    if (selectedFilter === 'arabia') return p.location.includes('مكة') || p.location.includes('الحجاز') || p.location.includes('مدين') || p.location.includes('الأحقاف');

    return true;
  });

  const getFontSizeClass = () => {
    switch (fontSizeLevel) {
      case 0: return 'text-xs sm:text-sm leading-relaxed';
      case 2: return 'text-base sm:text-lg leading-loose';
      case 3: return 'text-lg sm:text-xl leading-loose font-medium';
      default: return 'text-sm sm:text-base leading-relaxed';
    }
  };

  const handleShareProphet = (p: Prophet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = `قصة معبّرة من قصص الأنبياء: ${p.name} (${p.title})\n\n${p.summary}\n\nتمت القراءة عبر تطبيق أنيس القلوب 📖✨`;
    if (navigator.share) {
      navigator.share({
        title: p.name,
        text: text,
        url: window.location.origin
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      if (onShowToast) onShowToast('تم نسخ القصة والملخص إلى الحافظة بنجاح 📋', 'success');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="prophets-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden bg-slate-950/70 backdrop-blur-md"
        >
          {/* Modal Main Panel */}
          <motion.div
            key="prophets-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-[84vh] md:h-[80vh] max-h-[780px] bg-[#FAF8F5] dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-amber-200/60 dark:border-slate-800 flex flex-col overflow-hidden dir-rtl animate-in fade-in-50 duration-200"
            dir="rtl"
          >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-amber-900 text-white flex items-center justify-between border-b border-amber-500/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif bg-gradient-to-l from-amber-100 via-amber-200 to-amber-300 bg-clip-text text-transparent">
                  موسوعة قصص الأنبياء والمرسلين
                </h2>
                <p className="text-xs text-amber-100/80 font-medium">
                  بطاقات تعريفية وقصصية مبسطة وتفاعلية مدعومة بالشواهد القرآنية
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSizeLevel(prev => (prev < 3 ? prev + 1 : 0))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-200 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="تغيير حجم الخط"
              >
                {fontSizeLevel === 0 ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
                <span className="hidden sm:inline">حجم الخط</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            
            {/* 1. Encyclopedia Main Grid (Visible when no prophet is selected) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Search & Filters */}
              <div className="p-4 border-b border-amber-100 dark:border-slate-800 space-y-3 shrink-0 bg-amber-50/40 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-lg">
                    <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث باسم النبي، اللقب، أو المعجزة..."
                      className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-800 border border-amber-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>

                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    عدد الأنبياء المعروضين: <span className="font-bold text-amber-700 dark:text-amber-400">{filteredProphets.length}</span>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: 'all', label: 'الجميع (25)' },
                    { id: 'ulul_azm', label: 'أولو العزم (5)' },
                    { id: 'early', label: 'الأنبياء الأوائل' },
                    { id: 'israel', label: 'أنبياء بني إسرائيل' },
                    { id: 'arabia', label: 'أنبياء جزيرة العرب' },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id as FilterCategory)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedFilter === filter.id
                          ? 'bg-amber-600 text-white shadow-sm font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-amber-100 dark:border-slate-700/50 hover:bg-amber-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Prophets Grid */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
                {filteredProphets.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    لم نجد نتائج تطابق كلمة البحث "{searchQuery}"
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProphets.map(p => {
                      const isBookmarked = bookmarkedIds.includes(p.id);

                      return (
                        <motion.div
                          key={p.id}
                          layoutId={`card-${p.id}`}
                          onClick={() => {
                            setSelectedProphetId(p.id);
                            setActiveTab('story');
                          }}
                          className="group bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800/80 hover:border-amber-400/80 dark:hover:border-slate-700 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                          whileHover={{ y: -3 }}
                        >
                          <div>
                            {/* Card Header with badges */}
                            <div className="flex items-center justify-between">
                              <span className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
                                {p.chronologicalOrder}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {p.isUlulAzm && (
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                                    أولو العزم
                                  </span>
                                )}
                                <button
                                  onClick={(e) => toggleBookmark(p.id, e)}
                                  className={`p-1.5 rounded-lg transition-all ${
                                    isBookmarked
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-slate-300 dark:text-slate-600 hover:text-amber-500'
                                  }`}
                                >
                                  <Bookmark className="w-4 h-4 fill-current" />
                                </button>
                              </div>
                            </div>

                            {/* Prophet Name & Title */}
                            <div className="mt-3">
                              <h3 className="text-lg font-extrabold font-serif text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                {p.name}
                              </h3>
                              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                {p.title}
                              </p>
                            </div>

                            {/* Short Summary */}
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                              {p.summary}
                            </p>
                          </div>

                          {/* Footer details */}
                          <div className="pt-3 border-t border-amber-50/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            <span>ذكر: {p.quranMentionsCount} مرات</span>
                            <span className="text-amber-700 dark:text-amber-400 font-bold group-hover:translate-x-[-4px] transition-transform flex items-center gap-0.5">
                              عرض القصة والتفاصيل
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Prophet Details Popup Card Over Grid */}
            <AnimatePresence>
              {currentProphet && (
                <motion.div
                  key={`prophet-detail-${currentProphet.id}`}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ type: 'tween', duration: 0.25 }}
                  className="absolute inset-0 z-30 bg-[#FAF8F5] dark:bg-slate-900 flex flex-col h-full w-full"
                >
                  {/* Detailed Popup Header */}
                  <div className="px-3 sm:px-5 py-1.5 bg-white dark:bg-slate-950 border-b border-amber-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => setSelectedProphetId(null)}
                        className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-0.5 text-[11px] font-bold cursor-pointer shrink-0"
                        title="العودة للموسوعة"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">العودة</span>
                      </button>
                      <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0" />
                      <div className="min-w-0 flex items-center gap-1.5">
                        <h1 className="text-sm sm:text-base font-black font-serif text-slate-900 dark:text-white truncate">
                          {currentProphet.name}
                        </h1>
                        <span className="text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold truncate max-w-[120px] sm:max-w-none">
                          {currentProphet.title}
                        </span>
                        {currentProphet.isUlulAzm && (
                          <span className="text-[9px] bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-600/20 px-1 py-0.5 rounded-md font-bold flex items-center gap-0.5 shrink-0">
                            <Crown className="w-2.5 h-2.5" />
                            <span className="hidden sm:inline">أولو العزم</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => toggleBookmark(currentProphet.id, e)}
                        className={`w-7 h-7 rounded-lg border transition-all cursor-pointer flex items-center justify-center p-0 ${
                          bookmarkedIds.includes(currentProphet.id)
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600'
                        }`}
                        title="حفظ القصة"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        onClick={(e) => handleShareProphet(currentProphet, e)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-all cursor-pointer flex items-center justify-center p-0"
                        title="مشاركة القصة"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Split Layout: Main Content Area + Permanent Side Card Info */}
                  <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    
                    {/* Left: Interactive Content Tabs (Story, Miracles, Wisdom, Quiz) */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-l border-amber-100/60 dark:border-slate-800">
                      {/* Sub-Tabs Navigation Bar */}
                      <div className="px-4 sm:px-6 py-2 bg-white dark:bg-slate-950 border-b border-amber-200/50 dark:border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2">
                          {[
                            { id: 'story', label: 'أحداث القصة المفصلة', icon: <BookOpen className="w-4 h-4" /> },
                            { id: 'miracles', label: 'المعجزات الإلهية', icon: <Sparkles className="w-4 h-4" /> },
                            { id: 'wisdoms', label: 'الحِكم والدروس والعبر', icon: <Feather className="w-4 h-4" /> },
                            { id: 'quiz', label: 'اختبار القصة التثبيتي', icon: <HelpCircle className="w-4 h-4" /> },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === tab.id
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {tab.icon}
                              <span>{tab.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scrollable Details Content Pane */}
                      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
                        
                        {/* Mobile-Only Summary Block */}
                        <div className="md:hidden block bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl p-4.5 border border-amber-200/30 space-y-2.5">
                          <span className="text-xs font-serif font-black text-amber-800 dark:text-amber-300 block pb-1.5 border-b border-amber-200/20">
                            ملخص قصة النبي:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {currentProphet.summary}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold pt-1.5 border-t border-amber-200/20">
                            <span className="bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-amber-150">
                              الترتيب الزمني: {currentProphet.chronologicalOrder}
                            </span>
                            <span className="bg-amber-600 text-white px-2.5 py-1 rounded-lg">
                              ذكر بالقرآن: {currentProphet.quranMentionsCount} مرات
                            </span>
                          </div>
                        </div>

                        {/* Mobile-Only Info Accordion to save space and show info properly on phone screens */}
                        <div className="md:hidden block">
                          <details className="bg-amber-50/40 dark:bg-slate-850/60 border border-amber-200/60 dark:border-slate-800 rounded-2xl p-4.5 space-y-2">
                            <summary className="text-xs font-bold text-amber-900 dark:text-amber-300 cursor-pointer list-none flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-serif text-sm">
                                <Info className="w-4 h-4 text-amber-600" />
                                بطاقة التعريف والنسب والمواطن
                              </span>
                              <ChevronLeft className="w-4 h-4 text-amber-600 transform group-open:rotate-90 transition-transform" />
                            </summary>
                            
                            <div className="pt-3 border-t border-amber-200/30 dark:border-slate-800/60 space-y-3 text-xs">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                                <div>
                                  <span className="text-slate-400 block text-[10px]">الحقبة الزمنية</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentProphet.period}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-amber-600 shrink-0" />
                                <div>
                                  <span className="text-slate-400 block text-[10px]">القوم المبعوث إليهم</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentProphet.people}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                                <div>
                                  <span className="text-slate-400 block text-[10px]">الموطن والموقع</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentProphet.location}</span>
                                </div>
                              </div>

                              <div className="border-t border-amber-150/40 dark:border-slate-850 pt-2 space-y-1.5">
                                <span className="font-bold text-[10px] text-amber-700 dark:text-amber-400">حقائق وتفاصيل:</span>
                                {currentProphet.keyFacts.map((fact, idx) => (
                                  <div key={`fact-${currentProphet.id}-${idx}`} className="flex justify-between text-[11px] py-1 border-b border-dashed border-amber-100/40 dark:border-slate-800/40 last:border-0">
                                    <span className="text-slate-500 dark:text-slate-400">{fact.label}</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{fact.value}</span>
                                  </div>
                                ))}
                              </div>

                              {currentProphet.mainSurahs.length > 0 && (
                                <div className="border-t border-amber-150/40 dark:border-slate-850 pt-2.5">
                                  <span className="font-bold text-[10px] text-amber-700 dark:text-amber-400 block mb-1">أبرز السور المفصّلة:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {currentProphet.mainSurahs.map((surah, idx) => (
                                      <span key={`surah-${currentProphet.id}-${idx}-${surah}`} className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100 dark:border-slate-700/60 text-amber-800 dark:text-amber-300">
                                        سورة {surah}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </details>
                        </div>

                        {/* Tab Content 1: Full Story Chapters */}
                        {activeTab === 'story' && (
                          <div className="space-y-5">
                            {currentProphet.fullStory.map((chapter, idx) => (
                              <div 
                                key={`chap-${currentProphet.id}-${idx}-${chapter.title}`}
                                className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 shadow-2xs border border-amber-100/60 dark:border-slate-750/50 space-y-3"
                              >
                                <h3 className="text-base sm:text-lg font-bold font-serif text-amber-800 dark:text-amber-300 border-b border-amber-100 dark:border-slate-700 pb-2.5 flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shrink-0"></span>
                                  {chapter.title}
                                </h3>

                                <p className={`text-slate-800 dark:text-slate-200 whitespace-pre-wrap ${getFontSizeClass()}`}>
                                  {chapter.content}
                                </p>

                                {/* Quranic Verse Highlight */}
                                {chapter.quranVerse && (
                                  <div className="mt-4 p-4 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border-r-4 border-amber-600 dark:border-amber-400 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                                      <span className="flex items-center gap-1">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        الشاهد القرآني الكـريم
                                      </span>
                                      <span>{chapter.quranVerse.surahAndAyah}</span>
                                    </div>

                                    <p className="text-sm sm:text-base font-serif font-black text-slate-900 dark:text-amber-100 leading-loose text-center py-1">
                                      ﴿ {chapter.quranVerse.text} ﴾
                                    </p>

                                    <p className="text-xs text-slate-600 dark:text-slate-400 border-t border-amber-100/50 dark:border-slate-800 pt-2 font-medium">
                                      <span className="font-bold text-amber-700 dark:text-amber-400">التدبر والمعنى: </span>
                                      {chapter.quranVerse.explanation}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tab Content 2: Miracles */}
                        {activeTab === 'miracles' && (
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-slate-700 flex items-center gap-3">
                              <Sparkles className="w-6 h-6 text-amber-600 shrink-0" />
                              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                أيد الله سبحانه وتعالى أنبياءه بالمعجزات الخارقة للعادة ليكون ذلك برهاناً ساطعاً ودليلاً قاطعاً على صدق نبوتهم ورسالتهم.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currentProphet.miracles.map((m, idx) => (
                                <div 
                                  key={`mir-${currentProphet.id}-${idx}`}
                                  className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xs border border-amber-200/50 dark:border-slate-700 flex flex-col justify-between space-y-3"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {idx + 1}
                                      </span>
                                      <h4 className="text-sm sm:text-base font-bold font-serif text-amber-800 dark:text-amber-300">
                                        {m.title}
                                      </h4>
                                    </div>

                                    <p className={`text-slate-700 dark:text-slate-200 ${getFontSizeClass()}`}>
                                      {m.description}
                                    </p>
                                  </div>

                                  {m.quranEvidence && (
                                    <div className="mt-3 p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 text-xs font-serif border border-amber-200/50 dark:border-slate-800 text-amber-900 dark:text-amber-200">
                                      <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">الدليل القرآني:</span>
                                      ﴿ {m.quranEvidence} ﴾
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tab Content 3: Wisdoms and Lessons */}
                        {activeTab === 'wisdoms' && (
                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-amber-600/10 border border-amber-200 dark:border-slate-700">
                              <h3 className="text-base font-bold font-serif text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                                <Feather className="w-5 h-5 text-amber-600" />
                                دروس وحِكم تربوية مستفادة من قصة {currentProphet.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                                قصص القرآن لم تُقصّ للتسلية، بل لتكون نوراً يضيء دروبنا وحِكماً نهتدي بها في حياتنا اليومية والروحانية والعملية.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {currentProphet.wisdomsAndLessons.map((wisdom, idx) => (
                                <div 
                                  key={`wis-${currentProphet.id}-${idx}`}
                                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-100 dark:border-slate-700/70 shadow-2xs flex items-start gap-3"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <p className={`text-slate-800 dark:text-slate-200 font-medium ${getFontSizeClass()}`}>
                                    {wisdom}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tab Content 4: Interactive Quiz */}
                        {activeTab === 'quiz' && (
                          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-amber-200/80 dark:border-slate-700 space-y-5 shadow-sm max-w-2xl mx-auto">
                            <div className="flex items-center justify-between border-b border-amber-100 dark:border-slate-700 pb-3">
                              <div className="flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-amber-600" />
                                <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
                                  اختبار سريع حول قصة {currentProphet.name}
                                </h3>
                              </div>
                              <span className="text-xs bg-amber-100 dark:bg-slate-700 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg font-bold">
                                سؤال تثبيتي
                              </span>
                            </div>

                            <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                              {currentProphet.quickQuiz.question}
                            </p>

                            {/* Options */}
                            <div className="space-y-2.5">
                              {currentProphet.quickQuiz.options.map((option, idx) => {
                                let btnStyle = 'bg-amber-50/50 dark:bg-slate-900/60 border-amber-200/60 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-500';

                                if (isQuizSubmitted) {
                                  if (idx === currentProphet.quickQuiz.correctIndex) {
                                    btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                                  } else if (idx === quizAnswerIndex) {
                                    btnStyle = 'bg-red-600 text-white border-red-600';
                                  }
                                } else if (idx === quizAnswerIndex) {
                                  btnStyle = 'bg-amber-600 text-white border-amber-600 font-bold';
                                }

                                return (
                                  <button
                                    key={`qopt-${currentProphet.id}-${idx}-${option}`}
                                    disabled={isQuizSubmitted}
                                    onClick={() => setQuizAnswerIndex(idx)}
                                    className={`w-full p-3.5 rounded-xl border text-right text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                                  >
                                    <span>{option}</span>
                                    {isQuizSubmitted && idx === currentProphet.quickQuiz.correctIndex && (
                                      <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                                    )}
                                    {isQuizSubmitted && idx === quizAnswerIndex && idx !== currentProphet.quickQuiz.correctIndex && (
                                      <XCircle className="w-5 h-5 text-white shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Submit / Reset Button */}
                            {!isQuizSubmitted ? (
                              <button
                                disabled={quizAnswerIndex === null}
                                onClick={() => setIsQuizSubmitted(true)}
                                className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${
                                  quizAnswerIndex !== null
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                تأكيد الإجابة
                              </button>
                            ) : (
                              <div className="space-y-3 pt-2">
                                <div className={`p-4 rounded-xl text-xs sm:text-sm font-medium ${
                                  quizAnswerIndex === currentProphet.quickQuiz.correctIndex
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200'
                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-200'
                                }}`}>
                                  <span className="font-bold block mb-1">
                                    {quizAnswerIndex === currentProphet.quickQuiz.correctIndex ? 'أحسنت! إجابة صحيحة 🎉' : 'توضيح وشرح المعلومة:'}
                                  </span>
                                  {currentProphet.quickQuiz.explanation}
                                </div>

                                <button
                                  onClick={() => {
                                    setQuizAnswerIndex(null);
                                    setIsQuizSubmitted(false);
                                  }}
                                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  إعادة المحاولة
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Permanent High-Density Side Biographical Card (Desktop-Only) */}
                    <div className="hidden md:block w-64 lg:w-72 shrink-0 bg-amber-50/10 dark:bg-slate-900/30 p-4.5 overflow-y-auto space-y-4 border-r border-amber-100/40 dark:border-slate-800 custom-scrollbar">
                      
                      {/* Desktop Summary Block at the top of Sidebar */}
                      <div className="p-4 bg-amber-500/10 dark:bg-amber-500/15 rounded-2xl border border-amber-200/30 space-y-2.5">
                        <span className="text-xs font-serif font-black text-amber-800 dark:text-amber-300 block pb-1.5 border-b border-amber-200/20">
                          ملخص قصة النبي:
                        </span>
                        <p className="text-xs text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                          {currentProphet.summary}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold pt-1.5 border-t border-amber-200/20">
                          <span className="bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg border border-amber-150">
                            الترتيب الزمني: {currentProphet.chronologicalOrder}
                          </span>
                          <span className="bg-amber-600 text-white px-2 py-1 rounded-lg">
                            ذكر بالقرآن: {currentProphet.quranMentionsCount} مرات
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-serif text-amber-800 dark:text-amber-300 font-extrabold pb-3 border-b border-amber-200/30 dark:border-slate-800">
                        <Info className="w-5 h-5 text-amber-600" />
                        <span>بطاقة التعريف والنسب</span>
                      </div>

                      {/* Main Facts Grid */}
                      <div className="space-y-4 text-xs">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">الحقبة الزمنية</span>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                              {currentProphet.period}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">القوم المبعوث إليهم</span>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                              {currentProphet.people}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-bold">الموطن والموقع الرئيسي</span>
                            <p className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                              {currentProphet.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Key Facts List */}
                      <div className="pt-4 border-t border-amber-200/30 dark:border-slate-800 space-y-3">
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-serif block">
                          حقائق ومعطيات دقيقة:
                        </span>
                        
                        <div className="space-y-2">
                          {currentProphet.keyFacts.map((fact, idx) => (
                            <div 
                              key={`kfact-${currentProphet.id}-${idx}`} 
                              className="bg-white dark:bg-slate-850/80 p-2.5 rounded-xl border border-amber-100/40 dark:border-slate-800 text-xs flex justify-between gap-2"
                            >
                              <span className="text-slate-500 dark:text-slate-400 font-medium">{fact.label}</span>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-right">{fact.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quran Mentions & Surahs */}
                      {currentProphet.mainSurahs.length > 0 && (
                        <div className="pt-4 border-t border-amber-200/30 dark:border-slate-800 space-y-2.5">
                          <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-serif block">
                            ورد تفصيل القصة في سور:
                          </span>

                          <div className="flex flex-wrap gap-1.5">
                            {currentProphet.mainSurahs.map((surah, idx) => (
                              <span 
                                key={`msurah-${currentProphet.id}-${idx}-${surah}`}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[10px] font-bold shadow-2xs"
                              >
                                سورة {surah}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Quick Prophet Switcher Footer */}
                  <div className="p-3 bg-white dark:bg-slate-950 border-t border-amber-200/50 dark:border-slate-800 shrink-0 flex items-center justify-between text-xs shadow-inner">
                    <button
                      disabled={currentProphet.chronologicalOrder <= 1}
                      onClick={() => {
                        const prevProphet = PROPHETS_DATA.find(p => p.chronologicalOrder === currentProphet.chronologicalOrder - 1);
                        if (prevProphet) setSelectedProphetId(prevProphet.id);
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        currentProphet.chronologicalOrder <= 1
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
                          : 'bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-800 border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>النبي السابق</span>
                    </button>

                    <span className="font-bold text-slate-500 dark:text-slate-400 font-serif">
                      {currentProphet.name} ({currentProphet.chronologicalOrder} من 25)
                    </span>

                    <button
                      disabled={currentProphet.chronologicalOrder >= 25}
                      onClick={() => {
                        const nextProphet = PROPHETS_DATA.find(p => p.chronologicalOrder === currentProphet.chronologicalOrder + 1);
                        if (nextProphet) setSelectedProphetId(nextProphet.id);
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        currentProphet.chronologicalOrder >= 25
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
                          : 'bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-800 border-amber-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>النبي التالي</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProphetsModal;
