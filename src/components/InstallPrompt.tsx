import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, CheckCircle2, Sparkles } from 'lucide-react';
import { triggerApkDownload, APP_VERSION } from '../utils/apkConfig';

export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if app is already installed, native, or user previously installed APK / dismissed prompt
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      ('standalone' in window.navigator && (window.navigator as any).standalone) ||
      document.referrer.includes('android-app://') ||
      Boolean(localStorage.getItem('anis_apk_installed_version')) ||
      Boolean(localStorage.getItem('anis_pwa_installed')) ||
      Boolean(localStorage.getItem('anis_install_dismissed'));

    if (isInstalled) {
      return; // Do NOT show prompt if already installed or dismissed
    }

    // Capture beforeinstallprompt for native web apk install if supported
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show the APK installation prompt smoothly after 1 second on first visit
    const timer = setTimeout(() => setShowPrompt(true), 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice?.outcome === 'accepted') {
          localStorage.setItem('anis_pwa_installed', 'true');
          localStorage.setItem('anis_apk_installed_version', APP_VERSION);
        }
        setDeferredPrompt(null);
      });
    }
    // Also initiate APK download
    triggerApkDownload(undefined, APP_VERSION);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('anis_install_dismissed', 'true');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          key="first-time-apk-install-prompt"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-[420px] bg-slate-900/98 text-white backdrop-blur-2xl rounded-3xl shadow-2xl border border-emerald-500/40 p-5 z-[100] flex flex-col gap-3.5"
          style={{ bottom: 'calc(1.25rem + var(--safe-area-bottom, 0px))' }}
          dir="rtl"
        >
          {/* Header with official App Logo */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-13 h-13 rounded-2xl p-1 bg-gradient-to-br from-emerald-500/20 to-teal-900/40 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-md">
                <img 
                  src="/app-icon.svg" 
                  alt="شعار أنيس القلوب" 
                  className="w-11 h-11 rounded-xl object-cover drop-shadow-sm" 
                  onError={(e) => {
                    // Fallback to PNG icon if SVG load fails
                    (e.target as HTMLImageElement).src = '/icons/icon-192.png';
                  }}
                />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-sm text-white flex items-center gap-1.5 flex-wrap">
                  <span>تثبيت تطبيق أنيس القلوب</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold">
                    APK للأندرويد
                  </span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  قم بتثبيت التطبيق على هاتفك للعمل بملء الشاشة، ودقة الأذان والتنبيهات دون انقطاع.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/25 text-xs text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <span>تطبيق أندرويد مستقل وخفيف (Direct APK)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              تثبيت رسمي مباشر وسريع يعمل دون الحاجة لمتصفح الإنترنت.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex-1 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3.5 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-center cursor-pointer border border-emerald-400/40"
            >
              <Download size={16} />
              <span>تحميل وتثبيت APK الآن</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              لاحقاً
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
