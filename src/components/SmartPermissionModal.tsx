import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShieldCheck, Sparkles, CheckCircle2, X, AlertTriangle, MapPin, Volume2 } from 'lucide-react';
import { PermissionService, PermissionType } from '../services/permissionService';

interface SmartPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantSuccess?: () => void;
  title?: string;
  description?: string;
  type?: PermissionType;
  icon?: 'bell' | 'audio' | 'location';
}

export const SmartPermissionModal: React.FC<SmartPermissionModalProps> = ({
  isOpen,
  onClose,
  onGrantSuccess,
  title,
  description,
  type = 'notifications',
  icon
}) => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    if (isOpen) {
      PermissionService.checkPermission(type).then((res) => {
        if (res === 'granted') {
          setStatus('granted');
        } else {
          setStatus('idle');
        }
      });
    } else {
      setStatus('idle');
    }
  }, [isOpen, type]);

  // Derived defaults
  const resolvedTitle = title || (
    type === 'location' ? 'تحديد موقعك لمواقيت الصلاة الدقيقة' :
    type === 'audio' ? 'تفعيل تشغيل الصوت' :
    'تفعيل إشعارات وتنبيه الأذان الفوري'
  );

  const resolvedDescription = description || (
    type === 'location' ? 'نحتاج لمعرفة موقعك الجغرافي لحساب مواقيت الصلاة واتجاه القبلة بدقة متناهية لمدينتك.' :
    type === 'audio' ? 'للسماح بتشغيل التلاوات القرآنية وصوت المؤذن بسلاسة.' :
    'لتنبيهك بدخول وقت الصلاة وتشغيل صوت الأذان بدقة في وقته على شاشة القفل والخلفية.'
  );

  const resolvedIcon = icon || (
    type === 'location' ? 'location' :
    type === 'audio' ? 'audio' :
    'bell'
  );

  const handleRequest = async () => {
    setStatus('requesting');
    try {
      const granted = await PermissionService.requestSystemPermission(type);
      if (granted) {
        setStatus('granted');
        setTimeout(() => {
          if (onGrantSuccess) onGrantSuccess();
          onClose();
          setStatus('idle');
        }, 900);
      } else {
        setStatus('denied');
      }
    } catch (e) {
      console.warn("Permission request notice:", e);
      setStatus('denied');
    }
  };

  const handleProceedAnyway = () => {
    if (onGrantSuccess) onGrantSuccess();
    onClose();
    setStatus('idle');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="smart-permission-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="smart-permission-modal-container"
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-[var(--color-gold)]/40 text-right overflow-hidden relative"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top gold bar */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-600 via-[var(--color-gold)] to-teal-500"></div>

            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                {resolvedIcon === 'bell' && <Bell className="animate-bounce" size={22} />}
                {resolvedIcon === 'audio' && <Volume2 size={22} />}
                {resolvedIcon === 'location' && <MapPin className="animate-pulse" size={22} />}
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-1.5 mb-4">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>{resolvedTitle}</span>
                <Sparkles size={14} className="text-[var(--color-gold)]" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {resolvedDescription}
              </p>
            </div>

            {status === 'denied' && (
              <div className="p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 space-y-1.5 leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span>تنبيه إذن النظام:</span>
                </p>
                <p>
                  أصوات الأذان وتوقيتات الصلاة تعمل وتصدح داخل التطبيق بنجاح. للإشعارات الخارجية على شاشة القفل، يمكنك السماح بالإذن من إعدادات المتصفح أو التطبيق.
                </p>
              </div>
            )}

            {status === 'granted' ? (
              <div className="flex items-center justify-center gap-2 py-3 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl font-bold text-xs">
                <CheckCircle2 size={17} />
                <span>تم تأكيد وتفعيل الإذن بنجاح!</span>
              </div>
            ) : status === 'denied' ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleProceedAnyway}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>متابعة وتأكيد تفعيل الأذان</span>
                </button>
                <button
                  type="button"
                  onClick={handleRequest}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer text-center"
                >
                  إعادة محاولة طلب الإذن
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequest}
                  disabled={status === 'requesting'}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={16} />
                  <span>{status === 'requesting' ? 'جاري الفتح...' : 'السماح والمتابعة'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedAnyway}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  تفعيل ومتابعة
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
