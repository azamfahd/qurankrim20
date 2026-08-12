import React, { useState, useEffect } from 'react';
import { X, Calendar, Bell, Heart, Copy, Share2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCurrentHijriDate, getHijriReminders, DAILY_UP_DUAS, MONTHLY_DUAS, HijriDate } from '../utils/hijri';
import { motion, AnimatePresence } from 'framer-motion';

interface HijriCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  hijriOffset: number;
  setHijriOffset: React.Dispatch<React.SetStateAction<number>>;
}

export const HijriCalendarModal: React.FC<HijriCalendarModalProps> = ({ 
  isOpen, 
  onClose,
  hijriOffset,
  setHijriOffset
}) => {
  const [hijriDate, setHijriDate] = useState<HijriDate>(() => getCurrentHijriDate(hijriOffset));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Update date calculation when offset changes
  useEffect(() => {
    setHijriDate(getCurrentHijriDate(hijriOffset));
    try {
      localStorage.setItem('anis_hijri_offset', hijriOffset.toString());
    } catch (e) {
      console.error(e);
    }
  }, [hijriOffset, isOpen]);

  const offsetDate = (days: number) => {
    setHijriOffset(prev => prev + days);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShare = (text: string, title: string) => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
      }).catch(console.error);
    } else {
      handleCopy(text, 'share-' + title);
    }
  };

  const reminders = getHijriReminders(hijriDate);
  const dailyDuaVal = DAILY_UP_DUAS[(hijriDate.day - 1) % DAILY_UP_DUAS.length];
  const monthlyDuaObj = MONTHLY_DUAS[hijriDate.month];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50 overflow-y-auto" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-[var(--color-background)] w-full max-w-md shadow-2xl overflow-y-auto flex flex-col max-h-[90vh] border border-[var(--color-border)] rounded-3xl relative select-none" 
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary-light)]/20 to-transparent p-6 border-b border-[var(--color-border)] shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-border)]">
                    <Calendar size={22} className="text-[var(--color-primary-dark)] animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">التقويم الهجري الشريف</h2>
                    <p className="text-[10px] text-text-muted mt-0.5">أوقات مباركة وتنبيهات روحية ذكية</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Hijri Adjustment buttons */}
                  <div className="flex items-center gap-1 bg-white/75 p-1 rounded-xl border border-[var(--color-border)] shadow-sm" title="تعديل أيام التقويم">
                    <button 
                      onClick={() => offsetDate(-1)} 
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-white rounded transition-all"
                      title="إنقاص يوم"
                    >
                      <ArrowRight size={12} />
                    </button>
                    
                    <span className="text-[9px] font-black text-gray-700 px-1 min-w-[2.2rem] text-center">
                      {hijriOffset > 0 ? `+${hijriOffset}` : hijriOffset === 0 ? "ضبط" : hijriOffset}
                    </span>

                    <button 
                      onClick={() => offsetDate(1)} 
                      className="p-1 text-gray-500 hover:text-gray-900 hover:bg-white rounded transition-all"
                      title="زيادة يوم"
                    >
                      <ArrowLeft size={12} />
                    </button>
                  </div>

                  <button 
                    onClick={onClose} 
                    className="w-8 h-8 flex items-center justify-center bg-white/50 hover:bg-white text-gray-400 hover:text-gray-900 rounded-full transition-all shadow-sm border border-[var(--color-border)]"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Hijri Date Display Card */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-100/80 rounded-3xl p-6 border border-gray-255 shadow-inner text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[var(--color-gold)] to-[var(--color-gold-dark)]"></div>
                <span className="text-gray-400 text-xs font-bold block mb-1">تاريخ اليوم الهجري</span>
                <h2 className="text-2xl font-black text-gray-950 tracking-wide leading-normal mb-2">
                  {hijriDate.day} {hijriDate.monthNameAr} {hijriDate.year} هـ
                </h2>
                <div className="inline-block bg-[var(--color-primary-light)]/20 border border-[var(--color-primary-light)]/30 text-[var(--color-primary-dark)] font-bold text-xs px-4 py-1.5 rounded-full shadow-sm">
                  {monthlyDuaObj ? monthlyDuaObj.title : 'شهر مبارك'}
                </div>
              </div>

              {/* Reminders / Smart Notifications section */}
              {reminders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Bell size={14} className="text-amber-500 animate-bounce" />
                    <h4 className="text-xs font-black text-gray-800">تنويهات ومناسبات دينية</h4>
                  </div>
                  <div className="space-y-2">
                    {reminders.map((rem, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 transition-colors ${
                          rem.type === 'success' ? 'bg-green-50/75 border-green-200/50 text-green-800' :
                          rem.type === 'warning' ? 'bg-amber-50/75 border-amber-200/50 text-amber-800' :
                          rem.type === 'gold' ? 'bg-yellow-50/60 border-yellow-200/40 text-yellow-800' :
                          'bg-indigo-50/60 border-indigo-100/40 text-indigo-800'
                        }`}
                      >
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow-sm ${
                          rem.type === 'success' ? 'bg-green-500' :
                          rem.type === 'warning' ? 'bg-amber-500' :
                          rem.type === 'gold' ? 'bg-[var(--color-gold-dark)]' :
                          'bg-indigo-500'
                        }`}>
                          {rem.badge}
                        </div>
                        <div className="flex-1">
                          <span className="font-bold block text-gray-950 mb-0.5">{rem.title}</span>
                          <span className="opacity-90">{rem.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dua Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1 text-rose-500">
                  <Heart size={14} className="fill-current text-rose-500" />
                  <h4 className="text-xs font-black text-gray-800">أدعية يومية وشهرية مأثورة</h4>
                </div>
                
                {/* Day Supplication Card */}
                <div className="bg-gray-50/70 border border-gray-150 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400">دعاء اليوم الروحاني ({hijriDate.day})</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCopy(dailyDuaVal, 'dayDua')}
                        className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                        title="نسخ الدعاء"
                      >
                        {copiedKey === 'dayDua' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                      <button 
                        onClick={() => handleShare(dailyDuaVal, 'دعاء اليوم')}
                        className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                        title="مشاركة"
                      >
                        <Share2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] font-medium leading-[1.8] text-gray-800 text-center select-text" style={{ fontStyle: 'italic' }}>
                    &ldquo;{dailyDuaVal}&rdquo;
                  </p>
                </div>

                {/* Month Supplication Card */}
                {monthlyDuaObj && (
                  <div className="bg-[var(--color-primary-light)]/5 border border-[var(--color-primary-light)]/15 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-[var(--color-primary-dark)]">فضائل ودعاء الشهر الحالي</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleCopy(monthlyDuaObj.dua, 'monthDua')}
                          className="p-1 text-[var(--color-primary-dark)] opacity-70 hover:opacity-100 transition-colors"
                          title="نسخ الدعاء"
                        >
                          {copiedKey === 'monthDua' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                        <button 
                          onClick={() => handleShare(monthlyDuaObj.dua, 'دعاء الشهر')}
                          className="p-1 text-[var(--color-primary-dark)] opacity-70 hover:opacity-100 transition-colors"
                          title="مشاركة"
                        >
                          <Share2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal mb-3 bg-white/70 p-2.5 rounded-xl border border-gray-150 shadow-inner">
                      <span className="font-extrabold text-gray-800">الحكمة والفضيلة:</span> {monthlyDuaObj.virtue}
                    </p>
                    <p className="text-[12px] font-medium leading-[1.8] text-gray-800 text-center select-text" style={{ fontStyle: 'italic' }}>
                      &ldquo;{monthlyDuaObj.dua}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
