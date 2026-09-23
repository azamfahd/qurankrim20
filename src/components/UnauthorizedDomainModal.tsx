import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Copy, Check, ExternalLink, X, ShieldAlert, Globe } from 'lucide-react';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  unauthorizedDomain?: string;
  onContinueFallback?: () => void;
}

export const UnauthorizedDomainModal: React.FC<UnauthorizedDomainModalProps> = ({
  isOpen,
  onClose,
  unauthorizedDomain,
  onContinueFallback
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentHostname = unauthorizedDomain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const firebaseSettingsUrl = 'https://console.firebase.google.com/project/accounting-828e5/authentication/settings';

  const handleCopy = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-2xl">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-300">النطاق يتطلب التصريح في Firebase</h3>
                <p className="text-xs text-slate-400">تنبيه حماية حسابات Google Auth</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-right">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-slate-200">
                <p className="font-bold text-amber-300 mb-1">سبب هذا التنبيه:</p>
                يقوم نظام Firebase بحظر تسجيل الدخول بـ Google على النطاقات الجديدة لحمايتك حتى تمنحها الإذن صراحة في إعدادات مشروعك <span className="font-mono text-amber-300 font-bold">(accounting-828e5)</span>.
              </div>
            </div>

            {/* Current Hostname Display */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم النطاق الذي يحتاج لإضافة (Domain):</label>
              <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-700/80 rounded-2xl">
                <Globe size={16} className="text-amber-400 shrink-0" />
                <span className="text-xs font-mono font-bold text-amber-200 flex-1 truncate text-left dir-ltr">
                  {currentHostname}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ النطاق'}</span>
                </button>
              </div>
            </div>

            {/* Step by step guide */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-amber-300">خطوتان سريعتان للربط (تستغرق 10 ثواني):</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                <li>اضغط زر **"نسخ النطاق"** أعلاه.</li>
                <li>افتح صفحة إعدادات Firebase واضغط على **"Add domain"** وانسخ النطاق هناك.</li>
              </ol>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <a
                href={firebaseSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink size={16} />
                <span>الذهاب لصفحة إعدادات Firebase وتفعيل النطاق فوراً</span>
              </a>

              {onContinueFallback && (
                <button
                  onClick={() => {
                    onContinueFallback();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  المتابعة كـ زائر / الاستمرار مع Supabase Sync
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
