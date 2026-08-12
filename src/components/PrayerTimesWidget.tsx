import React, { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { UserSettings, UserLocation } from '../types';

interface PrayerTimesWidgetProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const PrayerTimesWidget: React.FC<PrayerTimesWidgetProps> = ({ settings, onUpdateSettings }) => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Use location from settings or fallback to localStorage or default to Makkah
  useEffect(() => {
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
            // Update parent settings if missing
            if (!settings?.location) {
              onUpdateSettings({ ...settings, location: parsed });
            }
          }
        }
      } catch (e) {
        console.error("Error reading saved location from localStorage:", e);
      }
    }

    const latitude = lat ?? 21.4225;
    const longitude = lng ?? 39.8262;
    
    const coords = new Coordinates(latitude, longitude);
    const params = CalculationMethod.MuslimWorldLeague();
    const date = new Date();
    const times = new PrayerTimes(coords, date, params);
    setPrayerTimes(times);
  }, [settings?.location]);

  const requestLocation = async () => {
    setIsLoadingLocation(true);
    
    // 1. Try GPS Geolocation first for maximum accuracy
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });

        // Try to get the Arabic city name using bigdatacloud's free reverse-geocoding API
        let locationName = 'موقع دقيق عبر GPS';
        try {
          const geoResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=ar`
          );
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            const city = geoData.city || geoData.locality || geoData.principalSubdivision;
            if (city) {
              locationName = `${city}، ${geoData.countryName || 'اليمن'}`;
            }
          }
        } catch (e) {
          console.warn("Reverse geocoding failed, using generic GPS name:", e);
        }

        const newLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: locationName
        };

        // Persist directly to localStorage
        try {
          localStorage.setItem('anis_saved_location', JSON.stringify(newLocation));
        } catch (e) {
          console.error("Failed to save location to localStorage:", e);
        }

        onUpdateSettings({
          ...settings,
          location: newLocation
        });
        setIsLoadingLocation(false);
        return;
      } catch (gpsError) {
        console.warn("GPS Geolocation failed or denied, falling back to IP:", gpsError);
      }
    }

    // 2. Fallback to IP Geolocation if GPS is not supported or fails
    try {
      const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      const latitude = parseFloat(data.latitude);
      const longitude = parseFloat(data.longitude);
      const name = data.city ? `${data.city}، ${data.country}` : 'موقعك الحالي (IP)';
      
      const newLocation: UserLocation = {
        latitude,
        longitude,
        name
      };

      // Persist directly to localStorage
      try {
        localStorage.setItem('anis_saved_location', JSON.stringify(newLocation));
      } catch (e) {
        console.error("Failed to save location to localStorage:", e);
      }

      onUpdateSettings({
        ...settings,
        location: newLocation
      });
    } catch (error) {
      console.error("IP Geolocation fallback failed:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (!prayerTimes) return null;

  const times = [
    { name: 'الفجر', time: formatTime(prayerTimes.fajr) },
    { name: 'الظهر', time: formatTime(prayerTimes.dhuhr) },
    { name: 'العصر', time: formatTime(prayerTimes.asr) },
    { name: 'المغرب', time: formatTime(prayerTimes.maghrib) },
    { name: 'العشاء', time: formatTime(prayerTimes.isha) },
  ];

  const currentLocationName = settings?.location?.name || 'مكة المكرمة';

  return (
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
          <h3 className="font-bold text-sm sm:text-base text-white">مواقيت الصلاة</h3>
        </div>
        <button 
          onClick={requestLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-1.5 text-[10px] sm:text-[11px] bg-black/20 hover:bg-[var(--color-gold)]/20 text-slate-100 px-2.5 py-1 rounded-full border border-[var(--color-gold)]/30 transition-all cursor-pointer disabled:opacity-50"
          title="تحديث الموقع"
        >
          <MapPin size={11} className={`text-[var(--color-gold)] ${isLoadingLocation ? "animate-pulse" : ""}`} />
          <span>{isLoadingLocation ? 'جاري التحديد...' : currentLocationName}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative z-10">
        {times.map((t, idx) => (
          <div key={idx} className="flex flex-col items-center gap-0.5 bg-black/20 hover:bg-[var(--color-gold)]/20 py-1.5 px-1 rounded-xl transition-all border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/50 group/item">
            <p className="text-[10px] text-slate-200 group-hover/item:text-[var(--color-gold-light)] font-medium transition-colors">{t.name}</p>
            <p className="font-bold text-xs sm:text-sm text-white">{t.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
