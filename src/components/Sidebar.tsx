import React from 'react';
import { Settings, History, PlusCircle, X, User, Heart, Bookmark as BookmarkIcon, SunMoon, BookOpenText, Share2, Compass, Calculator, Download, MonitorCheck, Calendar, Leaf, Sparkles, MessageSquare, BookOpen, Scroll, MapPin } from 'lucide-react';
import { UserSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

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
  onOpenNamesOfAllah: () => void;
  onOpenQibla: () => void;
  onOpenLocation?: () => void;
  onOpenZakat: () => void;
  onOpenHijri: () => void;
  onOpenAgriCalendar: () => void;
  onOpenMiracles: () => void;
  onOpenAbout: () => void;
  onOpenFeedback: () => void;
  userInfo: UserSettings;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
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
  onOpenNamesOfAllah,
  onOpenQibla,
  onOpenLocation,
  onOpenZakat,
  onOpenHijri,
  onOpenAgriCalendar,
  onOpenMiracles,
  onOpenAbout,
  onOpenFeedback,
  userInfo,
  onShowToast
}) => {
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
            className="relative h-full w-[280px] sm:w-[320px] bg-[#fdfbf7] shadow-2xl flex flex-col overflow-hidden rounded-l-[2.5rem] border-l border-white/20"
          >
            
            <div className="p-8 border-b border-white/10 flex justify-between items-center royal-gradient relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white flex items-center justify-center font-black text-2xl shadow-xl border border-white/20 transform hover:rotate-6 transition-transform">
                  {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : <User size={28} />}
                </div>
                <div>
                  <p className="font-black text-white text-lg tracking-wide">
                    {userInfo.username || 'ضيف كريم'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${userInfo.isLoggedIn ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'}`}></span>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                      {userInfo.isLoggedIn ? 'متصل' : 'وضع الزائر'}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all shadow-inner border border-white/10 relative z-10">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 custom-scrollbar">
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
              />

              <SidebarItem 
                icon={<Scroll size={20} />} 
                label="قصص الأنبياء والمرسلين" 
                onClick={() => { if (onOpenProphets) onOpenProphets(); onClose(); }} 
              />

              <SidebarItem 
                icon={<History size={20} />} 
                label="السجل السابق" 
                onClick={() => { onOpenHistory(); onClose(); }} 
              />
              <SidebarItem 
                icon={<BookmarkIcon size={20} />} 
                label="المحفوظات" 
                onClick={() => { onOpenBookmarks(); onClose(); }} 
              />
              
              <div className="my-4 flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-gradient-to-l from-[var(--color-gold)]/30 to-transparent"></div>
                <span className="text-[10px] font-black text-[var(--color-gold-dark)] uppercase tracking-[0.2em]">أدوات</span>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-gold)]/30 to-transparent"></div>
              </div>

              <SidebarItem 
                icon={<SunMoon size={20} />} 
                label="أذكار الصباح والمساء" 
                onClick={() => { onOpenAdhkar(); onClose(); }} 
              />
              <SidebarItem 
                icon={<BookOpenText size={20} />} 
                label="أسماء الله الحسنى" 
                onClick={() => { onOpenNamesOfAllah(); onClose(); }} 
              />
              <SidebarItem 
                icon={<Compass size={20} />} 
                label="اتجاه القبلة" 
                onClick={() => { onOpenQibla(); onClose(); }} 
              />
              {onOpenLocation && (
                <SidebarItem 
                  icon={<MapPin size={20} />} 
                  label="تحديد مدينتي والموقع" 
                  onClick={() => { onOpenLocation(); onClose(); }} 
                />
              )}
              <SidebarItem 
                icon={<Calculator size={20} />} 
                label="حاسبة الزكاة" 
                onClick={() => { onOpenZakat(); onClose(); }} 
              />
              <SidebarItem 
                icon={<Calendar size={20} />} 
                label="التقويم الهجري" 
                onClick={() => { onOpenHijri(); onClose(); }} 
              />
              <SidebarItem 
                icon={<Leaf size={20} />} 
                label="التقويم الزراعي والمواسم" 
                onClick={() => { onOpenAgriCalendar(); onClose(); }} 
              />
              <SidebarItem 
                icon={<Sparkles size={20} />} 
                label="الإعجاز العلمي في القرآن" 
                onClick={() => { onOpenMiracles(); onClose(); }} 
              />
              <SidebarItem 
                icon={<Heart size={20} />} 
                label="المسبحة الإلكترونية" 
                onClick={() => { onOpenTasbih(); onClose(); }} 
              />

              <div className="my-4 flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-gradient-to-l from-[var(--color-gold)]/30 to-transparent"></div>
                <span className="text-[10px] font-black text-[var(--color-gold-dark)] uppercase tracking-[0.2em]">المزيد</span>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-gold)]/30 to-transparent"></div>
              </div>

              <SidebarItem 
                icon={<Sparkles size={20} />} 
                label="لمحة عن البرنامج" 
                onClick={() => { onOpenAbout(); onClose(); }} 
              />
              <SidebarItem 
                icon={<MessageSquare size={20} />} 
                label="اقتراح أو فكرة" 
                onClick={() => { onOpenFeedback(); onClose(); }} 
              />
              <SidebarItem 
                icon={<Settings size={20} />} 
                label="الإعدادات" 
                onClick={() => { onOpenSettings(); onClose(); }} 
              />
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
              />
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
};

const SidebarItem = ({ icon, label, onClick, primary = false }: { icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean }) => (
  <button 
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group border ${
      primary 
        ? 'bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white border-transparent shadow-lg hover:shadow-xl hover:-translate-y-0.5' 
        : 'bg-white text-gray-700 border-gray-100 hover:border-[var(--color-gold)]/30 hover:shadow-md hover:-translate-y-0.5'
    }`}
    onClick={onClick}
  >
    <div className={`p-2.5 rounded-xl transition-all duration-300 ${primary ? 'bg-white/20 text-white' : 'bg-[var(--color-gold)]/10 text-[var(--color-gold-dark)] group-hover:bg-gradient-to-br group-hover:from-[var(--color-gold)] group-hover:to-[var(--color-gold-dark)] group-hover:text-white group-hover:shadow-md'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
    </div>
    <span className="font-black text-sm tracking-wide">{label}</span>
  </button>
);
