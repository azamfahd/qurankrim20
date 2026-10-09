import React, { useState, useEffect } from 'react';
import { 
  X, Download, Smartphone, CheckCircle2, 
  WifiOff, BellRing, ShieldCheck 
} from 'lucide-react';
import { triggerApkDownload, APP_VERSION } from '../utils/apkConfig';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in native APK, standalone PWA, or already marked installed/dismissed
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      document.referrer.includes('android-app://') ||
      Boolean(localStorage.getItem('anis_apk_installed_version')) ||
      Boolean(localStorage.getItem('anis_pwa_installed')) ||
      Boolean(localStorage.getItem('anis_install_dismissed'));

    if (isInstalled) {
      return;
    }

    // Show after 2.5 seconds on initial web visit
    const timer = setTimeout(() => setShowPrompt(true), 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleDownloadApk = () => {
    setIsDownloading(true);
    localStorage.setItem('anis_apk_installed_version', APP_VERSION);
    localStorage.setItem('anis_pwa_installed', 'true');
    triggerApkDownload();

    setTimeout(() => {
      setIsDownloading(false);
      setShowGuide(true);
    }, 1200);
  };

  const handleDismiss = () => {
    localStorage.setItem('anis_install_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        className="fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-[440px] bg-gradient-to-b from-[#022c22] via-[#04362b] to-[#021f19] text-white backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(212,175,55,0.2)] border-2 border-amber-400/50 p-4 sm:p-5 z-[100] flex flex-col gap-3"
        style={{ bottom: 'calc(1rem + var(--safe-area-bottom, 0px))' }}
        dir="rtl"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg border border-amber-300/60 shrink-0">
              <Smartphone size={24} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-sm sm:text-base text-white">
                  تثبيت تطبيق أنيس القلوب (APK)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">
                  النسخة الرسمية
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed mt-0.5">
                تطبيق أندرويد متكامل وسريع، يعمل بدون إنترنت مع دقة تنبيهات الأذكار والأذان.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-emerald-300/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-1.5 py-1">
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.04] border border-white/10">
            <WifiOff size={15} className="text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-white">يعمل أوفلاين</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.04] border border-white/10">
            <BellRing size={15} className="text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-white">تنبيهات دقيقة</span>
          </div>
          <div className="flex flex-col items-center text-center p-2 rounded-xl bg-white/[0.04] border border-white/10">
            <ShieldCheck size={15} className="text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-white">تحديث تلقائي</span>
          </div>
        </div>

        {/* Post-Download Helper Guide if downloaded */}
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-400/10 p-3 rounded-2xl border border-amber-400/30 text-xs text-amber-200 space-y-1.5"
          >
            <div className="flex items-center gap-1.5 font-black text-amber-300">
              <CheckCircle2 size={15} />
              <span>اكتمل بدء التحميل! لإنهاء التثبيت:</span>
            </div>
            <ol className="text-[11px] text-emerald-100/90 list-decimal list-inside space-y-0.5 pr-1">
              <li>افتح قائمة الإشعارات أو التنزيلات في جوالك.</li>
              <li>اضغط على ملف <b className="text-amber-300">anis-al-qulub.apk</b> واختر "تثبيت".</li>
              <li>افتح التطبيق واستمتع بكافة الميزات بملء الشاشة!</li>
            </ol>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadApk}
            disabled={isDownloading}
            className="flex-1 text-xs sm:text-sm font-black text-slate-950 py-3 px-4 rounded-2xl transition-all shadow-xl active:scale-98 flex items-center justify-center gap-2 text-center cursor-pointer border border-amber-300/80 hover:brightness-105"
            style={{
              background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)'
            }}
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={16} className="stroke-[2.5]" />
            )}
            <span>{isDownloading ? 'جاري بدء التحميل...' : showGuide ? 'إعادة تحميل APK مجدداً' : 'تحميل وتثبيت APK الآن'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-emerald-200 text-xs font-bold transition-all cursor-pointer"
          >
            {showGuide ? 'تم' : 'لاحقاً'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
