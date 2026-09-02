import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X, CheckCircle2, ChevronLeft, Sliders } from 'lucide-react';
import { UserLocation } from '../types';

interface LocationPromptBannerProps {
  isVisible: boolean;
  onClose: () => void;
  location?: UserLocation;
  isHighAccuracy?: boolean;
  onOpenLocationSettings: () => void;
}

export const LocationPromptBanner: React.FC<LocationPromptBannerProps> = ({
  isVisible,
  onClose,
  location,
  isHighAccuracy,
  onOpenLocationSettings
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
      <motion.div
        key="location-prompt-banner"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[94%] max-w-lg"
      >
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-slate-800 dark:text-slate-100">
          {/* Icon */}
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            {isHighAccuracy ? <Navigation size={20} className="animate-pulse" /> : <MapPin size={20} />}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {isHighAccuracy ? '📍 تم تحديد موقعك الجغرافي تلقائياً' : '📍 موقع مواقيت الصلاة والقبلة'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
              {location?.name || 'موقعك الحالي'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onOpenLocationSettings();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
            >
              <Sliders size={12} />
              <span>تغيير</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
