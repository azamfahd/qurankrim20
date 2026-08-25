import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, BatteryWarning, Settings, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prayerName: string;
}

export const MissedAdhanDiagnosticModal: React.FC<Props> = ({ isOpen, onClose, prayerName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-rose-100 dark:border-rose-900/30"
            onClick={e => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-inner">
                <BatteryWarning size={32} className="text-white drop-shadow-md" />
              </div>
              <h2 className="text-xl font-bold mb-1 drop-shadow-sm">تنبيه: تم تفويت أذان ({prayerName})</h2>
              <p className="text-rose-100 text-sm">تم إيقاف التطبيق إجبارياً من قبل نظام الهاتف!</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-slate-700 dark:text-slate-300">
              <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/50 flex items-start gap-3">
                <AlertTriangle className="text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-rose-800 dark:text-rose-300">ماذا حدث؟</p>
                  <p className="leading-relaxed opacity-90 text-rose-700 dark:text-rose-400">
                    رصد النظام أن وقت الأذان قد دخل، ولكن هاتفك قام بـ <strong>"إسبات" أو "إيقاف"</strong> التطبيق في الخلفية لتوفير البطارية، مما منع الصوت من الانطلاق.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings size={18} className="text-[var(--color-primary)]" />
                  <span>خطوات الحل النهائي (لمرة واحدة):</span>
                </h3>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">1</div>
                    <span>اذهب إلى <strong>إعدادات الهاتف</strong> (Settings).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">2</div>
                    <span>ابحث عن قائمة <strong>التطبيقات</strong> (Apps) واختر تطبيق "أنيس القلوب".</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">3</div>
                    <span>ادخل على إعدادات <strong>البطارية</strong> (Battery).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">4</div>
                    <span>اختر <strong>غير مقيّد (Unrestricted)</strong> أو أوقف "تحسين البطارية".</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 mt-2"
              >
                <CheckCircle2 size={18} />
                <span>فهمت، سأقوم بتعديل الإعدادات</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
