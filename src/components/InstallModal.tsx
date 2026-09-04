import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Smartphone, Globe, CheckCircle2, Sparkles, Apple, ArrowRight, ShieldCheck, Zap, Info, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: any) => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'ios'>('apk');
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         ('standalone' in window.navigator && (window.navigator as any).standalone) ||
                         document.referrer.includes('android-app://') ||
                         localStorage.getItem('anis_pwa_installed') === 'true';
    
    setIsInstalled(isStandalone);

    // Detect device platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isDesktopDevice = !isIosDevice && !isAndroidDevice;
    
    setIsIOS(isIosDevice);
    setIsDesktop(isDesktopDevice);

    if (isIosDevice) {
      setActiveTab('ios');
    } else if (isDesktopDevice) {
      setActiveTab('pwa');
    }

    // Capture beforeinstallprompt for PWA
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice?.outcome === 'accepted') {
          localStorage.setItem('anis_pwa_installed', 'true');
          setIsInstalled(true);
          if (onShowToast) onShowToast('تم قبول تثبيت تطبيق الويب بنجاح!', 'success');
        }
        setDeferredPrompt(null);
        onClose();
      });
    } else {
      if (onShowToast) onShowToast('افتح قائمة المتصفح (⋮) واختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"', 'info');
    }
  };

  const handleDownloadApk = () => {
    localStorage.setItem('anis_apk_installed_version', '1.1.0');
    localStorage.setItem('anis_pwa_installed', 'true');
    const link = document.createElement('a');
    link.href = '/app-release.apk';
    link.download = 'أنيس القلوب - القرآن الذكي.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onShowToast) onShowToast('جاري بدء تحميل ملف APK لتطبيق أندرويد (الإصدار 1.1.0)...', 'success');
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'تطبيق أنيس القلوب',
        text: 'رفيقك القرآني للتدبر والسكينة، حمّل التطبيق الآن!',
        url: window.location.origin
      }).catch((error) => {
        if (error.name !== 'AbortError' && !error.message.includes('canceled')) {
          console.error('Error sharing:', error);
        }
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      if (onShowToast) onShowToast('تم نسخ رابط التطبيق للحافظة بنجاح', 'success');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="install-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* Modal Window */}
          <motion.div
            key="install-modal-container"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg lg:max-w-xl bg-gradient-to-b from-slate-900 via-[#032019] to-slate-950 text-white rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden flex flex-col max-h-[90vh] z-10"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-black shadow-lg border border-amber-300/60 shrink-0">
                {isDesktop ? <Monitor size={24} /> : <Smartphone size={24} />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{isDesktop ? 'تثبيت أنيس القلوب على الكمبيوتر' : 'تحميل وتثبيت التطبيق'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    الإصدار 1.1.0
                  </span>
                </h3>
                <p className="text-xs text-amber-200/80 font-medium mt-0.5">
                  {isDesktop ? 'استمتع بتجربة سطح مكتب كاملة وسريعة بدون إنترنت' : 'اختر الخيار المناسب لتثبيت تطبيق أنيس القلوب على جهازك'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all cursor-pointer"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-5 pt-4">
            <div className="flex items-center p-1 bg-black/40 rounded-2xl border border-white/10 gap-1">
              {isDesktop ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pwa')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'pwa'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg border border-amber-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Monitor size={15} />
                    <span>برنامج الكمبيوتر (PWA)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-black shadow-sm">
                      موصى به
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('apk')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'apk'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg border border-emerald-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Smartphone size={15} />
                    <span>تطبيق أندرويد (APK)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'ios'
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg border border-slate-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Apple size={15} />
                    <span>آيفون (iOS)</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('apk')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeTab === 'apk'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg border border-emerald-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Smartphone size={15} />
                    <span>أندرويد (APK)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black shadow-sm">
                      موصى به
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pwa')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'pwa'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg border border-amber-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Globe size={15} />
                    <span>تطبيق الويب (PWA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'ios'
                        ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-lg border border-slate-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Apple size={15} />
                    <span>آيفون (iOS)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-200">
            {activeTab === 'apk' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Feature highlight card */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <span>تطبيق أندرويد المستقل الحقيقي (Native Standalone APK)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    يعمل كـ <strong>تطبيق مستقل بالكامل بملء الشاشة</strong> وبدون شريط المتصفح، مع شاشة بداية فاخرة ودعم العمل بدون إنترنت والمزامنة الفورية عند التحديث.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-2 text-[11px] text-emerald-200/90 bg-emerald-900/30 px-2.5 py-1.5 rounded-xl border border-emerald-700/30">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>شاشة كاملة بدون متصفح</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-200/90 bg-emerald-900/30 px-2.5 py-1.5 rounded-xl border border-emerald-700/30">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>يعمل في وضع عدم الاتصال</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-200/90 bg-emerald-900/30 px-2.5 py-1.5 rounded-xl border border-emerald-700/30">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>تحديثات تلقائية فورية</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-200/90 bg-emerald-900/30 px-2.5 py-1.5 rounded-xl border border-emerald-700/30">
                      <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                      <span>أذان وقبلة ومواقيت دقيقة</span>
                    </div>
                  </div>
                </div>

                {/* Primary APK Download Action */}
                <div className="space-y-2">
                  <button
                    onClick={handleDownloadApk}
                    className="w-full group relative overflow-hidden flex items-center justify-between gap-3 px-5 py-4 rounded-2xl text-white font-black transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xl border border-emerald-400/50"
                    style={{
                      background: 'linear-gradient(135deg, #022c22 0%, #065f46 45%, #0d9488 100%)',
                      boxShadow: '0 10px 25px -5px rgba(6, 95, 70, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                        <Download size={20} />
                      </div>
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-black text-white">تحميل ملف الـ APK المباشر</div>
                        <p className="text-[10px] text-emerald-200/80 font-medium">حجم خفيف وسريع • تثبيت فوري</p>
                      </div>
                    </div>

                    <span className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shrink-0 shadow-sm border border-amber-200/60">
                      تحميل الآن
                    </span>
                  </button>

                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Info size={13} className="text-amber-400" />
                      <span>بعد التحميل، افتح الملف واضغط "تثبيت"</span>
                    </span>
                    <button
                      onClick={handleShareApp}
                      className="text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Share2 size={13} />
                      <span>مشاركة الرابط</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pwa' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                    {isDesktop ? <Monitor size={18} className="text-amber-400" /> : <Zap size={18} className="text-amber-400" />}
                    <span>{isDesktop ? 'تطبيق الكمبيوتر لسطح المكتب (Desktop PWA)' : 'تطبيق الويب التقدمي (Progressive Web App)'}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isDesktop
                      ? 'يعمل البرنامج كنافذة مستقلة فائقة السرعة على أنظمة Windows و macOS و Linux بدون شريط المتصفح، مع دعم التشغيل دون اتصال بالإنترنت.'
                      : 'يتم تثبيت التطبيق مباشرة عبر المتصفح وإضافته كأيقونة على الشاشة الرئيسية دون الحاجة لتحميل ملفات خارجية.'}
                  </p>

                  {isDesktop && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex items-center gap-2 text-[11px] text-amber-200/90 bg-amber-950/50 px-2.5 py-1.5 rounded-xl border border-amber-600/30">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>نافذة سطح مكتب مستقلة</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-amber-200/90 bg-amber-950/50 px-2.5 py-1.5 rounded-xl border border-amber-600/30">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>تثبيت في شريط المهام وقائمة البدء</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-amber-200/90 bg-amber-950/50 px-2.5 py-1.5 rounded-xl border border-amber-600/30">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>يعمل دون اتصال وبكل هدوء</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-amber-200/90 bg-amber-950/50 px-2.5 py-1.5 rounded-xl border border-amber-600/30">
                        <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                        <span>تحديثات تلقائية مجانية فورا</span>
                      </div>
                    </div>
                  )}
                </div>

                {deferredPrompt ? (
                  <button
                    onClick={handleInstallPWA}
                    className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg active:scale-98 cursor-pointer border border-amber-300/40"
                  >
                    <Download size={18} />
                    <span>{isDesktop ? 'تثبيت البرنامج على الكمبيوتر الآن' : 'إضافة التطبيق للشاشة الرئيسية فوراً'}</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-xs">
                    <p className="font-bold text-amber-300">
                      {isDesktop ? 'طريقة تثبيت البرنامج من المتصفح (Chrome / Edge):' : 'خطوات التثبيت من المتصفح (Chrome / Edge / Samsung):'}
                    </p>
                    {isDesktop ? (
                      <ol className="space-y-2 pr-2 text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[10px] font-bold">1</span>
                          <span>انقر على أيقونة التثبيت <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⊕</strong> الموجودة في نهاية شريط عنوان المتصفح.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span>أو افتح قائمة المتصفح (⋮) ثم اختر <strong>«تثبيت أنيس القلوب...» (Install App)</strong>.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[10px] font-bold">3</span>
                          <span>سيفتح البرنامج كنافذة منفصلة وأيقونة على سطح المكتب وشريط المهام.</span>
                        </li>
                      </ol>
                    ) : (
                      <ol className="space-y-2 pr-2 text-slate-300">
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[10px] font-bold">1</span>
                          <span>اضغط على زر القائمة (الثلاث نقاط ⋮) في أعلى أو أسفل المتصفح.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[10px] font-bold">2</span>
                          <span>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</span>
                        </li>
                      </ol>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ios' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-white font-black text-sm">
                    <Apple size={18} className="text-slate-200" />
                    <span>تثبيت أنيس القلوب على الآيفون والآيباد (iOS)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    يدعم نظام iOS تثبيت التطبيقات عبر متصفح Safari لإضافتها كأيقونة مستقلة على الشاشة الرئيسية:
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black text-xs shrink-0">1</span>
                    <span>افتح الموقع من متصفح <strong>Safari</strong> ثم اضغط على أيقونة <strong>المشاركة (Share)</strong> أسفل الشاشة.</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black text-xs shrink-0">2</span>
                    <span>مرر للأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية» (Add to Home Screen)</strong>.</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <span className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black text-xs shrink-0">3</span>
                    <span>اضغط على <strong>«إضافة» (Add)</strong> في أعلى الزاوية، وستظهر أيقونة التطبيق على شاشتك.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {isInstalled ? '✅ التطبيق مثبت حالياً على جهازك' : '✨ تجربة إسلامية مريحة وذكية'}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
