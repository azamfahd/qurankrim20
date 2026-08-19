import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
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

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/20 p-4 z-50 flex items-center justify-between"
      style={{ bottom: 'calc(1rem + var(--safe-area-bottom))' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white rounded-xl flex items-center justify-center shadow-md">
          <Download size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-gray-900">تثبيت التطبيق</h4>
          <p className="text-xs text-gray-500 font-medium">أضف أنيس القلوب لشاشتك الرئيسية</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstall} 
          className="text-xs font-bold bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
        >
          تثبيت
        </button>
        <button 
          onClick={() => setShowPrompt(false)} 
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
