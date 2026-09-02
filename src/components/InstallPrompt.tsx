import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare, Smartphone, Globe, CheckCircle2, Monitor } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa'>('apk');

  useEffect(() => {
    // 1. Check if it is already installed (standalone mode or recorded install)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         ('standalone' in window.navigator && (window.navigator as any).standalone) ||
                         document.referrer.includes('android-app://') ||
                         localStorage.getItem('anis_pwa_installed') === 'true';
    
    if (isStandalone) {
      return; // Already installed, do not show prompt
    }

    // 2. Check if user previously dismissed the prompt
    const hasDismissed = localStorage.getItem('anis_install_dismissed') === 'true';
    if (hasDismissed) {
      return;
    }

    // 3. Detect device platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isDesktopDevice = !isIosDevice && !isAndroidDevice;
    setIsDesktop(isDesktopDevice);
    
    if (isIosDevice) {
      setIsIOS(true);
      setActiveTab('pwa'); // iOS only supports PWA Add to Home Screen
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    } else if (isDesktopDevice) {
      setActiveTab('pwa'); // Desktop defaults to PWA desktop application
    }

    // 4. Handle Android/Desktop via beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice?.outcome === 'accepted') {
          localStorage.setItem('anis_pwa_installed', 'true');
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('anis_install_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed left-4 right-4 md:left-auto md:right-6 md:w-[420px] bg-slate-900/95 text-white backdrop-blur-2xl rounded-3xl shadow-2xl border border-amber-500/30 p-5 z-[100] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300"
      style={{ bottom: 'calc(1.25rem + var(--safe-area-bottom, 0px))' }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl flex items-center justify-center shadow-lg border border-amber-400/30 shrink-0">
            {isDesktop ? <Monitor size={22} className="text-amber-100" /> : <Smartphone size={22} className="text-amber-100" />}
          </div>
          <div>
            <h4 className="font-black text-sm text-white">
              {isDesktop ? 'تثبيت أنيس القلوب على الكمبيوتر' : 'تثبيت تطبيق أنيس القلوب'}
            </h4>
            <p className="text-xs text-amber-200/80 font-medium">
              {isDesktop ? 'تطبيق مستقل لسطح المكتب بدون شريط المتصفح وبدون إنترنت' : 'تجربة مستقلة كاملة الشاشة بدون إنترنت'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs Selector */}
      {!isIOS && (
        <div className="flex items-center p-1 bg-slate-800/90 rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isDesktop ? <Monitor size={14} /> : <Globe size={14} />}
            <span>{isDesktop ? 'تطبيق الكمبيوتر (PWA)' : 'تطبيق الويب (PWA)'}</span>
            {isDesktop && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black">مُوصى به</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} />
            <span>تطبيق أندرويد (APK)</span>
            {!isDesktop && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">الأساسي</span>}
          </button>
        </div>
      )}

      {/* Content depending on Active Tab / Device */}
      {isIOS ? (
        <div className="bg-slate-800/70 p-3.5 rounded-2xl border border-slate-700/50">
          <p className="text-xs text-amber-300 font-bold flex items-center gap-2 mb-2">
            لتثبيت التطبيق على الآيفون (iOS):
          </p>
          <ol className="text-xs text-slate-300 space-y-2 pr-1">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-amber-300 shadow-sm flex items-center justify-center text-[10px] font-bold">1</span>
              <span>اضغط على زر المشاركة <Share size={14} className="inline mx-1 text-blue-400" /> أسفل المتصفح</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-amber-300 shadow-sm flex items-center justify-center text-[10px] font-bold">2</span>
              <span>اختر <strong>"إضافة للشاشة الرئيسية"</strong> <PlusSquare size={14} className="inline mx-1 text-slate-200" /></span>
            </li>
          </ol>
        </div>
      ) : activeTab === 'apk' ? (
        <div className="space-y-3">
          <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/20 text-xs text-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 size={16} />
              <span>تطبيق أندرويد مستقل (Native APK)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDesktop 
                ? 'يمكنك تحميل ملف الـ APK ونقله إلى هاتفك الأندرويد للتثبيت المباشر بدون متجر.' 
                : 'يعمل بملء الشاشة وبدون شريط متصفح، ويدعم التحديثات الحية الفورية مع الأذان والقبلة وتصفح المصحف.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/app-release.apk"
              download="أنيس القلوب - القرآن الذكي.apk"
              onClick={() => {
                localStorage.setItem('anis_apk_installed_version', '1.1.0');
                localStorage.setItem('anis_pwa_installed', 'true');
                setTimeout(() => setShowPrompt(false), 2000);
              }}
              className="flex-1 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-center cursor-pointer border border-emerald-400/30"
            >
              <Download size={16} />
              <span>تحميل تطبيق APK للأندرويد</span>
            </a>

            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallPWA}
                className="px-3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                title="تثبيت فوري كـ PWA"
              >
                تثبيت PWA
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/40 text-xs text-slate-300 space-y-1">
            <p className="font-bold text-amber-300">
              {isDesktop ? 'تطبيق الكمبيوتر المكتبي (Desktop PWA):' : 'تطبيق الويب التقدمي (PWA):'}
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isDesktop 
                ? 'يفتح البرنامج في نافذة مستقلة أنيقة على شريط المهام وقائمة البدء، ويعمل بسرعة فائقة وبدون اتصال بالإنترنت.' 
                : 'إضافة سريعة لشاشة الهاتف الرئيسية بدون تحميل ملفات خارجية.'}
            </p>
          </div>

          {deferredPrompt ? (
            <button 
              onClick={handleInstallPWA} 
              className="w-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white px-4 py-3 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-300/30"
            >
              <Download size={16} />
              <span>{isDesktop ? 'تثبيت البرنامج الآن على الكمبيوتر' : 'إضافة للشاشة الرئيسية كـ PWA'}</span>
            </button>
          ) : (
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              {isDesktop 
                ? 'انقر على أيقونة التثبيت (⊕) في شريط عنوان المتصفح أو اختر "تثبيت أنيس القلوب" من قائمة المتصفح (⋮)' 
                : 'افتح قائمة المتصفح (⋮) ثم اختر "تثبيت التطبيق"'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};


