import React, { useState, useEffect } from 'react';
import { X, Download, Share, PlusSquare } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if it is already installed (standalone mode or recorded install)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         ('standalone' in window.navigator && (window.navigator as any).standalone) ||
                         localStorage.getItem('anis_pwa_installed') === 'true';
    
    if (isStandalone) {
      return; // Already installed, do not show prompt
    }

    // 2. Check if user previously dismissed the prompt
    const hasDismissed = localStorage.getItem('anis_install_dismissed') === 'true';
    if (hasDismissed) {
      return;
    }

    // 3. Check for iOS (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIOS(true);
      // Add a slight delay before showing on iOS so it's not jarring on first load
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
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

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
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
      className="fixed left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/20 p-4 z-[100] flex flex-col gap-3"
      style={{ bottom: 'calc(1rem + var(--safe-area-bottom))' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white rounded-xl flex items-center justify-center shadow-md">
            <Download size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900">تثبيت التطبيق</h4>
            <p className="text-xs text-gray-500 font-medium">أضف أنيس القلوب لشاشتك الرئيسية</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss} 
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>
      </div>

      {isIOS ? (
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">
          <p className="text-xs text-gray-700 font-medium leading-relaxed flex items-center gap-2 mb-2">
            لتثبيت التطبيق على الآيفون (iOS):
          </p>
          <ol className="text-[11px] text-gray-600 space-y-2 pr-2">
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center text-[9px] font-bold">1</span>
              اضغط على زر المشاركة <Share size={14} className="inline mx-1 text-blue-500" /> أسفل المتصفح
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center text-[9px] font-bold">2</span>
              اختر "إضافة للشاشة الرئيسية" <PlusSquare size={14} className="inline mx-1 text-gray-700" />
            </li>
          </ol>
        </div>
      ) : (
        <button 
          onClick={handleInstall} 
          className="w-full mt-1 text-sm font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 py-3 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          <Download size={16} />
          تثبيت الآن
        </button>
      )}
    </div>
  );
};

