import React, { useState, useEffect } from 'react';
import { Menu, User, Calendar, Moon, RefreshCw, BookOpen, Heart, Clock, Scroll, Monitor, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentHijriDate } from '../utils/hijri';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  username: string;
  isSyncing?: boolean;
  lastSynced?: number | null;
  onOpenQuran?: () => void;
  onOpenAdhkar?: () => void;
  onOpenPrayerTimes?: () => void;
  onOpenProphets?: () => void;
  onOpenInstallModal?: () => void;
}

const toArabicNumbers = (str: string): string => {
  const map: Record<string, string> = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
  };
  return str.replace(/[0-9]/g, w => map[w] || w);
};

const Header = React.memo<HeaderProps>(({ 
  onOpenSidebar, 
  onOpenSettings, 
  username, 
  isSyncing, 
  lastSynced,
  onOpenQuran,
  onOpenAdhkar,
  onOpenPrayerTimes,
  onOpenProphets,
  onOpenInstallModal
}) => {
  const [hijriDate, setHijriDate] = useState<string>('');
  const [gregorianDate, setGregorianDate] = useState<string>('');
  const [agriMonth, setAgriMonth] = useState<string>('');
  const [isStandalone, setIsStandalone] = useState<boolean>(true);

  useEffect(() => {
    try {
      const today = new Date();
      
      const hijriObj = getCurrentHijriDate();
      setHijriDate(toArabicNumbers(hijriObj.formattedAr));

      const greg = new Intl.DateTimeFormat('ar-u-ca-gregory', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(today);
      setGregorianDate(greg);

      const agriMonths = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"];
      setAgriMonth(agriMonths[today.getMonth()]);

      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                         ('standalone' in window.navigator && (window.navigator as any).standalone) ||
                         localStorage.getItem('anis_pwa_installed') === 'true';
      setIsStandalone(Boolean(standalone));
    } catch (e) {
      console.error("Date formatting not supported", e);
    }
  }, []);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg header-safe-area"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSidebar}
          className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-sm border border-white/10 cursor-pointer active:scale-95"
          aria-label="القائمة"
        >
          <Menu size={22} />
        </button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-[var(--color-gold)]" />
            <h1 className="text-xl font-black royal-text-gradient leading-tight tracking-tight">أنيس القلوب</h1>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-gold-light)] font-semibold mt-0.5 opacity-80 flex-wrap">
            <Calendar size={10} className="text-[var(--color-gold)] shrink-0" />
            <span>{gregorianDate}</span>
            <span className="opacity-40">•</span>
            <span>{hijriDate}</span>
            <span className="opacity-40">•</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">الزراعي: {agriMonth}</span>
          </div>
        </div>
      </div>

      {/* Desktop Quick Nav Shortcuts for PC & Wide Screens */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
        {onOpenQuran && (
          <button
            onClick={onOpenQuran}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-200 hover:text-white hover:bg-white/15 transition-all cursor-pointer border border-transparent hover:border-amber-400/30"
          >
            <BookOpen size={14} className="text-amber-400" />
            <span>المصحف</span>
          </button>
        )}

        {onOpenAdhkar && (
          <button
            onClick={onOpenAdhkar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-200 hover:text-white hover:bg-white/15 transition-all cursor-pointer border border-transparent hover:border-emerald-400/30"
          >
            <Heart size={14} className="text-emerald-400" />
            <span>الأذكار</span>
          </button>
        )}

        {onOpenPrayerTimes && (
          <button
            onClick={onOpenPrayerTimes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-teal-200 hover:text-white hover:bg-white/15 transition-all cursor-pointer border border-transparent hover:border-teal-400/30"
          >
            <Clock size={14} className="text-teal-400" />
            <span>مواقيت الصلاة</span>
          </button>
        )}

        {onOpenProphets && (
          <button
            onClick={onOpenProphets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-200 hover:text-white hover:bg-white/15 transition-all cursor-pointer border border-transparent hover:border-purple-400/30"
          >
            <Scroll size={14} className="text-purple-300" />
            <span>قصص الأنبياء</span>
          </button>
        )}

        {!isStandalone && onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="تثبيت كبرنامج للكمبيوتر (PWA)"
          >
            <Monitor size={14} className="text-amber-300" />
            <span>تثبيت للكمبيوتر</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              key="header-syncing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full border border-white/10"
              title="جاري المزامنة..."
            >
              <RefreshCw size={12} className="text-[var(--color-gold)] animate-spin" />
              <span className="text-[9px] text-white/70 font-bold">مزامنة</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={onOpenSettings}
          className="group flex items-center gap-3 pl-2 pr-1 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <span className="text-sm font-bold text-white group-hover:text-[var(--color-gold-light)] transition-colors hidden sm:block pr-2">{username || 'ضيف'}</span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <User size={18} />
          </div>
        </button>
      </div>
    </motion.header>
  );
});

export default Header;

