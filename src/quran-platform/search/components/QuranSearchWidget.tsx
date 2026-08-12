import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  Trash2,
  Book,
  FileText,
  Bookmark,
  Sparkles,
  Layers,
  ChevronLeft,
  Cpu,
  CheckCircle,
  Filter,
  Zap,
  Info
} from 'lucide-react';
import { QuranSearchService } from '../service/QuranSearchService';
import { ArabicNormalizer } from '../utils/ArabicNormalizer';
import {
  UnifiedSearchResult,
  SearchSuggestion,
  SearchHistoryItem,
  SearchResultType,
  MatchType
} from '../types';
import { useQuranContext } from '../../store/QuranContext';
import { getCleanSurahName } from '../../components/AyahMarker';

export const QuranSearchWidget: React.FC<{
  onSelectSurah?: (surahNum: number) => void;
  onSelectAyah?: (surahNum: number, ayahNum: number, pageNum: number) => void;
  onSelectPage?: (pageNum: number) => void;
}> = ({ onSelectSurah, onSelectAyah, onSelectPage }) => {
  const { setCurrentView, setCurrentSurah, setCurrentAyah, setCurrentPage, setPlayingAyahNumber } = useQuranContext();

  const [query, setQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'surah' | 'ayah' | 'page' | 'juz'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<UnifiedSearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchService = QuranSearchService.getInstance();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(searchService.getHistory());
  }, []);

  // Detect query intent dynamically
  const detectQueryIntent = (q: string): { label: string; icon: string } => {
    const trimmed = q.trim();
    if (!trimmed) return { label: 'بحث ذكي شامل', icon: '✨' };

    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return { label: 'مطابقة لفظية دقيقة تلقائياً', icon: '💬' };
    }

    const numeric = ArabicNormalizer.parseNumericIntent(trimmed);
    if (numeric.type === 'surah') {
      return { label: `تم اكتشاف استعلام سورة (رقم/اسم ${numeric.number || ''}) تلقائياً`, icon: '📖' };
    }
    if (numeric.type === 'page') {
      return { label: `تم اكتشاف استعلام صفحة (${numeric.number}) تلقائياً`, icon: '📄' };
    }
    if (numeric.type === 'juz') {
      return { label: `تم اكتشاف استعلام جزء (${numeric.number}) تلقائياً`, icon: '🔖' };
    }

    return { label: 'بحث ذكي شامل وتلقائي في كامل القرآن', icon: '⚡' };
  };

  // Handle Search Input Change with Smart Automatic Detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim()) {
      setResult(null);
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Get suggestions instantly
    searchService.getSuggestions(val).then((sug) => setSuggestions(sug));

    // Determine match mode automatically: exact if quoted, smart otherwise
    const isQuoted = val.trim().startsWith('"') && val.trim().endsWith('"');
    const autoMatchType: MatchType = isQuoted ? 'exact' : 'smart';

    // Debounce actual deep search execution (200ms)
    searchTimeoutRef.current = setTimeout(async () => {
      const res = await searchService.search(val, {
        scope: 'all', // Automatic unified search across all entities
        matchType: autoMatchType
      });
      setResult(res);
      setIsSearching(false);
      setHistory(searchService.getHistory());
    }, 200);
  };

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setShowSuggestions(false);
    setIsSearching(true);

    const isQuoted = searchQuery.trim().startsWith('"') && searchQuery.trim().endsWith('"');
    const autoMatchType: MatchType = isQuoted ? 'exact' : 'smart';

    const res = await searchService.search(searchQuery, {
      scope: 'all',
      matchType: autoMatchType
    });
    setResult(res);
    setIsSearching(false);
    setHistory(searchService.getHistory());
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClearHistory = () => {
    searchService.clearHistory();
    setHistory([]);
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    searchService.removeFromHistory(id);
    setHistory(searchService.getHistory());
  };

  // Jump Handlers
  const handleJumpToSurah = (surahNum: number) => {
    if (onSelectSurah) {
      onSelectSurah(surahNum);
    } else {
      setCurrentSurah(surahNum);
      setPlayingAyahNumber(null);
      setCurrentAyah(1);
      setCurrentView('reader');
    }
  };

  const handleJumpToAyah = (surahNum: number, ayahNum: number, pageNum: number) => {
    if (onSelectAyah) {
      onSelectAyah(surahNum, ayahNum, pageNum);
    } else {
      setCurrentSurah(surahNum);
      setPlayingAyahNumber(null);
      setCurrentAyah(ayahNum);
      setCurrentPage(pageNum);
      setCurrentView('reader');
    }
  };

  const handleJumpToPage = (pageNum: number) => {
    if (onSelectPage) {
      onSelectPage(pageNum);
    } else {
      setCurrentPage(pageNum);
      setCurrentView('reader');
    }
  };

  // Text Highlighting Helper
  const renderHighlightedText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    const cleanQ = searchQuery.trim().replace(/[أإآٱ]/g, 'ا');
    const parts = text.split(new RegExp(`(${cleanQ})`, 'gi'));

    return (
      <span>
        {parts.map((part, i) =>
          part.replace(/[أإآٱ]/g, 'ا').toLowerCase() === cleanQ.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 px-1 rounded-xs font-semibold"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  const providerType = searchService.getProviderType();

  return (
    <div className="w-full space-y-2 text-right" dir="rtl">
      {/* Search Bar Header */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute right-3.5 flex items-center pointer-events-none text-gray-400">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            placeholder="ابحث بالنص، اسم السورة، رقم الصفحة، الجزء، أو الكلمة..."
            className="w-full pr-10 pl-9 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm shadow-2xs transition-all"
          />

          {query && (
            <button
              onClick={handleClear}
              className="absolute left-2.5 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Execution Stats (Shown only when results exist) */}
        {result && query && (
          <div className="flex items-center justify-between gap-2 mt-1 px-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Zap size={11} className="text-amber-500" />
              <span>{result.executionTimeMs} ميلي ثانية</span>
            </div>
            <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              {result.totalMatches} نتيجة
            </span>
          </div>
        )}

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && query.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute z-30 w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl max-h-[350px] overflow-y-auto custom-scrollbar"
            >
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (sug.targetSurah) handleJumpToSurah(sug.targetSurah);
                    else if (sug.targetPage) handleJumpToPage(sug.targetPage);
                    else executeSearch(sug.text);
                  }}
                  className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 last:border-0 transition-colors text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--color-primary)]" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {sug.text}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {sug.category}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Smart Intent Detection Banner & Results Category Tabs */}
      {query && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-3 rounded-2xl space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1.5">
              <span className="text-sm">{detectQueryIntent(query).icon}</span>
              <span>{detectQueryIntent(query).label}</span>
            </span>
            <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md text-emerald-900 dark:text-emerald-200">
              تحديد آلي 100%
            </span>
          </div>

          {/* Quick Result Category Tabs (only shown when results are present) */}
          {result && result.totalMatches > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-emerald-200/40 dark:border-emerald-900/30 text-xs">
              <span className="text-gray-500 text-[11px] font-semibold pl-1">نتائج العرض:</span>
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeCategoryFilter === 'all'
                    ? 'bg-[var(--color-primary)] text-white shadow-xs'
                    : 'bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-white'
                }`}
              >
                الكل ({result.totalMatches})
              </button>
              {result.surahs.length > 0 && (
                <button
                  onClick={() => setActiveCategoryFilter('surah')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeCategoryFilter === 'surah'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-white'
                  }`}
                >
                  السور ({result.surahs.length})
                </button>
              )}
              {result.ayahs.length > 0 && (
                <button
                  onClick={() => setActiveCategoryFilter('ayah')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeCategoryFilter === 'ayah'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-white'
                  }`}
                >
                  الآيات ({result.ayahs.length})
                </button>
              )}
              {result.pages.length > 0 && (
                <button
                  onClick={() => setActiveCategoryFilter('page')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeCategoryFilter === 'page'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-white'
                  }`}
                >
                  الصفحات ({result.pages.length})
                </button>
              )}
              {result.juzs.length > 0 && (
                <button
                  onClick={() => setActiveCategoryFilter('juz')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeCategoryFilter === 'juz'
                      ? 'bg-[var(--color-primary)] text-white shadow-xs'
                      : 'bg-white/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-white'
                  }`}
                >
                  الأجزاء ({result.juzs.length})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Search History (shown when input is empty) */}
      {!query && history.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              <span>سجل البحث الأخير</span>
            </span>
            <button
              onClick={handleClearHistory}
              className="text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} />
              <span>مسح السجل</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {history.map((item) => (
              <span
                key={item.id}
                onClick={() => executeSearch(item.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer transition-all group"
              >
                <span>{item.query}</span>
                <span className="text-[10px] text-gray-400 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded-full">
                  {item.resultsCount}
                </span>
                <button
                  onClick={(e) => handleRemoveHistoryItem(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results Display Area */}
      {result && (
        <div className="space-y-4 pt-2">
          {result.totalMatches === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <Search className="w-10 h-10 mx-auto text-gray-300 mb-3 opacity-60" />
              <p className="font-bold text-gray-700 dark:text-gray-300">لم يتم العثور على نتائج مطابقة.</p>
              <p className="text-xs text-gray-400 mt-1">تأكد من كتابة الكلمة بشكل صحيح أو اختر النمط "الذكي".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Surahs Section */}
              {result.surahs.length > 0 && (activeCategoryFilter === 'all' || activeCategoryFilter === 'surah') && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-500 px-1 flex items-center gap-1.5">
                    <Book size={14} className="text-[var(--color-primary)]" />
                    <span>السور المطابقة ({result.surahs.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.surahs.map((surah) => (
                      <div
                        key={surah.number}
                        onClick={() => handleJumpToSurah(surah.number)}
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/40 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                            {surah.number}
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                              سورة {getCleanSurahName(surah.name)}
                            </h5>
                            <p className="text-[11px] text-gray-400">
                              {surah.revelationType === 'Meccan' ? '🕋 مكية' : '🕌 مدنية'} • {surah.numberOfAyahs} آية
                            </p>
                          </div>
                        </div>
                        <ChevronLeft size={16} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ayahs Section */}
              {result.ayahs.length > 0 && (activeCategoryFilter === 'all' || activeCategoryFilter === 'ayah') && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-500 px-1 flex items-center gap-1.5">
                    <FileText size={14} className="text-[var(--color-primary)]" />
                    <span>الآيات الكريمة المطابقة ({result.ayahs.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {result.ayahs.map((ayah) => (
                      <div
                        key={`${ayah.surahNumber}-${ayah.ayahNumberInSurah}`}
                        onClick={() =>
                          handleJumpToAyah(ayah.surahNumber, ayah.ayahNumberInSurah, ayah.page)
                        }
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/40 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 text-xs">
                          <span className="font-bold text-[var(--color-primary-dark)] dark:text-emerald-300">
                            سورة {getCleanSurahName(ayah.surahName)} • الآية {ayah.ayahNumberInSurah}
                          </span>
                          <span className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            صفحة {ayah.page} • جزء {ayah.juz}
                          </span>
                        </div>
                        <p className="font-quran text-base sm:text-lg text-gray-800 dark:text-gray-100 leading-relaxed text-right">
                          {renderHighlightedText(ayah.text, query)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pages Section */}
              {result.pages.length > 0 && (activeCategoryFilter === 'all' || activeCategoryFilter === 'page') && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-500 px-1 flex items-center gap-1.5">
                    <Layers size={14} className="text-[var(--color-primary)]" />
                    <span>الصفحات المطابقة</span>
                  </h4>
                  {result.pages.map((p) => (
                    <div
                      key={p.pageNumber}
                      onClick={() => handleJumpToPage(p.pageNumber)}
                      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-sm transition-all flex items-center justify-between text-xs font-bold"
                    >
                      <span className="text-gray-800 dark:text-gray-200">
                        الانتقال إلى صفحة {p.pageNumber} ({p.startSurahName})
                      </span>
                      <ChevronLeft size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}

              {/* Juz Section */}
              {result.juzs.length > 0 && (activeCategoryFilter === 'all' || activeCategoryFilter === 'juz') && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-500 px-1 flex items-center gap-1.5">
                    <Bookmark size={14} className="text-[var(--color-primary)]" />
                    <span>الأجزاء المطابقة</span>
                  </h4>
                  {result.juzs.map((j) => (
                    <div
                      key={j.juzNumber}
                      onClick={() => handleJumpToPage(j.startPage)}
                      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 cursor-pointer hover:shadow-sm transition-all flex items-center justify-between text-xs font-bold"
                    >
                      <span className="text-gray-800 dark:text-gray-200">
                        الجزء {j.juzNumber} (يبدأ بـ {j.startSurahName} - صفحة {j.startPage})
                      </span>
                      <ChevronLeft size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
