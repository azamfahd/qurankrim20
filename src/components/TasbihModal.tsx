import React, { useState, useEffect } from 'react';
import { 
  X, RotateCcw, ChevronLeft, ChevronRight, Plus, Trash2, 
  Volume2, VolumeX, Sparkles, Award, Settings, CheckCircle2, 
  Flame, Check, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_DHIKR_SUGGESTIONS = [
  "سبحان الله",
  "الحمد لله",
  "لا إله إلا الله",
  "الله أكبر",
  "أستغفر الله وأتوب إليه",
  "لا حول ولا قوة إلا بالله العلي العظيم",
  "اللهم صلِ وسلم على نبينا محمد",
  "سبحان الله وبحمده ، سبحان الله العظيم",
  "لا إله إلا أنت سبحانك إني كنت من الظالمين",
  "حسبي الله ونعم الوكيل"
];

const TARGET_GOALS = [33, 100, 1000, 0]; // 0 = مفتوح (unlimited)

interface TasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TasbihModal: React.FC<TasbihModalProps> = ({ isOpen, onClose }) => {
  // Custom adhkars
  const [customDhikrs, setCustomDhikrs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('anis_tasbih_custom_dhikrs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allDhikrs = [...DEFAULT_DHIKR_SUGGESTIONS, ...customDhikrs];

  // Active Dhikr Index
  const [dhikrIndex, setDhikrIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anis_tasbih_dhikr_index');
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        return idx >= 0 && idx < allDhikrs.length ? idx : 0;
      }
    } catch {}
    return 0;
  });

  // Individual Dhikr counts map
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('anis_tasbih_counts');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Grand Total Count
  const [totalCount, setTotalCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anis_tasbih_total_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Target Goal (33, 100, 1000, 0)
  const [targetGoal, setTargetGoal] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anis_tasbih_target_goal');
      return saved !== null ? parseInt(saved, 10) : 33;
    } catch {
      return 33;
    }
  });

  // Settings: Vibrate & Sound
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anis_tasbih_vibrate');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('anis_tasbih_sound');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // UI state
  const [newDhikrText, setNewDhikrText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTargetCompleted, setShowTargetCompleted] = useState(false);

  const currentDhikr = allDhikrs[dhikrIndex] || DEFAULT_DHIKR_SUGGESTIONS[0];
  const currentCount = counts[currentDhikr] || 0;

  // Persist states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('anis_tasbih_counts', JSON.stringify(counts));
      localStorage.setItem('anis_tasbih_total_count', totalCount.toString());
      localStorage.setItem('anis_tasbih_dhikr_index', dhikrIndex.toString());
      localStorage.setItem('anis_tasbih_target_goal', targetGoal.toString());
      localStorage.setItem('anis_tasbih_vibrate', vibrateEnabled.toString());
      localStorage.setItem('anis_tasbih_sound', soundEnabled.toString());
      localStorage.setItem('anis_tasbih_custom_dhikrs', JSON.stringify(customDhikrs));
    } catch (e) {
      console.error('Failed to save tasbih state:', e);
    }
  }, [counts, totalCount, dhikrIndex, targetGoal, vibrateEnabled, soundEnabled, customDhikrs]);

  // Audio effect helper
  const playBeep = (freq = 800, duration = 0.05) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const handleTap = () => {
    const newCount = currentCount + 1;
    const newTotal = totalCount + 1;

    setCounts(prev => ({
      ...prev,
      [currentDhikr]: newCount
    }));
    setTotalCount(newTotal);

    if (vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(40);
    }

    playBeep(800, 0.05);

    // Check if target goal is reached
    if (targetGoal > 0 && newCount % targetGoal === 0) {
      setShowTargetCompleted(true);
      if (vibrateEnabled && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      playBeep(1200, 0.2);
      setTimeout(() => setShowTargetCompleted(false), 2500);
    }
  };

  const nextDhikr = () => {
    setDhikrIndex(prev => (prev + 1) % allDhikrs.length);
  };

  const prevDhikr = () => {
    setDhikrIndex(prev => (prev - 1 + allDhikrs.length) % allDhikrs.length);
  };

  const resetCurrentCount = () => {
    setCounts(prev => ({
      ...prev,
      [currentDhikr]: 0
    }));
  };

  const resetAllCounts = () => {
    setCounts({});
    setTotalCount(0);
    setShowResetConfirm(false);
  };

  const handleAddCustomDhikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDhikrText.trim()) return;
    const trimmed = newDhikrText.trim();
    if (!allDhikrs.includes(trimmed)) {
      const updated = [...customDhikrs, trimmed];
      setCustomDhikrs(updated);
      setDhikrIndex(allDhikrs.length); // point to new item
    }
    setNewDhikrText('');
    setShowAddModal(false);
  };

  const handleDeleteCustomDhikr = (text: string) => {
    const updated = customDhikrs.filter(d => d !== text);
    setCustomDhikrs(updated);
    setDhikrIndex(0);
  };

  const isCustomDhikr = customDhikrs.includes(currentDhikr);
  const progressPercent = targetGoal > 0 ? Math.min(100, (currentCount / targetGoal) * 100) : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="tasbih-modal-backdrop"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50" 
          onClick={onClose}
        >
          <motion.div 
            key="tasbih-modal-container"
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col items-center border border-gray-100 dark:border-gray-800 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-light)]/20 text-[var(--color-primary-dark)] flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-primary-dark)] dark:text-emerald-300">المسبحة الإلكترونية</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">حفظ تلقائي ودائم لجميع التسبيحات</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2 rounded-xl transition-all border ${
                    soundEnabled 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                      : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                  title={soundEnabled ? "كتم الصوت" : "تفعيل الصوت"}
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>

                <button 
                  onClick={onClose} 
                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Total Grand Count Banner */}
            <div className="w-full mb-5 p-3.5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl text-white flex justify-between items-center shadow-inner">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Award size={16} className="text-amber-300" />
                <span>إجمالي تسبيحاتك الكلية:</span>
              </div>
              <span className="font-mono font-bold text-lg text-amber-300">
                {totalCount.toLocaleString('ar-SA')}
              </span>
            </div>

            {/* Dhikr Selector & Slider */}
            <div className="w-full mb-6 flex flex-col gap-2">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <button 
                  onClick={prevDhikr} 
                  className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-[var(--color-primary)] dark:text-emerald-400 transition-all shadow-sm"
                  title="الذكر السابق"
                >
                  <ChevronRight size={20} />
                </button>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={dhikrIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col items-center text-center px-2 flex-1"
                  >
                    <span className="text-base sm:text-lg font-bold text-[var(--color-primary-dark)] dark:text-emerald-100 font-serif leading-snug">
                      {currentDhikr}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      الذكر {dhikrIndex + 1} من {allDhikrs.length}
                    </span>
                  </motion.div>
                </AnimatePresence>

                <button 
                  onClick={nextDhikr} 
                  className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl text-[var(--color-primary)] dark:text-emerald-400 transition-all shadow-sm"
                  title="الذكر التالي"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              {/* Action buttons for Dhikr list */}
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>إضافة ذكر جديد</span>
                </button>

                {isCustomDhikr && (
                  <button
                    onClick={() => handleDeleteCustomDhikr(currentDhikr)}
                    className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>حذف هذا الذكر</span>
                  </button>
                )}
              </div>
            </div>

            {/* Target Goal Selector */}
            <div className="w-full mb-6 flex items-center justify-between gap-2 bg-gray-50/80 dark:bg-gray-800/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 pr-2 whitespace-nowrap">الهدف:</span>
              <div className="flex gap-1.5 flex-1 justify-end">
                {TARGET_GOALS.map(goal => (
                  <button
                    key={goal}
                    onClick={() => setTargetGoal(goal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      targetGoal === goal
                        ? 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {goal === 0 ? 'مفتوح' : goal}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Tasbeeh Ring / Button */}
            <div className="relative my-2 flex items-center justify-center">
              {/* Target Completed Toast Effect */}
              <AnimatePresence>
                {showTargetCompleted && (
                  <motion.div
                    key="tasbih-target-completed-toast"
                    initial={{ scale: 0.5, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0, y: -20 }}
                    className="absolute -top-12 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 z-20"
                  >
                    <CheckCircle2 size={16} />
                    <span>أتممت الهدف ({targetGoal}) بنجاح! هنيئاً لك</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Ring Overlay */}
              <div className="relative w-60 h-60 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="120"
                    cy="120"
                    r="105"
                    className="stroke-gray-100 dark:stroke-gray-800"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {targetGoal > 0 && (
                    <circle
                      cx="120"
                      cy="120"
                      r="105"
                      className="stroke-emerald-500 transition-all duration-300"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 105}
                      strokeDashoffset={(2 * Math.PI * 105) * (1 - progressPercent / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  )}
                </svg>

                <motion.button 
                  whileTap={{ scale: 0.94 }}
                  onClick={handleTap}
                  className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 flex flex-col items-center justify-center shadow-2xl cursor-pointer select-none border-4 border-white/20 group text-white"
                >
                  <div className="absolute inset-3 rounded-full border border-white/20 group-hover:scale-105 transition-transform pointer-events-none"></div>
                  
                  <span className="text-6xl font-black font-mono tracking-tight drop-shadow-md">
                    {currentCount}
                  </span>

                  <span className="text-[11px] text-emerald-100/80 font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                    <Flame size={12} className="text-amber-400" />
                    اضغط للتسبيح
                  </span>

                  {targetGoal > 0 && (
                    <span className="text-[10px] text-amber-300 font-semibold mt-1">
                      الهدف: {targetGoal}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="mt-8 w-full flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={resetCurrentCount} 
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-2xl transition-all font-bold text-xs border border-gray-100 dark:border-gray-700"
                title="تصفير هذا الذكر فقط"
              >
                <RotateCcw size={16} />
                <span>تصفير هذا الذكر</span>
              </button>

              <button 
                onClick={() => setShowResetConfirm(true)} 
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs text-red-500 hover:underline font-bold"
              >
                <span>تصفير الشامل</span>
              </button>
            </div>

            {/* Reset All Confirmation Modal */}
            <AnimatePresence>
              {showResetConfirm && (
                <motion.div
                  key="tasbih-reset-all-backdrop"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-6 z-30 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                    <RotateCcw size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">تصفير جميع التسبيحات؟</h3>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                    هل أنت أصلًا متأكد من مسح جميع العدادات وإجمالي التسبيحات الكلي؟ لا يمكن التراجع عن هذه الخطوة.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={resetAllCounts}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                    >
                      نعم، تصفير الكلي
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Custom Dhikr Modal */}
            <AnimatePresence>
              {showAddModal && (
                <motion.div
                  key="tasbih-add-custom-modal"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-6 z-30 flex flex-col justify-center"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Plus size={18} className="text-[var(--color-primary)]" />
                      إضافة ذكر جديد للمسبحة
                    </h3>
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleAddCustomDhikr} className="flex flex-col gap-4">
                    <textarea
                      value={newDhikrText}
                      onChange={e => setNewDhikrText(e.target.value)}
                      placeholder="أدخل نص الذكر أو الدعاء هنا..."
                      className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/30 dark:bg-gray-800 dark:border-gray-700 dark:text-white h-24"
                      required
                    />

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors"
                      >
                        إضافة الآن
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-xs"
                      >
                        إلغاء
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
