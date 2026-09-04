import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, CheckCircle2, ShieldCheck, Cpu, Volume2, Play, Sparkles, Terminal, Copy, Check, BellRing, Zap, Layers } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { PlatformEnvironmentService } from '../services/platformEnvironmentService';
import { NativeForegroundService } from '../services/nativeForegroundService';
import { NativeNotificationService } from '../services/nativeNotificationService';

interface NativeApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const NativeApkExportModal: React.FC<NativeApkExportModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isTestingAdhan, setIsTestingAdhan] = useState(false);
  const [isTestingDhikr, setIsTestingDhikr] = useState(false);

  const env = PlatformEnvironmentService.getEnvironmentInfo();

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    if (onShowToast) onShowToast('تم نسخ الأمر بنجاح 📋', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTestAdhan = async () => {
    setIsTestingAdhan(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await NativeNotificationService.setupAndroidChannels('mishary');
        const res = await NativeForegroundService.triggerTestNativeAlarm(
          '🕌 حان موعد أذان صلاة الظهر',
          'الله أكبر، حي على الصلاة، حي على الفلاح (بصوت الشيخ مشاري العفاسي)',
          'mishary.mp3'
        );
        if (res && onShowToast) {
          onShowToast('تم إرسال إشعار الأذان الأصيل بنجاح 🔊', 'success');
        }
      } else {
        if (onShowToast) {
          onShowToast('أنت تعمل على المتصفح/PWA حالياً. تجربة الإشعار الأصيل تكون على حزمة الـ APK', 'info');
        }
      }
    } catch (e) {
      if (onShowToast) onShowToast('حدث خطأ أثناء إجراء الاختبار', 'error');
    } finally {
      setIsTestingAdhan(false);
    }
  };

  const handleTestDhikr = async () => {
    setIsTestingDhikr(true);
    try {
      if (Capacitor.isNativePlatform()) {
        await NativeNotificationService.setupAndroidChannels('mishary');
        const res = await NativeForegroundService.triggerTestNativeAlarm(
          '📿 ذكر وتسبحة',
          'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
          'mishary_salawat.mp3'
        );
        if (res && onShowToast) {
          onShowToast('تم إرسال إشعار الذكر الأصيل بنجاح 🔊', 'success');
        }
      } else {
        if (onShowToast) {
          onShowToast('أنت تعمل على المتصفح/PWA حالياً. تجربة الإشعار الأصيل تكون على حزمة الـ APK', 'info');
        }
      }
    } catch (e) {
      if (onShowToast) onShowToast('حدث خطأ أثناء إجراء الاختبار', 'error');
    } finally {
      setIsTestingDhikr(false);
    }
  };

  const buildCommands = [
    { title: '1. بناء حزمة المخرجات وتزامن أندرويد', cmd: 'npx cap sync android' },
    { title: '2. فتح مشروع أندرويد في Android Studio', cmd: 'npx cap open android' },
    { title: '3. التصدير المباشر لـ Release APK عبر السطر البرمجي', cmd: 'cd android && ./gradlew assembleRelease' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="native-apk-export-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            key="native-apk-export-container"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-[var(--color-background)] w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-[var(--color-border)] rounded-3xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 shrink-0">
              <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold">مركز التحزيم والتصدير الأصيل (APK)</h2>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full">
                        Fully Native Ready
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200 mt-1">
                      دليل تحزيم وتفعيل الإمكانيات الأصيلة لتطبيق أنيس القلوب بأعلى كفاءة
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

              {/* Current Status Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-emerald-100">بيئة التشغيل المكتشفة:</span>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg text-white ${
                    env.isNativeAPK ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}>
                    {env.nameAr}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {env.descriptionAr}
                </p>
              </div>

              {/* Feature Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={14} />
                  مصفوفة الإمكانيات الأصيلة المكتملة في الحزمة:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">قنوات النظام الصوتية</h4>
                      <p className="text-[10px] text-gray-500">IMPORTANCE_HIGH = 5</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">الجدولة الدقيقة (Exact Alarms)</h4>
                      <p className="text-[10px] text-gray-500">SCHEDULE_EXACT_ALARM</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">منع نوم المعالج (WakeLock)</h4>
                      <p className="text-[10px] text-gray-500">Keep Audio Alive</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">التخزين المحلي الدائم</h4>
                      <p className="text-[10px] text-gray-500">Dexie IndexedDB Engine</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Live Tests */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-2 text-emerald-400">
                    <BellRing size={16} />
                    اختبار قنوات الصوت الأصيلة لنظام أندرويد
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                    High Priority Channels
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleTestAdhan}
                    disabled={isTestingAdhan}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Volume2 size={16} />
                    <span>اختبار قناة أذان الصلاة</span>
                  </button>

                  <button
                    onClick={handleTestDhikr}
                    disabled={isTestingDhikr}
                    className="flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-600 active:scale-98 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles size={16} />
                    <span>اختبار قناة الأذكار</span>
                  </button>
                </div>
              </div>

              {/* APK Build Instructions */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Terminal size={14} />
                  أوامر تحزيم وتصدير ملف الـ APK النهائي:
                </h3>

                <div className="space-y-2">
                  {buildCommands.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 text-slate-200 p-3 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                      <div className="text-[11px] text-emerald-400 font-sans font-bold">{item.title}</div>
                      <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                        <code className="text-amber-300 select-all">{item.cmd}</code>
                        <button
                          onClick={() => copyToClipboard(item.cmd, idx)}
                          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-all cursor-pointer"
                          title="نسخ الأمر"
                        >
                          {copiedIndex === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-[var(--color-border)] flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs hover:bg-[var(--color-primary-dark)] transition-all cursor-pointer shadow-md"
              >
                إغلاق
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
