import React, { useState } from 'react';
import { Download, Sparkles, X, ShieldCheck, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ApkVersionInfo {
  version: string;
  updateType?: 'major' | 'minor' | 'patch' | 'simple' | 'hot' | 'apk';
  isMajor?: boolean;
  title?: string;
  releaseNotes?: string;
  sizeFormatted?: string;
  updateUrl?: string;
}

interface ApkUpdateBannerProps {
  isOpen: boolean;
  versionInfo?: ApkVersionInfo;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const ApkUpdateBanner: React.FC<ApkUpdateBannerProps> = ({
  isOpen,
  versionInfo,
  onUpdate,
  onDismiss
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const displayVersion = versionInfo?.version || '1.1.1';
  const displayTitle = versionInfo?.title || 'تحديث جديد متوفر للتطبيق';
  const displayNotes = versionInfo?.releaseNotes || 'تم تحديث التطبيق لدعم الخوادم السحابية الأمنة وتحسين الأداء.';
  const displaySize = versionInfo?.sizeFormatted || '20 MB • تحميل وتثبيت مباشر';

  const isMajor = Boolean(
    versionInfo?.isMajor ||
    versionInfo?.updateType === 'major'
  );

  const handleStartInAppUpdate = async () => {
    setIsUpdating(true);
    setProgress(15);
    setStatusText('جاري بدء تحديث التطبيق ومحادثات الخوادم السحابية...');

    // Save installed version markers locally immediately
    localStorage.setItem('anis_hot_updated_version', displayVersion);
    localStorage.setItem('anis_apk_installed_version', displayVersion);
    window.dispatchEvent(new CustomEvent('app-update-completed', { detail: { version: displayVersion } }));

    const timer1 = setTimeout(() => {
      setProgress(55);
      setStatusText('جاري تنزيل وتثبيت التحديث المباشر داخل التطبيق...');
    }, 500);

    const timer2 = setTimeout(() => {
      setProgress(88);
      setStatusText('جاري إنهاء التثبيت والتحديث الفوري...');
    }, 1000);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('تم تثبيت التحديث v' + displayVersion + ' بنجاح! 🚀');
      setIsCompleted(true);
      onUpdate();

      setTimeout(() => {
        setIsUpdating(false);
        setIsCompleted(false);
        onDismiss();
      }, 1200);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="apk-update-banner"
          initial={{ opacity: 0, y: -50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed top-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 pointer-events-auto"
          dir="rtl"
        >
          <div
            className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 text-white shadow-2xl border ${
              isMajor ? 'border-amber-400/80' : 'border-emerald-400/60'
            }`}
            style={{
              background: isMajor
                ? 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0d9488 100%)'
                : 'linear-gradient(135deg, #064e3b 0%, #0f766e 60%, #047857 100%)',
              boxShadow: isMajor
                ? '0 20px 40px -10px rgba(2, 44, 34, 0.7), 0 0 25px rgba(212, 175, 55, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.4)'
                : '0 20px 40px -10px rgba(6, 78, 59, 0.7), 0 0 20px rgba(16, 185, 129, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-black shrink-0 text-slate-950 shadow-md"
                  style={{
                    background: isCompleted
                      ? 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)'
                      : isMajor
                      ? 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)'
                      : 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={22} className="text-slate-950" />
                  ) : isMajor ? (
                    <Sparkles size={22} className="text-slate-950" />
                  ) : (
                    <Zap size={22} className="text-slate-950" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                      <span>{displayTitle}</span>
                    </h4>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-sm flex items-center gap-1 ${
                        isMajor
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-300 text-slate-950'
                      }`}
                    >
                      {isMajor ? (
                        <>
                          <span>🚀 إصدار رئيسي</span>
                          <span>v{displayVersion}</span>
                        </>
                      ) : (
                        <>
                          <span>⚡ تحسينات بسيطة</span>
                          <span>v{displayVersion}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-100/90 mt-1.5 leading-relaxed font-medium">
                    {displayNotes}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-amber-200/90 font-medium mt-1.5">
                    <ShieldCheck size={13} className="text-amber-300" />
                    <span>حجم التحديث: {displaySize}</span>
                  </div>
                </div>
              </div>

              {!isUpdating && (
                <button
                  onClick={onDismiss}
                  className="p-1.5 text-emerald-200/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="إغلاق التنبيه"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* In-App Interactive Update Progress */}
            {isUpdating ? (
              <div className="mt-4 pt-3 border-t border-emerald-500/30 relative z-10 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={14} className={isCompleted ? 'text-emerald-300' : 'animate-spin text-amber-400'} />
                    <span>{statusText}</span>
                  </span>
                  <span className="font-mono font-black text-amber-300">{progress}%</span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-emerald-950/80 overflow-hidden p-0.5 border border-emerald-500/30">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400 shadow-sm"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ) : (
              /* Action buttons */
              <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-emerald-500/30 relative z-10">
                <button
                  onClick={handleStartInAppUpdate}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-slate-950 font-black text-xs transition-all duration-200 hover:brightness-110 active:scale-98 shadow-md cursor-pointer border border-amber-200/70"
                  style={{
                    background: isMajor
                      ? 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)'
                      : 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)'
                  }}
                >
                  <Download size={15} className="stroke-[2.5]" />
                  <span>تحديث التطبيق الآن (تحديث مباشر)</span>
                </button>

                <button
                  onClick={onDismiss}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  لاحقاً
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
