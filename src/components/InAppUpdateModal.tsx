import React, { useState } from 'react';
import { 
  Download, RefreshCw, Smartphone, Sparkles, X, 
  CheckCircle2, Zap, ArrowRight, Check, AlertCircle, 
  ShieldCheck, Rocket 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppUpdateService, AppVersionInfo } from '../services/appUpdateService';

interface InAppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppVersionInfo | null;
  currentVersion: string;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const InAppUpdateModal: React.FC<InAppUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  currentVersion,
  onShowToast
}) => {
  const [isUpdatingHot, setIsUpdatingHot] = useState(false);
  const [hotProgress, setHotProgress] = useState(0);
  const [hotStatusText, setHotStatusText] = useState('');
  const [isHotUpdateCompleted, setIsHotUpdateCompleted] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const handleApplyHotUpdate = async () => {
    setIsUpdatingHot(true);
    setHotProgress(10);
    setHotStatusText('جاري بدء تحديث الميزات داخل التطبيق...');

    const success = await AppUpdateService.applyInAppHotUpdate((progress, statusText) => {
      setHotProgress(progress);
      setHotStatusText(statusText);
    });

    if (success) {
      setIsHotUpdateCompleted(true);
      onShowToast?.('تم تثبيت التحديث والميزات الجديدة بنجاح! اضغط إعادة تشغيل لتطبيقها.', 'success');
    } else {
      setIsUpdatingHot(false);
      onShowToast?.('تعذر إكمال التحديث الفوري، يمكنك تحميل ملف الـ APK بدلاً من ذلك.', 'error');
    }
  };

  const handleDownloadApk = () => {
    AppUpdateService.downloadApk(updateInfo.updateUrl);
    onShowToast?.('جاري بدء تنزيل ملف الـ APK المحدث مباشرة...', 'info');
    onClose();
  };

  const handleFinishAndReload = () => {
    AppUpdateService.reloadApp();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#022c22] to-[#043e31] text-white shadow-2xl border border-amber-400/40 p-4 sm:p-6"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(212, 175, 55, 0.25)'
          }}
        >
          {/* Ambient Gold Glow & Pattern */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          {!isUpdatingHot && (
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 text-emerald-200/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer z-10"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-start gap-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black shrink-0 text-slate-950 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.8)'
              }}
            >
              {isHotUpdateCompleted ? (
                <Check size={28} className="stroke-[3] text-slate-950" />
              ) : (
                <Sparkles size={28} className="text-slate-950" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">
                  {updateInfo.version ? `الإصدار ${updateInfo.version}` : 'تحديث جديد'}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-500/30 font-bold">
                  الحالي: v{currentVersion}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white mt-1.5 leading-snug">
                {updateInfo.title || 'تحديث جديد متوفر للتطبيق'}
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                {updateInfo.releaseNotes || 'يتوفر إصدار أحدث يقدم مميزات وتحسينات جديدة للأداء والتنبيهات.'}
              </p>
            </div>
          </div>

          {/* Features List */}
          {updateInfo.features && updateInfo.features.length > 0 && (
            <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/20 backdrop-blur-xs">
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5 mb-2.5">
                <Zap size={14} />
                <span>ما الجديد في هذا التحديث:</span>
              </h4>
              <ul className="space-y-2">
                {updateInfo.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-emerald-100/90 leading-relaxed">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Live In-App Update Progress (if updating) */}
          {isUpdatingHot && (
            <div className="mt-5 p-4 rounded-2xl bg-black/40 border border-amber-400/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-200 flex items-center gap-2">
                  <RefreshCw size={14} className={isHotUpdateCompleted ? '' : 'animate-spin text-amber-400'} />
                  <span>{hotStatusText}</span>
                </span>
                <span className="font-black text-amber-400 font-mono text-sm">
                  {hotProgress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-emerald-950 overflow-hidden p-0.5 border border-emerald-600/40">
                <motion.div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${hotProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {isHotUpdateCompleted && (
                <p className="text-xs text-emerald-300 font-bold text-center pt-1">
                  ✨ تم تنزيل الميزات بنجاح! اضغط الزر أدناه لتفعيل التحديث فوراً.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-5 pt-3 border-t border-emerald-500/30 flex flex-col gap-2.5">
            {isHotUpdateCompleted ? (
              <button
                onClick={handleFinishAndReload}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl text-slate-950 font-black text-sm shadow-xl cursor-pointer hover:brightness-110 active:scale-98 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)'
                }}
              >
                <Rocket size={18} className="stroke-[2.5]" />
                <span>إعادة التشغيل وتفعيل التحديث الآن 🚀</span>
              </button>
            ) : !isUpdatingHot ? (
              <>
                {/* 1. Hot In-App Feature Update Button */}
                <button
                  onClick={handleApplyHotUpdate}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-2xl text-slate-950 font-black text-sm shadow-xl cursor-pointer hover:brightness-110 active:scale-98 transition-all border border-amber-200"
                  style={{
                    background: 'linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)'
                  }}
                >
                  <Zap size={18} className="stroke-[2.5] text-slate-950" />
                  <div className="flex flex-col items-start leading-tight">
                    <span>تحديث الميزات فورياً (بدون تحميل APK)</span>
                    <span className="text-[10px] font-bold text-slate-800 opacity-90">سريع جداً • يثبت الميزات الجديدة مباشرة داخل البرنامج</span>
                  </div>
                </button>

                {/* 2. Download Full APK Button */}
                <button
                  onClick={handleDownloadApk}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-100 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/30 hover:border-amber-400/50 transition-all cursor-pointer"
                >
                  <Smartphone size={15} />
                  <span>أو تحميل وتثبيت حزمة الـ APK الكاملة ({updateInfo.apkSize || '1.6 MB'})</span>
                  <Download size={14} className="mr-1" />
                </button>

                {/* Dismiss button */}
                <button
                  onClick={onClose}
                  className="w-full py-2 text-center text-xs text-emerald-300/70 hover:text-emerald-100 transition-colors cursor-pointer"
                >
                  تذكيري لاحقاً
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
