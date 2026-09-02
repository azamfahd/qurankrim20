import React from 'react';
import { Settings, History, PlusCircle, X, User, Heart, Bookmark as BookmarkIcon, SunMoon, BookOpenText, Share2, Compass, Calculator, Download, MonitorCheck, Calendar, Leaf, Sparkles, MessageSquare, BookOpen, Scroll, MapPin, Smartphone, Bell } from 'lucide-react';
import { UserSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartAppButton } from './SmartAppButton';
import { DhikrReminderService } from '../services/dhikrReminderService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onNewChat: () => void;
  onOpenTasbih: () => void;
  onOpenQuranPlatform: () => void;
  onOpenProphets?: () => void;
  onOpenBookmarks: () => void;
  onOpenAdhkar: () => void;
  onOpenDhikrReminder?: () => void;
  onOpenNamesOfAllah: () => void;
  onOpenQibla: () => void;
  onOpenLocation?: () => void;
  onOpenZakat: () => void;
  onOpenHijri: () => void;
  onOpenAgriCalendar: () => void;
  onOpenMiracles: () => void;
  onOpenAbout: () => void;
  onOpenFeedback: () => void;
  onOpenInstall?: () => void;
  userInfo: UserSettings;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Sidebar = React.memo<SidebarProps>(({ 
  isOpen, 
  onClose, 
  onOpenSettings, 
  onOpenHistory,
  onNewChat,
  onOpenTasbih,
  onOpenQuranPlatform,
  onOpenProphets,
  onOpenBookmarks,
  onOpenAdhkar,
  onOpenDhikrReminder,
  onOpenNamesOfAllah,
  onOpenQibla,
  onOpenLocation,
  onOpenZakat,
  onOpenHijri,
  onOpenAgriCalendar,
  onOpenMiracles,
  onOpenAbout,
  onOpenFeedback,
  onOpenInstall,
  userInfo,
  onShowToast
}) => {
  const [isStandalone, setIsStandalone] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        ('standalone' in window.navigator && (window.navigator as any).standalone) ||
        document.referrer.includes('android-app://')
      );
    };
    setIsStandalone(checkStandalone());
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="sidebar-container" className="fixed inset-0 z-50 flex justify-start">
          <motion.div 
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div 
            key="sidebar-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative h-full w-[285px] sm:w-[330px] bg-gradient-to-b from-[#fdfbf7] via-[#fefdf9] to-[#faf6ea] shadow-3xl flex flex-col overflow-hidden rounded-l-[2.5rem] border-l-2 border-[var(--color-gold)]/35"
          >
            
            <div className="p-6 pt-7 pb-7 border-b border-[var(--color-gold)]/30 flex justify-between items-center royal-gradient relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              
              <div className="flex items-center gap-3.5 relative z-10">
                <div 
                  className="w-12 h-12 rounded-full text-white flex items-center justify-center font-black text-xl shadow-xl transform hover:scale-105 transition-transform shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #f1e5ac 0%, #d4af37 50%, #996515 100%)',
                    border: '1.5px solid rgba(255, 245, 200, 0.9)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4)'
                  }}
                >
                  <span className="text-[#022c22] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : <User size={20} />}
                  </span>
                </div>
                <div>
                  <p className="font-black text-white text-base tracking-wide leading-tight">
                    {userInfo.username || 'ضيف كريم'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${userInfo.isLoggedIn ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`}></span>
                    <p className="text-[9px] text-white/80 font-bold uppercase tracking-wider">
                      {userInfo.isLoggedIn ? 'حساب متصل' : 'وضع الزائر الكريم'}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shadow-inner border border-white/10 relative z-10 hover:scale-105 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-3 custom-scrollbar">
              <SidebarItem 
                icon={<PlusCircle size={20} />} 
                label="محادثة جديدة" 
                onClick={() => { onNewChat(); onClose(); }}
                primary 
              />
              
              <SidebarItem 
                icon={<BookOpen size={20} />} 
                label="المصحف الشريف الذكي" 
                onClick={() => { onOpenQuranPlatform(); onClose(); }} 
                variant="quran"
              />

              <SidebarItem 
                icon={<Scroll size={20} />} 
                label="قصص الأنبياء والمرسلين" 
                onClick={() => { if (onOpenProphets) onOpenProphets(); onClose(); }} 
                variant="prophets"
              />

              <SidebarItem 
                icon={<History size={20} />} 
                label="السجل السابق" 
                onClick={() => { onOpenHistory(); onClose(); }} 
                variant="history"
              />
              <SidebarItem 
                icon={<BookmarkIcon size={20} />} 
                label="المحفوظات" 
                onClick={() => { onOpenBookmarks(); onClose(); }} 
                variant="bookmarks"
              />
              
              <div className="my-3 flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-gradient-to-l from-[var(--color-gold)]/35 to-transparent"></div>
                <div className="flex items-center gap-1">
                  <Sparkles size={11} className="text-[var(--color-gold-dark)] animate-pulse" />
                  <span className="text-[10px] font-black text-[var(--color-gold-dark)] tracking-[0.1em]">أدوات السكينة</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-gold)]/35 to-transparent"></div>
              </div>

              <SidebarItem 
                icon={<Bell size={20} />} 
                label="التنبيه الذكي بذكر الله والصلاة على النبي ﷺ" 
                badge={DhikrReminderService.getSettings().enabled ? 'نشط' : 'جديد'}
                onClick={() => { if (onOpenDhikrReminder) onOpenDhikrReminder(); onClose(); }} 
                variant="dhikr_alert"
              />

              <SidebarItem 
                icon={<SunMoon size={20} />} 
                label="أذكار الصباح والمساء" 
                onClick={() => { onOpenAdhkar(); onClose(); }} 
                variant="adhkar"
              />
              <SidebarItem 
                icon={<BookOpenText size={20} />} 
                label="أسماء الله الحسنى" 
                onClick={() => { onOpenNamesOfAllah(); onClose(); }} 
                variant="names"
              />
              <SidebarItem 
                icon={<Compass size={20} />} 
                label="اتجاه القبلة" 
                onClick={() => { onOpenQibla(); onClose(); }} 
                variant="qibla"
              />
              {onOpenLocation && (
                <SidebarItem 
                  icon={<MapPin size={20} />} 
                  label="تحديد مدينتي والموقع" 
                  onClick={() => { onOpenLocation(); onClose(); }} 
                  variant="location"
                />
              )}
              <SidebarItem 
                icon={<Calculator size={20} />} 
                label="حاسبة الزكاة" 
                onClick={() => { onOpenZakat(); onClose(); }} 
                variant="zakat"
              />
              <SidebarItem 
                icon={<Calendar size={20} />} 
                label="التقويم الهجري" 
                onClick={() => { onOpenHijri(); onClose(); }} 
                variant="hijri"
              />
              <SidebarItem 
                icon={<Leaf size={20} />} 
                label="التقويم الزراعي والمواسم" 
                onClick={() => { onOpenAgriCalendar(); onClose(); }} 
                variant="agri"
              />
              <SidebarItem 
                icon={<Sparkles size={20} />} 
                label="الإعجاز العلمي في القرآن" 
                onClick={() => { onOpenMiracles(); onClose(); }} 
                variant="miracles"
              />
              <SidebarItem 
                icon={<Heart size={20} />} 
                label="المسبحة الإلكترونية" 
                onClick={() => { onOpenTasbih(); onClose(); }} 
                variant="tasbih"
              />

              <div className="my-3 flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-gradient-to-l from-[var(--color-gold)]/35 to-transparent"></div>
                <div className="flex items-center gap-1">
                  <Sparkles size={11} className="text-[var(--color-gold-dark)]" />
                  <span className="text-[10px] font-black text-[var(--color-gold-dark)] tracking-[0.1em]">خيارات إضافية</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-gold)]/35 to-transparent"></div>
              </div>

              <SidebarItem 
                icon={<Sparkles size={20} />} 
                label="لمحة عن البرنامج" 
                onClick={() => { onOpenAbout(); onClose(); }} 
                variant="about"
              />
              <SidebarItem 
                icon={<MessageSquare size={20} />} 
                label="اقتراح أو فكرة" 
                onClick={() => { onOpenFeedback(); onClose(); }} 
                variant="feedback"
              />
              <SidebarItem 
                icon={<Settings size={20} />} 
                label="الإعدادات" 
                onClick={() => { onOpenSettings(); onClose(); }} 
                variant="settings"
              />

              <div className="pt-1 space-y-1.5">
                <SidebarItem 
                  icon={<Share2 size={20} />} 
                  label="مشاركة التطبيق" 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'تطبيق أنيس القلوب',
                        text: 'رفيقك القرآني للتدبر والسكينة. جربه الآن!',
                        url: window.location.origin
                      }).catch((error) => {
                        if (error.name !== 'AbortError' && !error.message.includes('canceled')) {
                          console.error('Error sharing:', error);
                        }
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                      onShowToast('تم نسخ رابط التطبيق بنجاح', 'success');
                    }
                    onClose();
                  }} 
                  variant="share"
                />

                {/* Only show install button if user is running in browser and has NOT already installed the app */}
                {!isStandalone && (
                  <SidebarItem 
                    icon={<Smartphone size={20} />} 
                    label="تحميل وتثبيت التطبيق" 
                    badge="APK / PWA"
                    onClick={() => {
                      if (onOpenInstall) {
                        onOpenInstall();
                      }
                      onClose();
                    }} 
                    variant="apk"
                  />
                )}
              </div>
            </div>

            <div className="p-4 text-center border-t border-[var(--color-border)] bg-gray-50/50 space-y-0.5">
              <p className="text-xs text-[var(--color-primary)] font-bold">
                أنيس القلوب - رفيقك القرآني
              </p>
              <p className="text-[10px] text-gray-400">
                إعداد المهندس/ عزام فهد
              </p>
              <p className="text-[10px] text-gray-400/80">
                الإصدار 1.1.0
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

const VARIANT_MAP = {
  default: {
    bg: 'bg-[#fefcf8] hover:bg-white border-amber-900/5 hover:border-[var(--color-gold)]/45 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-lg text-gray-800',
    iconBg: 'bg-[var(--color-gold)]/10 text-[var(--color-gold-dark)] group-hover:bg-gradient-to-br group-hover:from-[var(--color-gold)] group-hover:to-[var(--color-gold-dark)] group-hover:text-white',
    text: 'text-gray-800 group-hover:text-[var(--color-primary)]'
  },
  quran: {
    bg: 'bg-[#ecfdf5]/55 hover:bg-[#ecfdf5]/90 border-emerald-600/10 hover:border-emerald-600/40 shadow-[0_2px_8px_rgba(16,185,129,0.02)] hover:shadow-lg text-emerald-950',
    iconBg: 'bg-emerald-600/10 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
    text: 'text-emerald-950 group-hover:text-emerald-800'
  },
  prophets: {
    bg: 'bg-[#f0fdfa]/55 hover:bg-[#f0fdfa]/90 border-teal-600/10 hover:border-teal-600/40 shadow-[0_2px_8px_rgba(13,148,136,0.02)] hover:shadow-lg text-teal-950',
    iconBg: 'bg-teal-600/10 text-teal-700 group-hover:bg-teal-600 group-hover:text-white',
    text: 'text-teal-950 group-hover:text-teal-800'
  },
  history: {
    bg: 'bg-[#f8fafc]/55 hover:bg-[#f8fafc]/90 border-slate-600/10 hover:border-slate-600/40 shadow-[0_2px_8px_rgba(71,85,105,0.02)] hover:shadow-lg text-slate-950',
    iconBg: 'bg-slate-600/10 text-slate-700 group-hover:bg-slate-600 group-hover:text-white',
    text: 'text-slate-950 group-hover:text-slate-800'
  },
  bookmarks: {
    bg: 'bg-[#f0fdf4]/55 hover:bg-[#f0fdf4]/90 border-green-600/10 hover:border-green-600/40 shadow-[0_2px_8px_rgba(22,163,74,0.02)] hover:shadow-lg text-green-950',
    iconBg: 'bg-green-600/10 text-green-700 group-hover:bg-green-600 group-hover:text-white',
    text: 'text-green-950 group-hover:text-green-800'
  },
  adhkar: {
    bg: 'bg-[#fff7ed]/55 hover:bg-[#fff7ed]/90 border-orange-600/10 hover:border-orange-600/40 shadow-[0_2px_8px_rgba(234,88,12,0.02)] hover:shadow-lg text-orange-950',
    iconBg: 'bg-orange-600/10 text-orange-700 group-hover:bg-orange-600 group-hover:text-white',
    text: 'text-orange-950 group-hover:text-orange-800'
  },
  dhikr_alert: {
    bg: 'bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/60 shadow-[0_2px_8px_rgba(217,119,6,0.06)] hover:shadow-lg text-emerald-950',
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 group-hover:scale-110 group-hover:rotate-6 shadow-sm',
    text: 'text-emerald-950 font-black group-hover:text-emerald-900'
  },
  names: {
    bg: 'bg-[#fffbeb]/55 hover:bg-[#fffbeb]/90 border-amber-600/10 hover:border-amber-600/40 shadow-[0_2px_8px_rgba(217,119,6,0.02)] hover:shadow-lg text-amber-950',
    iconBg: 'bg-amber-600/10 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    text: 'text-amber-950 group-hover:text-amber-800'
  },
  qibla: {
    bg: 'bg-[#ecfeff]/55 hover:bg-[#ecfeff]/90 border-cyan-600/10 hover:border-cyan-600/40 shadow-[0_2px_8px_rgba(8,145,178,0.02)] hover:shadow-lg text-cyan-950',
    iconBg: 'bg-cyan-600/10 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white',
    text: 'text-cyan-950 group-hover:text-cyan-800'
  },
  location: {
    bg: 'bg-[#f5f3ff]/55 hover:bg-[#f5f3ff]/90 border-violet-600/10 hover:border-violet-600/40 shadow-[0_2px_8px_rgba(124,58,237,0.02)] hover:shadow-lg text-violet-950',
    iconBg: 'bg-violet-600/10 text-violet-700 group-hover:bg-violet-600 group-hover:text-white',
    text: 'text-violet-950 group-hover:text-violet-800'
  },
  zakat: {
    bg: 'bg-[#fefce8]/55 hover:bg-[#fefce8]/90 border-yellow-600/10 hover:border-yellow-600/40 shadow-[0_2px_8px_rgba(202,138,4,0.02)] hover:shadow-lg text-yellow-950',
    iconBg: 'bg-yellow-600/10 text-yellow-700 group-hover:bg-yellow-600 group-hover:text-white',
    text: 'text-yellow-950 group-hover:text-yellow-800'
  },
  hijri: {
    bg: 'bg-[#fdf6e2]/65 hover:bg-[#fdf6e2]/95 border-[#d4af37]/15 hover:border-[#d4af37]/45 shadow-[0_2px_8px_rgba(153,101,21,0.02)] hover:shadow-lg text-amber-950',
    iconBg: 'bg-[#d4af37]/10 text-[#996515] group-hover:bg-gradient-to-br group-hover:from-[var(--color-gold)] group-hover:to-[var(--color-gold-dark)] group-hover:text-white',
    text: 'text-amber-950 group-hover:text-amber-900'
  },
  agri: {
    bg: 'bg-[#f7fee7]/55 hover:bg-[#f7fee7]/90 border-lime-600/10 hover:border-lime-600/40 shadow-[0_2px_8px_rgba(101,163,13,0.02)] hover:shadow-lg text-lime-950',
    iconBg: 'bg-lime-600/10 text-lime-700 group-hover:bg-lime-600 group-hover:text-white',
    text: 'text-lime-950 group-hover:text-lime-800'
  },
  miracles: {
    bg: 'bg-[#faf5ff]/55 hover:bg-[#faf5ff]/90 border-purple-600/10 hover:border-purple-600/40 shadow-[0_2px_8px_rgba(147,51,234,0.02)] hover:shadow-lg text-purple-950',
    iconBg: 'bg-purple-600/10 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
    text: 'text-purple-950 group-hover:text-purple-800'
  },
  tasbih: {
    bg: 'bg-[#fff1f2]/55 hover:bg-[#fff1f2]/90 border-rose-600/10 hover:border-rose-600/40 shadow-[0_2px_8px_rgba(225,29,72,0.02)] hover:shadow-lg text-rose-950',
    iconBg: 'bg-rose-600/10 text-rose-700 group-hover:bg-rose-600 group-hover:text-white',
    text: 'text-rose-950 group-hover:text-rose-800'
  },
  about: {
    bg: 'bg-[#f0fdfa]/55 hover:bg-[#f0fdfa]/90 border-teal-600/10 hover:border-teal-600/40 shadow-[0_2px_8px_rgba(13,148,136,0.02)] hover:shadow-lg text-teal-950',
    iconBg: 'bg-teal-600/10 text-teal-700 group-hover:bg-teal-600 group-hover:text-white',
    text: 'text-teal-950 group-hover:text-teal-800'
  },
  feedback: {
    bg: 'bg-[#fdf2f8]/55 hover:bg-[#fdf2f8]/90 border-pink-600/10 hover:border-pink-600/40 shadow-[0_2px_8px_rgba(219,39,119,0.02)] hover:shadow-lg text-pink-950',
    iconBg: 'bg-pink-600/10 text-pink-700 group-hover:bg-pink-600 group-hover:text-white',
    text: 'text-pink-950 group-hover:text-pink-800'
  },
  settings: {
    bg: 'bg-[#f8fafc]/55 hover:bg-[#f8fafc]/90 border-slate-600/10 hover:border-slate-600/40 shadow-[0_2px_8px_rgba(71,85,105,0.02)] hover:shadow-lg text-slate-950',
    iconBg: 'bg-slate-600/10 text-slate-700 group-hover:bg-slate-600 group-hover:text-white',
    text: 'text-slate-950 group-hover:text-slate-800'
  },
  share: {
    bg: 'bg-[#f0f9ff]/55 hover:bg-[#f0f9ff]/90 border-sky-600/10 hover:border-sky-600/40 shadow-[0_2px_8px_rgba(2,132,199,0.02)] hover:shadow-lg text-sky-950',
    iconBg: 'bg-sky-600/10 text-sky-700 group-hover:bg-sky-600 group-hover:text-white',
    text: 'text-sky-950 group-hover:text-sky-800'
  },
  apk: {
    bg: 'bg-gradient-to-r from-[#022c22]/95 via-[#064e3b]/90 to-[#042f2e]/95 border-amber-400/50 hover:border-amber-400 shadow-[0_4px_16px_rgba(4,61,46,0.35)] hover:shadow-xl text-white',
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 group-hover:scale-110 shadow-md',
    text: 'text-amber-100 group-hover:text-white'
  }
};

const SidebarItem = ({ 
  icon, 
  label, 
  badge,
  onClick, 
  primary = false, 
  variant = 'default' 
}: { 
  icon: React.ReactNode, 
  label: string, 
  badge?: string,
  onClick: () => void, 
  primary?: boolean, 
  variant?: keyof typeof VARIANT_MAP 
}) => {
  const currentVariant = VARIANT_MAP[variant] || VARIANT_MAP.default;
  return (
    <button 
      className={`w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group border cursor-pointer hover:-translate-y-1 active:translate-y-0 ${
        primary 
          ? 'bg-gradient-to-r from-[#022c22] via-[#05533f] to-[#022c22] text-white border-[var(--color-gold)]/50 hover:border-[var(--color-gold)] shadow-[0_6px_16px_-2px_rgba(4,61,46,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(4,61,46,0.45)]' 
          : currentVariant.bg
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={`p-2.5 rounded-xl transition-all duration-300 shrink-0 ${
          primary 
            ? 'bg-gradient-to-br from-[#f1e5ac] to-[#d4af37] text-[#022c22] shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.4)]' 
            : `${currentVariant.iconBg} group-hover:rotate-3 group-hover:scale-105 group-hover:shadow-md`
        }`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
        </div>
        <span className={`font-black text-xs sm:text-sm tracking-wide transition-colors truncate ${
          primary 
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]' 
            : currentVariant.text
        }`}>
          {label}
        </span>
      </div>
      {badge && (
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black shrink-0 shadow-sm border border-amber-200/60">
          {badge}
        </span>
      )}
    </button>
  );
};

const SidebarItemCompact = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'default' 
}: { 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void, 
  variant?: keyof typeof VARIANT_MAP 
}) => {
  const currentVariant = VARIANT_MAP[variant] || VARIANT_MAP.default;
  return (
    <button 
      className={`w-full flex flex-col items-center justify-center gap-2.5 px-3 py-4 rounded-2xl transition-all duration-300 group border hover:-translate-y-1 active:translate-y-0 cursor-pointer ${currentVariant.bg}`}
      onClick={onClick}
    >
      <div className={`p-2.5 rounded-xl transition-all duration-300 ${currentVariant.iconBg} group-hover:rotate-3 group-hover:scale-105 group-hover:shadow-md`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
      </div>
      <span className={`font-black text-[11px] leading-tight tracking-wide text-center transition-colors ${currentVariant.text}`}>{label}</span>
    </button>
  );
};
