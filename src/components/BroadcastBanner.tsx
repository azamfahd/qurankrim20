import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Sparkles, X, Info, ExternalLink, ShieldCheck, Download } from 'lucide-react';
import { SystemAnnouncement, AdminService } from '../services/adminService';

export const BroadcastBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = AdminService.subscribeToAnnouncement((data) => {
      if (data && data.active) {
        // Check local storage if this specific notification id was dismissed
        const dismissedId = localStorage.getItem('dismissed_announcement_id');
        if (dismissedId === data.id && data.allowDismiss) {
          setDismissed(true);
        } else {
          setDismissed(false);
        }
        setAnnouncement(data);
      } else {
        setAnnouncement(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!announcement || !announcement.active || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (announcement.allowDismiss) {
      setDismissed(true);
      if (announcement.id) {
        localStorage.setItem('dismissed_announcement_id', announcement.id);
      }
    }
  };

  const getIcon = () => {
    switch (announcement.type) {
      case 'warning':
        return <AlertTriangle size={20} className="text-amber-300 shrink-0 animate-bounce" />;
      case 'update':
        return <Download size={20} className="text-emerald-300 shrink-0" />;
      case 'blessing':
        return <Sparkles size={20} className="text-yellow-300 shrink-0" />;
      case 'maintenance':
        return <ShieldCheck size={20} className="text-red-300 shrink-0" />;
      default:
        return <Bell size={20} className="text-sky-300 shrink-0" />;
    }
  };

  const getThemeClasses = () => {
    switch (announcement.type) {
      case 'warning':
        return 'bg-gradient-to-r from-amber-900/90 via-orange-900/90 to-amber-950/90 border-amber-500/40 text-amber-100';
      case 'update':
        return 'bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-emerald-950/90 border-emerald-500/40 text-emerald-100';
      case 'blessing':
        return 'bg-gradient-to-r from-amber-950/95 via-yellow-900/90 to-emerald-950/95 border-amber-400/50 text-amber-50';
      case 'maintenance':
        return 'bg-gradient-to-r from-red-950/95 via-rose-900/90 to-red-900/95 border-red-500/50 text-red-100';
      default:
        return 'bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-emerald-950/90 border-amber-500/30 text-emerald-50';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={`broadcast-banner-${announcement.id || 'current'}`}
        initial={{ opacity: 0, y: -15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.98 }}
        className={`mx-4 my-2 p-3.5 rounded-2xl border shadow-xl backdrop-blur-xl relative overflow-hidden ${getThemeClasses()}`}
      >
        {/* Subtle background glow effect */}
        <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2 bg-white/10 rounded-xl border border-white/10 shadow-inner">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30 flex items-center gap-1">
                <span>👑</span>
                <span>تنبيه من مالك التطبيق</span>
              </span>
              <h4 className="text-sm font-black tracking-tight">{announcement.title}</h4>
            </div>

            <p className="text-xs leading-relaxed opacity-95 whitespace-pre-wrap font-sans">
              {announcement.message}
            </p>

            {announcement.actionUrl && (
              <a
                href={announcement.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl transition-all border border-white/20 shadow-sm active:scale-95"
              >
                <span>{announcement.actionText || 'عرض التفاصيل'}</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {announcement.allowDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1.5 bg-black/20 hover:bg-black/40 text-white/80 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
              title="إغلاق التنبيه"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
