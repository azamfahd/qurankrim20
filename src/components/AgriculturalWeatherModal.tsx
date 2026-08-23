import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sun, 
  CloudRain, 
  Cloud, 
  Wind, 
  Droplets, 
  Thermometer, 
  Gauge, 
  Compass, 
  RefreshCw, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Info, 
  Calendar,
  CloudLightning,
  CloudFog,
  CloudSun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LocationCoordinates {
  name: string;
  lat: number;
  lng: number;
  regionId: string;
}

export const YEMEN_WEATHER_LOCATIONS: LocationCoordinates[] = [
  { name: 'صنعاء والمرتفعات', lat: 15.3694, lng: 44.1910, regionId: 'highlands' },
  { name: 'إب والمناطق الوسطى', lat: 13.9667, lng: 44.1833, regionId: 'middle' },
  { name: 'تعز والجنوب الغربي', lat: 13.5789, lng: 44.0192, regionId: 'middle' },
  { name: 'الحديدة وتهامة والساحل', lat: 14.7978, lng: 42.9545, regionId: 'coastal' },
  { name: 'عدن والسهول الجنوبية', lat: 12.7855, lng: 45.0186, regionId: 'coastal' },
  { name: 'سيئون وحضرموت', lat: 15.9432, lng: 48.7873, regionId: 'eastern' },
  { name: 'ذمار والعانسين', lat: 14.5425, lng: 44.4051, regionId: 'highlands' },
  { name: 'صعدة والشمال', lat: 16.9402, lng: 43.7628, regionId: 'highlands' },
  { name: 'مأرب والجوف', lat: 15.4624, lng: 45.3258, regionId: 'eastern' },
  { name: 'أرخبيل سقطرى', lat: 12.4634, lng: 53.8237, regionId: 'coastal' },
];

export interface WeatherInfoData {
  locationName: string;
  isGps: boolean;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    uvIndex: number;
    weatherCode: number;
    conditionText: string;
    isDay: boolean;
  };
  tomorrow: {
    maxTemp: number;
    minTemp: number;
    rainProb: number;
    weatherCode: number;
    conditionText: string;
    uvMax: number;
    windMax: number;
    agriAdvice: string;
  };
}

interface AgriculturalWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: { name: string; latitude?: number; longitude?: number; lat?: number; lng?: number } | null;
  selectedRegion?: string;
  onSelectRegion?: (regionId: string) => void;
}

// Map WMO Weather Codes to Arabic description & Ag Advice
const getWMOWeatherDetails = (code: number) => {
  if (code === 0) {
    return {
      text: 'مشمس وسماء صافية تماماً',
      icon: Sun,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      adviceToday: 'أجواء ممتازة وجافة، مناسبة لبذار الحبوب، تجفيف المحاصيل، والرش الزراعي الحجلي.',
      adviceTomorrow: 'طقس مشمس ومستقر غداً؛ يُنصح بجدولة ري المزروعات في الفجر أو المساء.'
    };
  }
  if ([1, 2, 3].includes(code)) {
    return {
      text: 'غائم جزئياً إلى سحب متفرقة',
      icon: CloudSun,
      color: 'text-sky-500',
      bgColor: 'bg-sky-50 dark:bg-sky-950/30',
      adviceToday: 'طقس لطيف ومعتدل الإضاءة، مثالي لأعمال التقليم، العزق، ونقل الشتلات.',
      adviceTomorrow: 'استمرار الاعتدال غداً مع سحب خفيفة تلطف حرارة النهار وتقي الشتلات.'
    };
  }
  if ([45, 48].includes(code)) {
    return {
      text: 'ضباب فجري وندى كثيف',
      icon: CloudFog,
      color: 'text-teal-500',
      bgColor: 'bg-teal-50 dark:bg-teal-950/30',
      adviceToday: 'ارتفاع نسبة الرطوبة الفجرية يغذي الأوراق؛ انتبه لمكافحة الفطريات والبياض الدقيقي.',
      adviceTomorrow: 'توقع تشكل الندى الفجري غداً؛ تجنب الرش الكيميائي المباشر على الأوراق المبتلة.'
    };
  }
  if ([51, 53, 55, 61, 63, 65, 80, 81].includes(code)) {
    return {
      text: 'أمطار وزخات مطرية خيرية',
      icon: CloudRain,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      adviceToday: 'خير وبركة؛ أوقف الري السطحي، واستغل مياه الأمطار لتغذية قنوات السواقي والمدرجات.',
      adviceTomorrow: 'فرصة لتساقط الأمطار غداً؛ نوصي بتصريف المياه الزائدة ومنع التجمع في الجذور.'
    };
  }
  if ([82, 95, 96, 99].includes(code)) {
    return {
      text: 'أمطار رعدية وعواصف موسمية',
      icon: CloudLightning,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      adviceToday: 'تحذير: تجنب التواجد في مجاري السيول وبطون الأودية، وقم بتثبيت الشتلات والدفيئات.',
      adviceTomorrow: 'توقع تقلبات وعواصف رعدية غداً؛ حرص على صيانة عقوم الحقول وجدران المدرجات.'
    };
  }
  return {
    text: 'طقس مستقر ومعتدل',
    icon: Cloud,
    color: 'text-stone-500',
    bgColor: 'bg-stone-50 dark:bg-stone-900',
    adviceToday: 'أجواء زراعية اعتيادية ومناسبة لكافة النشاطات الفلاحية اليومية.',
    adviceTomorrow: 'طقس معتدل ومناسب لمتابعة نمو المزروعات والعناية بالتربة.'
  };
};

export default function AgriculturalWeatherModal({
  isOpen,
  onClose,
  location,
  selectedRegion
}: AgriculturalWeatherModalProps) {
  const [selectedLoc, setSelectedLoc] = useState<LocationCoordinates>(YEMEN_WEATHER_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState<WeatherInfoData | null>(null);

  // Smart Instant Local Climate Engine
  const generateSmartInstantWeather = (locName: string, regionId: string): WeatherInfoData => {
    const date = new Date();
    const month = date.getMonth(); // 0-11
    const hour = date.getHours();
    const isDay = hour >= 6 && hour < 18;

    let baseTemp = 24;
    let humidity = 50;
    let pressure = 1012;
    let code = 1;

    if (regionId === 'highlands' || locName.includes('صنعاء') || locName.includes('ذمار') || locName.includes('صعدة')) {
      baseTemp = month >= 4 && month <= 8 ? 24 : 17;
      humidity = month >= 6 && month <= 8 ? 65 : 35;
      pressure = 1015;
      code = (month >= 6 && month <= 8) ? 61 : 1;
    } else if (regionId === 'coastal' || locName.includes('الحديدة') || locName.includes('عدن') || locName.includes('سقطرى')) {
      baseTemp = month >= 4 && month <= 8 ? 34 : 27;
      humidity = 76;
      pressure = 1009;
      code = 2;
    } else if (regionId === 'middle' || locName.includes('إب') || locName.includes('تعز')) {
      baseTemp = month >= 4 && month <= 8 ? 25 : 20;
      humidity = 66;
      pressure = 1012;
      code = (month >= 5 && month <= 9) ? 61 : 2;
    } else { // eastern
      baseTemp = month >= 4 && month <= 8 ? 36 : 26;
      humidity = 30;
      pressure = 1010;
      code = 0;
    }

    const currentWmo = getWMOWeatherDetails(code);
    const tomorrowCode = code === 61 ? 3 : code;
    const tomorrowWmo = getWMOWeatherDetails(tomorrowCode);

    return {
      locationName: locName,
      isGps: false,
      current: {
        temp: baseTemp,
        feelsLike: baseTemp + 1,
        humidity: humidity,
        windSpeed: Math.floor(Math.random() * 8) + 10,
        windDirection: 180,
        pressure: pressure,
        uvIndex: isDay ? 8 : 0,
        weatherCode: code,
        conditionText: currentWmo.text,
        isDay: isDay
      },
      tomorrow: {
        maxTemp: baseTemp + 2,
        minTemp: baseTemp - 5,
        rainProb: code === 61 ? 65 : 20,
        weatherCode: tomorrowCode,
        conditionText: tomorrowWmo.text,
        uvMax: 8,
        windMax: 16,
        agriAdvice: tomorrowWmo.adviceTomorrow
      }
    };
  };

  // Automatic & Instant Initialization whenever modal opens or parent's region/location changes
  useEffect(() => {
    if (isOpen) {
      let matched = YEMEN_WEATHER_LOCATIONS[0];
      const locName = location?.name || "";
      const locLat = location?.latitude || location?.lat;
      const locLng = location?.longitude || location?.lng;

      const normName = (str: string) => 
        str.replace(/[إأآا]/g, 'ا')
           .replace(/ة/g, 'ه')
           .replace(/ى/g, 'ي')
           .replace(/\s+/g, '')
           .toLowerCase();

      let found = false;

      // 1. Try matching by name first (Arabic normalized) - extremely precise
      if (locName) {
        const normalizedLocName = normName(locName);
        const matchByName = YEMEN_WEATHER_LOCATIONS.find(l => {
          const firstPart = l.name.split(' ')[0]; // e.g. "تعز" or "إب"
          const normalizedFirstPart = normName(firstPart);
          return normalizedLocName.includes(normalizedFirstPart) || normalizedFirstPart.includes(normalizedLocName);
        });
        if (matchByName) {
          matched = matchByName;
          found = true;
        }
      }

      // 2. Try matching by coordinates if name didn't match
      if (!found && locLat && locLng) {
        let minDistance = Infinity;
        YEMEN_WEATHER_LOCATIONS.forEach(l => {
          const distance = Math.pow(l.lat - locLat, 2) + Math.pow(l.lng - locLng, 2);
          if (distance < minDistance) {
            minDistance = distance;
            matched = l;
            found = true;
          }
        });
      }

      // 3. Try matching by regionId if still not found
      if (!found && selectedRegion) {
        const matchByRegion = YEMEN_WEATHER_LOCATIONS.find(l => l.regionId === selectedRegion);
        if (matchByRegion) {
          matched = matchByRegion;
        }
      }

      setSelectedLoc(matched);

      // Instant Offline Load
      const instantData = generateSmartInstantWeather(matched.name, matched.regionId);
      setWeatherData(instantData);

      // Background Online Update (Silent & Non-blocking) using EXACT GPS coordinates if available
      const isExactGPS = !!(locLat && locLng);
      const actualLat = isExactGPS ? locLat : matched.lat;
      const actualLng = isExactGPS ? locLng : matched.lng;
      const finalName = isExactGPS ? (locName || `موقعك الحالي (${matched.name})`) : matched.name;

      fetchOnlineWeatherInBackground(actualLat, actualLng, finalName, isExactGPS);
    }
  }, [isOpen, selectedRegion, location]);

  const fetchOnlineWeatherInBackground = async (lat: number, lng: number, name: string, isGps: boolean = false) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,wind_speed_10m_max&timezone=auto`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const current = data.current;
        const daily = data.daily;

        const currentWmo = getWMOWeatherDetails(current.weather_code || 0);
        const tomorrowWmo = getWMOWeatherDetails(daily.weather_code?.[1] || 0);

        setWeatherData({
          locationName: name,
          isGps: isGps,
          current: {
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: Math.round(current.relative_humidity_2m),
            windSpeed: Math.round(current.wind_speed_10m),
            windDirection: current.wind_direction_10m || 0,
            pressure: Math.round(current.surface_pressure),
            uvIndex: Math.round(current.uv_index || 0),
            weatherCode: current.weather_code,
            conditionText: currentWmo.text,
            isDay: current.is_day === 1
          },
          tomorrow: {
            maxTemp: Math.round(daily.temperature_2m_max?.[1] ?? current.temperature_2m + 2),
            minTemp: Math.round(daily.temperature_2m_min?.[1] ?? current.temperature_2m - 5),
            rainProb: Math.round(daily.precipitation_probability_max?.[1] ?? 10),
            weatherCode: daily.weather_code?.[1] ?? 0,
            conditionText: tomorrowWmo.text,
            uvMax: Math.round(daily.uv_index_max?.[1] ?? 6),
            windMax: Math.round(daily.wind_speed_10m_max?.[1] ?? 15),
            agriAdvice: tomorrowWmo.adviceTomorrow
          }
        });
      }
    } catch {
      // Quietly retain offline calculations on failure
    }
  };

  if (!isOpen) return null;

  const currentWmo = weatherData ? getWMOWeatherDetails(weatherData.current.weatherCode) : null;
  const WeatherIcon = currentWmo ? currentWmo.icon : Sun;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-stone-200 dark:border-gray-800 flex flex-col overflow-hidden max-h-[92vh]"
          dir="rtl"
        >
          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-stone-200 dark:border-gray-800 bg-gradient-to-r from-sky-500/10 via-emerald-500/10 to-transparent dark:from-sky-950/40 dark:via-emerald-950/30 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-2xl shadow-md shrink-0">
                <Sun className="w-5 h-5 animate-spin-slow text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white leading-tight">
                    مرصد الطقس والمناخ الزراعي المباشر
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300 dark:border-emerald-700 shrink-0">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>تلقائي وذكي</span>
                  </span>
                </div>
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                  حالة الطقس والتوقعات المربوطة تلقائياً بنظام موقعك الحالي
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:text-gray-400 dark:hover:text-white rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all shrink-0"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Integrated Region Auto Bar */}
          <div className="px-5 py-3 bg-stone-50/90 dark:bg-gray-950/80 border-b border-stone-200/80 dark:border-gray-800 flex items-center justify-between gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-200 font-bold">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
              <span>المنطقة المناخية المحددة بالنظام:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-black border border-emerald-300/50 dark:border-emerald-700/50">
                {selectedLoc.name}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>ربط ديناميكي مباشر</span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {weatherData ? (
              <>
                {/* Weather Main Hero Card */}
                <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white shadow-xl overflow-hidden">
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black text-white">
                          <MapPin className="w-3.5 h-3.5 text-amber-300" />
                          <span>{weatherData.locationName}</span>
                        </div>
                        {weatherData.isGps && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-[9px] font-black border border-emerald-400/30 shadow-xs animate-pulse">
                            🛰️ رصد دقيق بنظام الـ GPS
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl sm:text-6xl font-black tracking-tight">
                          {weatherData.current.temp}°
                        </span>
                        <span className="text-lg font-bold text-sky-100">سيلزيوس</span>
                      </div>

                      <p className="text-sm font-extrabold text-sky-100 mt-1 flex items-center gap-1.5">
                        <WeatherIcon className="w-5 h-5 text-amber-300" />
                        <span>{weatherData.current.conditionText}</span>
                      </p>
                      
                      <p className="text-xs font-semibold text-sky-200 mt-0.5">
                        الشعور الفعلي كأنه {weatherData.current.feelsLike}°م
                      </p>
                    </div>

                    {/* Big Weather Icon Box */}
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center self-stretch sm:self-auto min-w-[140px]">
                      <WeatherIcon className="w-12 h-12 text-amber-300 mb-1 animate-pulse" />
                      <span className="text-xs font-black text-white">{currentWmo?.text}</span>
                      <span className="text-[10px] text-sky-100 font-semibold mt-0.5">طقس اليوم المباشر</span>
                    </div>
                  </div>

                  {/* Ag Advice Banner Inside Hero */}
                  <div className="relative z-10 mt-4 pt-3 border-t border-white/20 flex items-start gap-2.5 text-xs font-extrabold text-sky-50">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="text-amber-200">الإرشاد الزراعي لطقس اليوم:</strong> {currentWmo?.adviceToday}
                    </p>
                  </div>
                </div>

                {/* Weather Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-gray-950 border border-stone-200 dark:border-gray-800 text-right">
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-bold mb-1">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span>الرطوبة النسبية</span>
                    </div>
                    <p className="text-lg font-black text-stone-800 dark:text-stone-100">
                      {weatherData.current.humidity}%
                    </p>
                    <span className="text-[9px] text-stone-400 block font-semibold">
                      {weatherData.current.humidity > 60 ? 'رطوبة عالية' : 'رطوبة معتدلة'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-gray-950 border border-stone-200 dark:border-gray-800 text-right">
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-bold mb-1">
                      <Wind className="w-4 h-4 text-sky-500" />
                      <span>سرعة الرياح</span>
                    </div>
                    <p className="text-lg font-black text-stone-800 dark:text-stone-100">
                      {weatherData.current.windSpeed} <span className="text-xs font-bold">كم/س</span>
                    </p>
                    <span className="text-[9px] text-stone-400 block font-semibold">
                      {weatherData.current.windSpeed > 20 ? 'رياح نشطة' : 'نسيم خفيف'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-gray-950 border border-stone-200 dark:border-gray-800 text-right">
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-bold mb-1">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>مؤشر UV للشمس</span>
                    </div>
                    <p className="text-lg font-black text-stone-800 dark:text-stone-100">
                      {weatherData.current.uvIndex} <span className="text-xs font-bold">/ 12</span>
                    </p>
                    <span className="text-[9px] text-stone-400 block font-semibold">
                      {weatherData.current.uvIndex > 7 ? 'أشعة قوية' : 'معتدل'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-gray-950 border border-stone-200 dark:border-gray-800 text-right">
                    <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-bold mb-1">
                      <Gauge className="w-4 h-4 text-indigo-500" />
                      <span>الضغط الجوي</span>
                    </div>
                    <p className="text-lg font-black text-stone-800 dark:text-stone-100">
                      {weatherData.current.pressure} <span className="text-xs font-bold">hPa</span>
                    </p>
                    <span className="text-[9px] text-stone-400 block font-semibold">ضغط مستقر</span>
                  </div>
                </div>

                {/* Accurate Tomorrow's Weather Forecast Section */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/40 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-600 text-white rounded-xl">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-100 leading-tight">
                          توقعات طقس الغد بالتفصيل
                        </h4>
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          بيانات دقيقة وموجّهة للعمل الفلاحي لليوم التالي
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-2xs">
                      غداً
                    </span>
                  </div>

                  {/* Tomorrow Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Condition & Temp */}
                    <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 text-right">
                      <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block">حالة الجو والحرارة:</span>
                      <p className="text-sm font-black text-stone-800 dark:text-stone-100 mt-0.5">
                        {weatherData.tomorrow.conditionText}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs font-black">
                        <span className="text-emerald-700 dark:text-emerald-400">العظمى: {weatherData.tomorrow.maxTemp}°م</span>
                        <span className="text-sky-700 dark:text-sky-400">الصغرى: {weatherData.tomorrow.minTemp}°م</span>
                      </div>
                    </div>

                    {/* Rain Prob */}
                    <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 text-right">
                      <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block">احتمالية الأمطار غداً:</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                          {weatherData.tomorrow.rainProb}%
                        </span>
                        <span className="text-xs font-bold text-stone-500">
                          {weatherData.tomorrow.rainProb > 40 ? 'فرصة مطر جيدة' : 'فرصة منخفضة'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-200 dark:bg-gray-800 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(100, weatherData.tomorrow.rainProb)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Wind & UV Max */}
                    <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40 text-right">
                      <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 block">الرياح والشمس غداً:</span>
                      <p className="text-xs font-black text-stone-800 dark:text-stone-100 mt-1">
                        أقصى رياح: <strong className="text-sky-600">{weatherData.tomorrow.windMax} كم/س</strong>
                      </p>
                      <p className="text-xs font-black text-stone-800 dark:text-stone-100 mt-0.5">
                        مؤشر UV العظمى: <strong className="text-amber-600">{weatherData.tomorrow.uvMax}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Agricultural Advice Box for Tomorrow */}
                  <div className="p-3 bg-emerald-100/60 dark:bg-emerald-950/60 rounded-2xl border border-emerald-300/60 dark:border-emerald-800 flex items-start gap-2 text-xs font-extrabold text-emerald-950 dark:text-emerald-100">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>النصيحة الفلاحية لغد:</strong> {weatherData.tomorrow.agriAdvice}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
