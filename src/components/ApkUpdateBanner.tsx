import React from 'react';
import { Download, RefreshCw, Smartphone, Sparkles, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApkUpdateBannerProps {
  isOpen: boolean;
  versionInfo?: {
    version: string;
    releaseNotes?: string;
    sizeFormatted?: string;
  };
  onUpdate: () => void;
  onDismiss: () => void;
}

export const ApkUpdateBanner: React.FC<ApkUpdateBannerProps> = ({
  isOpen,
  versionInfo,
  onUpdate,
  onDismiss
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.96 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed top-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto"
        dir="rtl"
      >
        <div
          className="relative overflow-hidden rounded-3xl p-4 sm:p-5 text-white shadow-2xl border border-amber-400/60"
          style={{
            background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0d9488 100%)',
            boxShadow: '0 20px 40px -10px rgba(2, 44, 34, 0.7), 0 0 25px rgba(212, 175, 55, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.4)'
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 text-slate-950 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                }}
              >
                <Smartphone size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                    <span>تحديث جديد لتطبيق أندرويد</span>
                    <Sparkles size={14} className="text-amber-300 animate-pulse" />
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black shadow-sm">
                    {versionInfo?.version ? `v${versionInfo.version}` : 'إصدار أحدث'}
                  </span>
                </div>

                <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                  يتوفر تحديث لملف الـ APK مع تحسينات في الأداء وسرعة الاستجابة ودقة المواقيت.
                </p>

                {versionInfo?.sizeFormatted && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-200/90 font-medium mt-1">
                    <ShieldCheck size={13} className="text-amber-300" />
                    <span>حجم التحديث: {versionInfo.sizeFormatted} • تثبيت مباشر وسريع</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="p-1.5 text-emerald-200/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="إغلاق التنبيه"
            >
              <X size={18} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-emerald-500/30 relative z-10">
            <button
              onClick={onUpdate}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-slate-950 font-black text-xs transition-all duration-200 hover:brightness-110 active:scale-98 shadow-md cursor-pointer border border-amber-200/70"
              style={{
                background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)'
              }}
            >
              <Download size={15} className="stroke-[2.5]" />
              <span>تحديث وتثبيت الآن (APK)</span>
            </button>

            <button
              onClick={onDismiss}
              className="py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              لاحقاً
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
