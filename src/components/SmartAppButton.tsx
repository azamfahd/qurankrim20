import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartAppButtonProps {
  variant?: 'sidebar' | 'header' | 'sidebar-grid';
  onCloseSidebar?: () => void;
}

export const SmartAppButton: React.FC<SmartAppButtonProps> = ({ variant = 'sidebar', onCloseSidebar }) => {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // 1. Detect Standalone / App Mode
    const checkStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        ('standalone' in window.navigator && (window.navigator as any).standalone) ||
        document.referrer.includes('android-app://')
      );
    };

    const standaloneMode = checkStandalone();
    setIsStandalone(standaloneMode);

    if (standaloneMode) {
      // In standalone app mode, ensure button stays hidden
      return;
    }

    // 2. Check if app was previously installed
    const wasInstalled = localStorage.getItem('anis_pwa_installed') === 'true';
    setIsInstalled(wasInstalled);

    // Check Chrome related apps if available
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        if (apps && apps.length > 0) {
          setIsInstalled(true);
          localStorage.setItem('anis_pwa_installed', 'true');
        }
      }).catch(() => {});
    }

    // 3. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    // 4. Listen for beforeinstallprompt event (Android / Desktop Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // If beforeinstallprompt fires, app is installable from browser
    };

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem('anis_pwa_installed', 'true');
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // IF INSIDE THE STANDALONE APP -> HIDE COMPLETELY!
  if (isStandalone) {
    return null;
  }

  const handleClick = () => {
    if (isInstalled) {
      setShowModal(true);
    } else {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult?.outcome === 'accepted') {
            setIsInstalled(true);
            localStorage.setItem('anis_pwa_installed', 'true');
          }
          setDeferredPrompt(null);
        });
      } else {
        // Always open instructions modal so user gets immediate visual feedback and guidance
        setShowModal(true);
      }
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button 
          className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group border cursor-pointer ${
            isInstalled 
              ? 'bg-emerald-50 text-emerald-950 border-emerald-200/80 hover:bg-emerald-100/80 hover:shadow-md hover:-translate-y-0.5' 
              : 'bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-950 border-amber-200/80 hover:border-[var(--color-gold)]/50 hover:shadow-md hover:-translate-y-0.5'
          }`}
          onClick={() => {
            handleClick();
            if (onCloseSidebar) onCloseSidebar();
          }}
        >
          <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${
            isInstalled 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white'
          }`}>
            {isInstalled ? <Smartphone size={20} /> : <Download size={20} />}
          </div>
          <span className="font-black text-sm tracking-wide">
            {isInstalled ? 'فتح التطبيق' : 'تثبيت التطبيق'}
          </span>
        </button>
      ) : variant === 'sidebar-grid' ? (
        <button 
          className={`w-full flex flex-col items-center justify-center gap-2 px-3 py-3 rounded-2xl transition-all duration-300 group border cursor-pointer ${
            isInstalled 
              ? 'bg-emerald-50 text-emerald-950 border-emerald-200/80 hover:bg-emerald-100/80 hover:shadow-md hover:-translate-y-0.5' 
              : 'bg-amber-50 text-amber-950 border-amber-200/80 hover:border-[var(--color-gold)]/50 hover:shadow-md hover:-translate-y-0.5'
          }`}
          onClick={() => {
            handleClick();
            if (onCloseSidebar) onCloseSidebar();
          }}
        >
          <div className={`p-2 rounded-xl transition-all duration-300 shadow-3xs ${
            isInstalled 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white'
          }`}>
            {isInstalled ? <Smartphone size={18} /> : <Download size={18} />}
          </div>
          <span className="font-black text-xs tracking-wide text-center">
            {isInstalled ? 'فتح التطبيق' : 'تثبيت التطبيق'}
          </span>
        </button>
      ) : (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm cursor-pointer ${
            isInstalled
              ? 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border-emerald-500/40 shadow-emerald-900/20'
              : 'bg-gradient-to-r from-[var(--color-gold-dark)] to-[var(--color-gold)] hover:brightness-110 text-white border-amber-300/30 shadow-amber-900/20'
          }`}
          title={isInstalled ? 'فتح التطبيق المثبت' : 'تثبيت تطبيق أنيس القلوب'}
        >
          {isInstalled ? (
            <>
              <Smartphone size={13} className="text-emerald-300 shrink-0 animate-pulse" />
              <span className="truncate">فتح التطبيق</span>
            </>
          ) : (
            <>
              <Download size={13} className="text-amber-100 shrink-0" />
              <span className="truncate">تثبيت التطبيق</span>
            </>
          )}
        </motion.button>
      )}

      {/* Clean Modal for Installation Instructions or App Open Info */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-slate-900 text-white rounded-3xl p-5 border border-amber-500/30 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>

              <div className="flex flex-col items-center text-center mt-2 gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border ${
                  isInstalled 
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-950/80 text-[var(--color-gold)] border-amber-500/30'
                }`}>
                  {isInstalled ? <Smartphone size={28} /> : <Download size={28} />}
                </div>

                {isInstalled ? (
                  <>
                    <h3 className="text-lg font-black text-emerald-300">التطبيق مثبت على جهازك</h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                      تطبيق <strong className="text-white">أنيس القلوب</strong> مثبت بالفعل على هاتفك.
                    </p>
                    <div className="w-full bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/40 text-right text-xs text-emerald-200 flex items-start gap-2.5 my-1">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>يمكنك فتحه مباشرة من الشاشة الرئيسية للهاتف للحصول على تجربة كاملة وملء الشاشة بدون شريط المتصفح.</span>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-xs cursor-pointer shadow-md"
                    >
                      حسناً، فهمت
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-black royal-text-gradient">تثبيت تطبيق أنيس القلوب</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      اختر الطريقة المفضلة لتشغيل التطبيق على جهازك:
                    </p>

                    {isIOS ? (
                      <div className="w-full bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 text-right text-xs text-slate-200 space-y-2 mt-1">
                        <p className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span>خطوات التثبيت للآيفون (Safari):</span>
                        </p>
                        <ol className="space-y-2 text-[11px] text-slate-300 pr-2">
                          <li className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">1</span>
                            اضغط على زر المشاركة <Share size={14} className="inline text-blue-400 mx-1" /> بالأسفل.
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">2</span>
                            اختر "إضافة إلى الشاشة الرئيسية" <PlusSquare size={14} className="inline text-slate-300 mx-1" />
                          </li>
                        </ol>
                      </div>
                    ) : (
                      <div className="w-full space-y-2.5 my-1 text-right">
                        {/* Option 1: APK (Primary) */}
                        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-emerald-300 flex items-center gap-1.5">
                              <Smartphone size={15} />
                              تطبيق أندرويد المستقل (APK)
                            </span>
                            <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                              الأساسي والموصى به
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                            تطبيق أندرويد حقيقي، بدون شريط متصفح، وشاشة كاملة مع دعم التحديثات التلقائية.
                          </p>
                          <a
                            href="/app-release.apk"
                            download="أنيس القلوب - القرآن الذكي.apk"
                            onClick={() => {
                              localStorage.setItem('anis_apk_installed_version', '1.1.0');
                              localStorage.setItem('anis_pwa_installed', 'true');
                              setShowModal(false);
                            }}
                            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer border border-emerald-400/30"
                          >
                            <Download size={15} />
                            <span>تحميل ملف APK المباشر</span>
                          </a>
                        </div>

                        {/* Option 2: PWA (Secondary) */}
                        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                              <Download size={14} className="text-amber-400" />
                              تثبيت سريع للشاشة الرئيسية (PWA)
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mb-2">
                            إضافة خفيفة لشاشتك الرئيسية من المتصفح بدون تحميل ملفات.
                          </p>
                          {deferredPrompt ? (
                            <button
                              type="button"
                              onClick={() => {
                                deferredPrompt.prompt();
                                deferredPrompt.userChoice.then((choiceResult: any) => {
                                  if (choiceResult?.outcome === 'accepted') {
                                    setIsInstalled(true);
                                    localStorage.setItem('anis_pwa_installed', 'true');
                                  }
                                  setDeferredPrompt(null);
                                  setShowModal(false);
                                });
                              }}
                              className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-amber-200 font-bold rounded-xl transition-all text-[11px] flex items-center justify-center gap-1.5 cursor-pointer border border-slate-600"
                            >
                              <PlusSquare size={13} />
                              <span>تثبيت PWA الآن</span>
                            </button>
                          ) : (
                            <p className="text-[10px] text-slate-400">
                              افتح قائمة المتصفح (⋮) ⬅️ ثم اضغط على <strong>"تثبيت التطبيق"</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full mt-1 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
