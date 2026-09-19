import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { triggerApkDownload, APP_VERSION } from '../utils/apkConfig';

export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

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

    // Show the APK installation prompt after 2 seconds on first visit
    const timer = setTimeout(() => setShowPrompt(true), 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDownloadApk = () => {
    localStorage.setItem('anis_apk_installed_version', APP_VERSION);
    localStorage.setItem('anis_pwa_installed', 'true');
    triggerApkDownload();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('anis_install_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed left-4 right-4 md:left-auto md:right-6 md:w-[420px] bg-slate-900/95 text-white backdrop-blur-2xl rounded-3xl shadow-2xl border border-emerald-500/30 p-5 z-[100] flex flex-col gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-300"
      style={{ bottom: 'calc(1.25rem + var(--safe-area-bottom, 0px))' }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl flex items-center justify-center shadow-lg border border-emerald-400/30 shrink-0">
            <Smartphone size={22} className="text-emerald-100" />
          </div>
          <div>
            <h4 className="font-black text-sm text-white flex items-center gap-2">
              <span>تحميل تطبيق أنيس القلوب (APK)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                النسخة الرسمية
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-1">
              قم بتثبيت تطبيق الـ APK الرسمي للحصول على أداء فائق وسرعة بدقة المواقيت والأذان.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer shrink-0"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>
      </div>

      <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/20 text-xs text-emerald-200 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px]">
          <CheckCircle2 size={14} />
          <span>تطبيق أندرويد مستقل (Direct APK)</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          تثبيت مباشر وسريع يعمل بملء الشاشة وبدون انقطاع.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleDownloadApk}
          className="flex-1 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-center cursor-pointer border border-emerald-400/30"
        >
          <Download size={16} />
          <span>تحميل وتثبيت APK الآن</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="px-3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
        >
          لاحقاً
        </button>
      </div>
    </div>
  );
};
