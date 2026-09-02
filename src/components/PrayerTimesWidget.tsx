import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Settings, Sparkles } from 'lucide-react';
import { UserSettings, UserLocation } from '../types';
import { calculateAccuratePrayerTimes, AdhanAudioEngine, AdhanOfflineManager } from '../services/adhanService';
import { LocationService } from '../services/locationService';
import { Suspense } from 'react';
import { lazyWithRetry } from '../utils/lazyWithRetry';
const AdhanSettingsModal = lazyWithRetry(() => import('./AdhanSettingsModal'), 'AdhanSettingsModal');

interface PrayerTimesWidgetProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onOpenAdhanSettings?: () => void;
  onOpenLocationSettings?: () => void;
}

export const PrayerTimesWidget = React.memo<PrayerTimesWidgetProps>(({ 
  settings, 
  onUpdateSettings,
  onOpenAdhanSettings,
  onOpenLocationSettings
}) => {
  const [schedule, setSchedule] = useState(() => 
    calculateAccuratePrayerTimes(settings?.location, new Date(), settings?.adhanSettings?.calculationMethod)
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [localAdhanModalOpen, setLocalAdhanModalOpen] = useState(false);

  const handleOpenAdhan = () => {
    // 1. Unlock browser audio context for smooth adhan playback
    AdhanAudioEngine.unlockAudioContext();

    // 2. Open settings modal
    if (onOpenAdhanSettings) {
      onOpenAdhanSettings();
    } else {
      setLocalAdhanModalOpen(true);
    }
  };

  // Re-calculate accurately when location, date, or method changes
  useEffect(() => {
    AdhanAudioEngine.initServiceWorkerListeners();

    const calc = () => {
      let lat = settings?.location?.latitude;
      let lng = settings?.location?.longitude;

      if (!lat || !lng) {
        try {
          const savedLocStr = localStorage.getItem('anis_saved_location');
          if (savedLocStr) {
            const parsed = JSON.parse(savedLocStr);
            if (parsed?.latitude && parsed?.longitude) {
              lat = parsed.latitude;
              lng = parsed.longitude;
              if (!settings?.location) {
                onUpdateSettings({ ...settings, location: parsed });
              }
            }
          }
        } catch (e) {
          console.error("Error reading saved location from localStorage:", e);
        }
      }

      const activeLocation = (lat && lng) ? { latitude: lat, longitude: lng, name: settings?.location?.name || 'موقعي' } : null;
      const res = calculateAccuratePrayerTimes(activeLocation, new Date(), settings?.adhanSettings?.calculationMethod);
      setSchedule(res);
    };

    calc();

    // Sync 30-day schedule once when location, method or muezzin changes (not on every minute tick)
    const activeLocation = (settings?.location?.latitude && settings?.location?.longitude) ? settings.location : null;
    AdhanAudioEngine.sync30DaysPrayerScheduleLocally(
      activeLocation, 
      settings?.adhanSettings?.calculationMethod,
      settings?.adhanSettings?.muezzin
    );

    const interval = setInterval(calc, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [settings?.location?.latitude, settings?.location?.longitude, settings?.location?.name, settings?.adhanSettings?.calculationMethod, settings?.adhanSettings?.muezzin]);

  const requestLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const loc = await LocationService.autoDetectLocation(true);
      if (loc) {
        onUpdateSettings({
          ...settings,
          location: loc
        });
      }
    } catch (e) {
      console.warn("Manual location refresh error:", e);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const currentLocationName = settings?.location?.name || 'مكة المكرمة';

  return (
    <>
      <div className="bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl p-4 sm:p-5 text-white shadow-[0_4px_20px_rgba(197,160,89,0.25)] border-2 border-[var(--color-gold)]/60 hover:border-[var(--color-gold)] transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)] rounded-full blur-[50px] translate-x-1/2 -translate-y-1/2"></div>
        </div>
        
        {/* Golden subtle top highlight bar */}
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-80"></div>

        <div className="flex justify-between items-center mb-3.5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--color-gold)]/20 rounded-lg backdrop-blur-md border border-[var(--color-gold)]/40 text-[var(--color-gold-light)] shadow-xs">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>مواقيت الصلاة</span>
                {schedule.nextPrayer && (
                  <span className="text-[10px] text-[var(--color-gold-light)] font-normal hidden sm:inline-block">
                    (القادمة: {schedule.nextPrayer})
                  </span>
                )}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={handleOpenAdhan}
              className="flex items-center gap-1.5 text-[10px] sm:text-[11px] bg-black/25 hover:bg-[var(--color-gold)]/25 text-slate-100 px-2.5 py-1 rounded-full border border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] transition-all cursor-pointer shadow-xs active:scale-95"
              title="إعدادات الأذان والتنبيهات"
            >
              <Settings size={12} className="text-[var(--color-gold)]" />
              <span>إعدادات الأذان</span>
            </button>
            <button 
              onClick={() => {
                if (onOpenLocationSettings) {
                  onOpenLocationSettings();
                } else {
                  requestLocation();
                }
              }}
              disabled={isLoadingLocation}
              className="flex items-center gap-1.5 text-[10px] sm:text-[11px] bg-black/25 hover:bg-[var(--color-gold)]/25 text-slate-100 px-2.5 py-1 rounded-full border border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-95 max-w-[140px] sm:max-w-[200px]"
              title="تحديد أو تغيير الموقع الجغرافي"
            >
              <MapPin size={11} className={`text-[var(--color-gold)] shrink-0 ${isLoadingLocation ? "animate-pulse" : ""}`} />
              <span className="truncate">{isLoadingLocation ? 'جاري التحديد...' : currentLocationName}</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10">
          {schedule.prayersList.map((p, idx) => {
            const isNext = p.isNext;
            return (
              <div 
                key={p.key || p.name || `prayer-${idx}`} 
                className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all border group/item relative ${
                  isNext 
                    ? 'bg-[var(--color-gold)]/25 border-[var(--color-gold)] shadow-xs ring-1 ring-[var(--color-gold)]/40' 
                    : 'bg-black/20 hover:bg-[var(--color-gold)]/20 border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/50'
                }`}
              >
                {isNext && (
                  <span className="absolute -top-1.5 right-1/2 translate-x-1/2 bg-[var(--color-gold)] text-slate-900 text-[8px] font-bold px-1 rounded-full leading-tight">
                    التالية
                  </span>
                )}
                <p className={`text-[10px] font-medium transition-colors ${
                  isNext ? 'text-[var(--color-gold-light)] font-bold' : 'text-slate-200 group-hover/item:text-[var(--color-gold-light)]'
                }`}>
                  {p.name}
                </p>
                <p className="font-bold text-xs sm:text-sm text-white">{p.formattedTime}</p>
              </div>
            );
          })}
        </div>
      </div>

      {!onOpenAdhanSettings && (
        <Suspense fallback={<div className="hidden"></div>}><AdhanSettingsModal 
          isOpen={localAdhanModalOpen} 
          onClose={() => setLocalAdhanModalOpen(false)} 
          settings={settings} 
          onSave={onUpdateSettings} /></Suspense>
      )}
    </>
  );
});

