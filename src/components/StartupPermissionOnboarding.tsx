import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, MapPin, ShieldCheck, ArrowLeft, Settings, CheckCircle2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { appEventBus } from '../services/appEventBus';

export const StartupPermissionOnboarding: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [needsNotifications, setNeedsNotifications] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);

  useEffect(() => {
    // Only run on native Android/iOS
    if (!Capacitor.isNativePlatform()) return;
    
    // Check if we've already done this onboarding
    const hasRequested = localStorage.getItem('anis_startup_perms_v1');
    if (hasRequested) return;

    const checkPermissions = async () => {
      let requiresNotif = false;
      let requiresLoc = false;

      try {
        const notifStatus = await LocalNotifications.checkPermissions();
        if (notifStatus.display !== 'granted') {
          requiresNotif = true;
        }
      } catch (e) {
        console.warn('Startup check notif error:', e);
      }

      try {
        const locStatus = await Geolocation.checkPermissions();
        if (locStatus.location !== 'granted' && locStatus.coarseLocation !== 'granted') {
          requiresLoc = true;
        }
      } catch (e) {
        console.warn('Startup check loc error:', e);
      }

      if (requiresNotif || requiresLoc) {
        setNeedsNotifications(requiresNotif);
        setNeedsLocation(requiresLoc);
        // Start at the first required step
        setStep(requiresNotif ? 1 : 2);
        
        // Slight delay to allow splash screen to fade
        setTimeout(() => setIsVisible(true), 1500);
      } else {
        localStorage.setItem('anis_startup_perms_v1', 'true');
      }
    };
    
    checkPermissions();
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem('anis_startup_perms_v1', 'true');
    setIsVisible(false);
    appEventBus.emit('APP_PERMISSIONS_UPDATED');
  };

  const handleNextStep = () => {
    if (step === 1 && needsLocation) {
      setStep(2);
    } else {
      finishOnboarding();
    }
  };

  const requestNotifications = async () => {
    try {
      await LocalNotifications.requestPermissions();
    } catch (e) {
      console.warn('Request notifications error:', e);
    }
    handleNextStep();
  };

  const requestLocation = async () => {
    try {
      await Geolocation.requestPermissions();
    } catch (e) {
      console.warn('Request location error:', e);
    }
    handleNextStep();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        dir="rtl"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm w-full relative overflow-hidden"
        >
          {/* Top border decoration */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-emerald-600 via-[var(--color-gold)] to-teal-500"></div>

          {step === 1 && needsNotifications ? (
            <motion.div
              key="step-notif"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm border border-emerald-200 dark:border-emerald-800">
                <BellRing size={32} className="animate-bounce" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 font-readex">
                إشعارات الأذان والأذكار
              </h2>
              <p className="text-sm text-center text-slate-600 dark:text-slate-400 leading-relaxed font-amiri">
                مرحباً بك في أنيس القلوب! لكي نتمكن من تنبيهك بأوقات الصلاة والأذكار في وقتها الصحيح، هل تسمح لنا بإرسال الإشعارات؟
              </p>
              
              <div className="pt-5 flex flex-col gap-2.5">
                <button
                  onClick={requestNotifications}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  <span>نعم، أسمح بالإشعارات</span>
                </button>
                <button
                  onClick={handleNextStep}
                  className="w-full py-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs font-bold transition-colors"
                >
                  تخطي (لا ينصح به)
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-loc"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 mb-3 shadow-sm border border-amber-200 dark:border-amber-800">
                <MapPin size={32} className="animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-800 dark:text-slate-100 font-readex">
                الموقع ومواقيت الصلاة
              </h2>
              <p className="text-sm text-center text-slate-600 dark:text-slate-400 leading-relaxed font-amiri">
                لحساب مواقيت الصلاة بدقة متناهية لمدينتك وتحديد اتجاه القبلة تلقائياً، هل تسمح لنا بالوصول لموقعك الجغرافي؟
              </p>
              
              <div className="pt-5 flex flex-col gap-2.5">
                <button
                  onClick={requestLocation}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin size={18} />
                  <span>تحديد الموقع تلقائياً</span>
                </button>
                <button
                  onClick={handleNextStep}
                  className="w-full py-2.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <span>سأقوم بإدخاله يدوياً لاحقاً</span>
                  <ArrowLeft size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
