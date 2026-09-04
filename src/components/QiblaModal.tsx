import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Compass, MapPin, AlertCircle, CheckCircle2, Navigation, 
  RotateCcw, Shield, ChevronDown, RefreshCw, Crosshair, Globe, 
  Smartphone, Info, Gauge, Layers, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coordinates, Qibla } from 'adhan';
import { UserSettings } from '../types';
import { LocationService } from '../services/locationService';

interface QiblaModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

// قائمة المدن البارزة مع الإحداثيات الدقيقة
const POPULAR_CITIES = [
  { name: 'صنعاء، اليمن', lat: 15.3694, lon: 44.1910 },
  { name: 'عدن، اليمن', lat: 12.7855, lon: 45.0187 },
  { name: 'تعز، اليمن', lat: 13.5795, lon: 44.0109 },
  { name: 'الحديدة، اليمن', lat: 14.7978, lon: 42.9545 },
  { name: 'إب، اليمن', lat: 13.9667, lon: 44.1833 },
  { name: 'المكلا، اليمن', lat: 14.5425, lon: 49.1242 },
  { name: 'مكة المكرمة، السعودية', lat: 21.4225, lon: 39.8262 },
  { name: 'الرياض، السعودية', lat: 24.7136, lon: 46.6753 },
  { name: 'المدينة المنورة، السعودية', lat: 24.5247, lon: 39.5692 },
  { name: 'جدة، السعودية', lat: 21.5433, lon: 39.1728 },
  { name: 'القاهرة، مصر', lat: 30.0444, lon: 31.2357 },
  { name: 'دبي، الإمارات', lat: 25.2048, lon: 55.2708 },
  { name: 'عمان، الأردن', lat: 31.9454, lon: 35.9284 },
  { name: 'الرباط، المغرب', lat: 34.0209, lon: -6.8416 },
  { name: 'الكويت، الكويت', lat: 29.3759, lon: 47.9774 },
  { name: 'الدوحة، قطر', lat: 25.2854, lon: 51.5310 },
  { name: 'مسقط، عمان', lat: 23.5880, lon: 58.3829 },
  { name: 'بغداد، العراق', lat: 33.3152, lon: 44.3661 },
  { name: 'دمشق، سوريا', lat: 33.5138, lon: 36.2765 },
  { name: 'الجزائر، الجزائر', lat: 36.7538, lon: 3.0588 },
  { name: 'تونس، تونس', lat: 36.8065, lon: 10.1815 },
  { name: 'إسطنبول، تركيا', lat: 41.0082, lon: 28.9784 },
];

// حساب القبلة الرياضي الدقيق لجميع مناطق العالم (Great Circle Bearing Formula)
const calculateExactQibla = (lat: number, lon: number): number => {
  const MAKKAH_LAT = 21.422487;
  const MAKKAH_LON = 39.826206;

  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lon * Math.PI) / 180;
  const phi2 = (MAKKAH_LAT * Math.PI) / 180;
  const lambda2 = (MAKKAH_LON * Math.PI) / 180;

  const dLambda = lambda2 - lambda1;

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round(((bearing + 360) % 360) * 10) / 10;
};

// حساب المسافة المباشرة إلى مكة المكرمة بالكيلومترات (Haversine Formula)
const calculateDistanceToMakkah = (lat: number, lon: number): number => {
  const R = 6371; // Earth's radius in km
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;
  
  const dLat = (kaabaLat - lat) * (Math.PI / 180);
  const dLon = (kaabaLon - lon) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat * (Math.PI / 180)) * Math.cos(kaabaLat * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// تحويل الدرجات إلى الجهة الأصلية باللغة العربية
const getDirectionNameArabic = (degree: number): string => {
  const norm = (degree % 360 + 360) % 360;
  if (norm >= 337.5 || norm < 22.5) return 'الشمال';
  if (norm >= 22.5 && norm < 67.5) return 'الشمال الشرقي';
  if (norm >= 67.5 && norm < 112.5) return 'الشرق';
  if (norm >= 112.5 && norm < 157.5) return 'الجنوب الشرقي';
  if (norm >= 157.5 && norm < 202.5) return 'الجنوب';
  if (norm >= 202.5 && norm < 247.5) return 'الجنوب الغربي';
  if (norm >= 247.5 && norm < 292.5) return 'الغرب';
  if (norm >= 292.5 && norm < 337.5) return 'الشمال الغربي';
  return 'الشمال';
};

export const QiblaModal: React.FC<QiblaModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdateSettings 
}) => {
  // حالة النظام والمود الحلي (sensor = البوصلة التلقائية، location = تحديد الخيار الثاني عبر الموقع والمدينة)
  const [activeTab, setActiveTab] = useState<'sensor' | 'location'>('sensor');
  
  // حالة المستشعر الحساس: 'detecting' | 'available' | 'unsupported' | 'permission_required' | 'denied'
  const [sensorStatus, setSensorStatus] = useState<'detecting' | 'available' | 'unsupported' | 'permission_required' | 'denied'>('detecting');
  
  // بيانات البوصلة
  const [rawHeading, setRawHeading] = useState<number>(0);
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [distanceToMakkah, setDistanceToMakkah] = useState<number | null>(null);
  const [isAligned, setIsAligned] = useState<boolean>(false);
  const [magneticDeclination, setMagneticDeclination] = useState<number>(0);
  
  // ميزان استواء السطح (Bubble Level using Pitch & Roll)
  const [tilt, setTilt] = useState<{ pitch: number; roll: number; isLevel: boolean }>({ pitch: 0, roll: 0, isLevel: true });
  
  // بيانات الموقع والمدينة
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>('جاري تحديد الموقع...');
  const [isUsingGPS, setIsUsingGPS] = useState<boolean>(false);
  const [isRequestingGPS, setIsRequestingGPS] = useState<boolean>(false);
  const [showCitySelector, setShowCitySelector] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showCalibrationGuide, setShowCalibrationGuide] = useState<boolean>(false);

  const lastVibrationRef = useRef<number>(0);
  const isAbsoluteAvailableRef = useRef<boolean>(false);
  const hasReceivedSensorDataRef = useRef<boolean>(false);
  const lastHeadingRef = useRef<number | null>(null);

  // Refs to avoid infinite useEffect re-render loops when settings change
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const onUpdateSettingsRef = useRef(onUpdateSettings);
  useEffect(() => {
    onUpdateSettingsRef.current = onUpdateSettings;
  }, [onUpdateSettings]);

  // حساب الانحراف الجغرافي المغناطيسي تلقائياً بناءً على إحداثيات الموقع (Magnetic Declination)
  const calculateMagneticDeclination = useCallback((lat: number, lon: number): number => {
    const radLat = (lat * Math.PI) / 180;
    const radLon = (lon * Math.PI) / 180;
    const decl = Math.sin(radLon - 0.15) * 8.5 * Math.cos(radLat);
    return Math.round(decl * 10) / 10;
  }, []);

  // 1. خوارزمية التطابق والتنبيه الاهتزازي عند محاذاة القبلة بدقة متناهية
  useEffect(() => {
    if (qiblaDirection !== null && sensorStatus === 'available' && activeTab === 'sensor') {
      const diff = Math.abs(rawHeading - qiblaDirection);
      const shortestDiff = Math.min(diff, 360 - diff);
      
      const aligned = shortestDiff < 3.0; // نطاق التطابق الدقيق ±3.0 درجات
      if (aligned !== isAligned) {
        if (aligned) {
          const now = Date.now();
          if (navigator.vibrate && now - lastVibrationRef.current > 1500) {
            navigator.vibrate([120, 60, 120]);
            lastVibrationRef.current = now;
          }
        }
        setIsAligned(aligned);
      }
    } else {
      if (isAligned) setIsAligned(false);
    }
  }, [rawHeading, qiblaDirection, isAligned, sensorStatus, activeTab]);

  // 3. تحديث الإحداثيات وحساب زاوية القبلة والميل المغناطيسي
  const updateLocationData = useCallback((lat: number, lon: number, name: string = 'موقعك الحالي', isGPS: boolean = false) => {
    if (isNaN(lat) || isNaN(lon)) return;
    
    const calculatedQibla = calculateExactQibla(lat, lon);
    const calculatedDist = calculateDistanceToMakkah(lat, lon);
    const calculatedDecl = calculateMagneticDeclination(lat, lon);
    
    setQiblaDirection(calculatedQibla);
    setDistanceToMakkah(calculatedDist);
    setMagneticDeclination(calculatedDecl);
    setCurrentCoords({ lat, lon });
    setCurrentLocationName(name);
    setIsUsingGPS(isGPS);

    // حفظ الموقع المسترجع في إعدادات المستخدم لاستعادته مستقبلاً بدون تكرار
    const currentSettings = settingsRef.current;
    if (currentSettings && (currentSettings.location?.latitude !== lat || currentSettings.location?.longitude !== lon)) {
      onUpdateSettingsRef.current({
        ...currentSettings,
        location: {
          latitude: lat,
          longitude: lon,
          name: name
        }
      });
    }
  }, []);

  // 4. جلب إحداثيات الموقع (GPS / IP / Saved)
  const fetchLocation = useCallback(async (useGPS: boolean = false) => {
    if (useGPS) {
      setIsRequestingGPS(true);
    }
    setLocationError(null);

    const currentSettings = settingsRef.current;

    // أ) الموقع المحفوظ أولاً
    if (!useGPS && currentSettings?.location?.latitude && currentSettings?.location?.longitude) {
      const { latitude, longitude, name } = currentSettings.location;
      updateLocationData(latitude, longitude, name || 'موقع محفوظ', false);
      return;
    }

    try {
      const loc = await LocationService.autoDetectLocation(useGPS);
      if (loc) {
        updateLocationData(loc.latitude, loc.longitude, loc.name || 'موقع محدد تلقائياً', useGPS);
      }
    } catch (e) {
      console.warn("Location detection error in Qibla modal:", e);
      setLocationError("تعذر تحديد الموقع بدقة، تم استخدام التحديد التلقائي التقريبي.");
    } finally {
      setIsRequestingGPS(false);
    }
  }, [updateLocationData]);

  // 5. معالج مستشعرات الاتجاه والحركة (DeviceOrientation)
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // استخراج الزوايا لمعايرة ميزان الاستواء للسطح (Pitch & Roll)
    const beta = event.beta || 0;   // الإمالة للأمام/الخلف
    const gamma = event.gamma || 0; // الإمالة لليمن/اليسار
    const isLevel = Math.abs(beta) < 18 && Math.abs(gamma) < 18;
    setTilt({ pitch: beta, roll: gamma, isLevel });

    // فحص ما إذا كان الحدث صادرًا من مستشعر بوصلة مغناطيسية حقيقي ومطلق (Magnetic Absolute)
    const isIOSCompass = (event as any).webkitCompassHeading !== undefined && (event as any).webkitCompassHeading !== null;
    const isAbsoluteW3C = event.type === 'deviceorientationabsolute' || event.absolute === true;

    // تجاهل الأحداث النسبية العادية (التي تعتمد على وضعية الهاتف لحظة الفتح وتسبب خطأ القبلة)
    if (!isIOSCompass && !isAbsoluteW3C) {
      return;
    }

    hasReceivedSensorDataRef.current = true;
    isAbsoluteAvailableRef.current = true;

    let headingValue: number | null = null;
    
    // أجهزة أبل (iOS Safari)
    if (isIOSCompass) {
      headingValue = (event as any).webkitCompassHeading;
    } 
    // أجهزة أندرويد و W3C Standard (Absolute Magnetic Compass)
    else if (event.alpha !== null && event.alpha !== undefined) {
      const screenAngle = (window.screen?.orientation?.angle) || (window.orientation as number) || 0;
      let h = (360 - event.alpha) % 360;
      h = (h + screenAngle + 360) % 360;
      headingValue = h;
    }

    if (headingValue !== null && !isNaN(headingValue)) {
      if (lastHeadingRef.current === null) {
        lastHeadingRef.current = headingValue;
      } else {
        let diff = (headingValue - lastHeadingRef.current) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;

        const absDiff = Math.abs(diff);
        if (absDiff < 0.2) {
          headingValue = lastHeadingRef.current;
        } else {
          // معامل تنعيم ديناميكي: استجابة سريعة عند التدوير السريع، وتنعيم فائق لمنع الارتجاف عند الحركة البطيئة
          const factor = absDiff > 15 ? 0.6 : absDiff > 5 ? 0.35 : 0.18;
          headingValue = (lastHeadingRef.current + diff * factor + 360) % 360;
          lastHeadingRef.current = headingValue;
        }
      }

      setRawHeading(headingValue);
      setSensorStatus('available');
    }
  }, []);

  // طلب إذن البوصلة لـ iOS
  const requestIOSPermission = async () => {
    const orientationEvent = DeviceOrientationEvent as any;
    if (typeof orientationEvent.requestPermission === 'function') {
      try {
        const permissionState = await orientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setSensorStatus('detecting');
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setSensorStatus('denied');
          setActiveTab('location');
        }
      } catch (error) {
        console.error("Permission request error:", error);
        setSensorStatus('denied');
        setActiveTab('location');
      }
    }
  };

  // 6. تهيئة وإغلاق المودال
  useEffect(() => {
    let timer: any = null;

    if (isOpen) {
      fetchLocation(false);
      hasReceivedSensorDataRef.current = false;
      isAbsoluteAvailableRef.current = false;

      // فحص أجهزة iOS التي تتطلب إذن صريح
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        setSensorStatus('permission_required');
      } else {
        setSensorStatus('detecting');
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        window.addEventListener('deviceorientation', handleOrientation, true);

        // مؤقت ذكي لمدة 1.8 ثانية للتأكد مما إذا كان الجهاز يمتلك مستشعر بوصلة مغناطيسية حقيقي أم لا
        timer = setTimeout(() => {
          if (!hasReceivedSensorDataRef.current) {
            setSensorStatus('unsupported');
            // تنبيه المستخدم وتفعيل خيار تحديد القبلة عبر الموقع تلقائيًا كخيار بديل مع التنبيه
            setActiveTab('location');
          }
        }, 1800);
      }
    } else {
      // إعادة ضبط جميع الحالات عند إغلاق النوافذ
      lastHeadingRef.current = null;
      setRawHeading(0);
      setQiblaDirection(null);
      setIsAligned(false);
      setShowCitySelector(false);
      setLocationError(null);
      setShowCalibrationGuide(false);
      setSensorStatus('detecting');
      setActiveTab('sensor');
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [isOpen, fetchLocation, handleOrientation]);

  // حساب أقصر مسار للدوران لتجنب الدوران المفاجئ 360 درجة عند تجاوز النقطة صفر
  const getShortestRotation = (current: number, target: number): number => {
    let diff = (target - current) % 360;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return current + diff;
  };

  // الاحتفاظ بالزاوية المستمرة لمؤشر اتجاه الهاتف لمنع القفزات عند الدوران
  const pointerRotationRef = useRef<number>(0);

  // دوران مؤشر اتجاه الهاتف بالنسبة للجهات الأصلية الثابتة
  const headingRotation = getShortestRotation(pointerRotationRef.current, rawHeading);
  pointerRotationRef.current = headingRotation;

  const qiblaCardinal = qiblaDirection !== null ? getDirectionNameArabic(qiblaDirection) : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="qibla-modal-backdrop"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div 
            key="qibla-modal-container"
            initial={{ scale: 0.92, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.92, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-5 sm:p-6 shadow-2xl flex flex-col items-center border border-slate-100 relative overflow-hidden my-auto max-h-[94vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* هالة نجاح توجيه القبلة */}
            <div className={`absolute top-0 left-0 w-full h-2 rounded-t-[2.5rem] transition-all duration-500 pointer-events-none ${isAligned ? 'bg-emerald-500 shadow-[0_4px_20px_rgba(16,185,129,0.6)]' : 'bg-transparent'}`}></div>
            
            {/* Header / الترويسة */}
            <div className="w-full flex justify-between items-center mb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[var(--color-gold)] flex items-center justify-center border border-amber-200/60 shadow-sm">
                  <Compass size={22} className="animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">اتجاه القبلة والبوصلة</h2>
                  {qiblaDirection !== null && (
                    <p className="text-xs text-slate-500 font-bold">
                      زاويتك: <span className="text-[var(--color-primary)] font-black">{Math.round(qiblaDirection)}°</span> ({qiblaCardinal})
                      {distanceToMakkah && <span className="text-[10px] text-slate-400 font-normal mr-1">({distanceToMakkah.toLocaleString('ar-SA')} كم للمكة)</span>}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs (البوصلة المباشرة vs الخيار الثاني للموقع والمدينة) */}
            <div className="w-full bg-slate-100 p-1 rounded-2xl flex mb-4 border border-slate-200/60">
              <button
                onClick={() => {
                  if (sensorStatus === 'unsupported' || sensorStatus === 'denied') {
                    // تنبيه عند الضغط على المستشعر وهو غير مدعوم
                    alert("تنبيه: هذا الجهاز لا يدعم مستشعر البوصلة المغناطيسية المباشرة. يمكنك استخدام الخيار الثاني تحديد القبلة عبر الموقع والمدينة.");
                    return;
                  }
                  setActiveTab('sensor');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'sensor' 
                    ? 'bg-white text-slate-900 shadow-md border border-slate-200/80' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone size={15} className={activeTab === 'sensor' ? 'text-[var(--color-primary)]' : ''} />
                <span>البوصلة المباشرة</span>
                {sensorStatus === 'available' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
              </button>

              <button
                onClick={() => setActiveTab('location')}
                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'location' 
                    ? 'bg-white text-slate-900 shadow-md border border-slate-200/80' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin size={15} className={activeTab === 'location' ? 'text-amber-500' : ''} />
                <span>الخيار الثاني (الموقع)</span>
              </button>
            </div>

            {/* MAIN CONTENT TAB 1: Live Hardware Sensor Compass (المستشعر المباشر) */}
            {activeTab === 'sensor' && (
              <div className="w-full flex flex-col items-center">
                {/* تنبيه خفيف وجميل عند دعم مستشعر البوصلة في الجهاز */}
                {sensorStatus === 'available' && (
                  <div className="w-full bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-2.5 mb-3 text-right flex items-center gap-2.5 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Smartphone size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-xs text-emerald-950">
                        مستشعر البوصلة المباشر نشط
                      </p>
                      <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                        يتم تحديد الاتجاه تلقائياً عبر المستشعر الحساس عند تدوير الهاتف وعلى سطح مستوٍ.
                      </p>
                    </div>
                  </div>
                )}

                {/* حالة iOS Requesting Permission */}
                {sensorStatus === 'permission_required' && (
                  <div className="py-8 px-4 text-center flex flex-col items-center gap-4 bg-slate-50 rounded-3xl border border-slate-200/80 w-full mb-4">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200">
                      <Shield size={32} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base mb-1">تفعيل مستشعر البوصلة</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        يتطلب هذا الجهاز إذنًا صريحًا للوصول لمستشعر الاتجاه والمغناطيسية لتحديد القبلة تلقائياً.
                      </p>
                      <button
                        onClick={requestIOSPermission}
                        className="w-full py-3 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-xs shadow-md hover:bg-[var(--color-primary-dark)] transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield size={16} />
                        <span>منح الإذن الآن</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* حالة المستشعر غير متوفر أو مرفوض - تنبيه وشرح الخيار الثاني */}
                {(sensorStatus === 'unsupported' || sensorStatus === 'denied') && (
                  <div className="w-full bg-amber-50 border border-amber-200/90 rounded-2xl p-4 mb-4 text-right shadow-sm">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-black text-xs text-amber-950 mb-1">
                          تنويه: هذا الجهاز لا يدعم مستشعر البوصلة المباشر
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          يبدو أن هذا الجهاز أو المتصفح لا يحتوي على مستشعر بوصلة مغناطيسية حية. يرجى استخدام <strong>الخيار الثاني (تحديد القبلة عبر الموقع والمدينة)</strong> لحساب الاتجاه والزاوية بدقة عالية.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('location')}
                      className="mt-3 w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MapPin size={15} />
                      <span>الانتقال للخيار الثاني (الموقع والمدينة)</span>
                    </button>
                  </div>
                )}

                {/* حالة البحث عن المستشعر */}
                {sensorStatus === 'detecting' && (
                  <div className="h-[280px] flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
                      <div className="absolute inset-0 w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <Smartphone className="absolute inset-0 m-auto text-amber-600 animate-pulse" size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">جاري الاتصال بمستشعر الجهاز الحساس...</p>
                  </div>
                )}

                {/* حالة المستشعر يعمل بنجاح (Sensors Active) */}
                {sensorStatus === 'available' && (
                  <>
                    {/* ميزان استواء السطح (Surface Level Bubble Indicator) */}
                    <div className={`w-full p-2 rounded-xl mb-2 flex items-center justify-between text-[11px] font-bold border transition-colors ${
                      tilt.isLevel 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Gauge size={15} className={tilt.isLevel ? 'text-emerald-600' : 'text-amber-600'} />
                        <span>
                          {tilt.isLevel 
                            ? 'الهاتف على سطح مستوٍ تماماً (دقة عالية)' 
                            : 'ضع الهاتف أفقياً على سطح مستوٍ لدقة البوصلة'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                        <span>الإمالة: {Math.round(Math.max(Math.abs(tilt.pitch), Math.abs(tilt.roll)))}°</span>
                      </div>
                    </div>

                    {/* شريط اتجاه القبلة الجغرافي الصريح والواضح للموقع */}
                    <div className="w-full p-2.5 rounded-2xl mb-2 flex items-center justify-between text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-slate-800 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-sm">
                          <Compass size={18} />
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-slate-500 font-bold">القبلة من موقعك ({currentLocationName}):</span>
                          <span className="text-xs font-black text-amber-900">
                            اتجاه {qiblaCardinal} ({qiblaDirection !== null ? Math.round(qiblaDirection) : '--'}°)
                          </span>
                        </div>
                      </div>
                      {distanceToMakkah && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-white/90 px-2.5 py-1 rounded-xl border border-amber-200/80 shadow-2xs">
                          {distanceToMakkah.toLocaleString('ar-SA')} كم
                        </span>
                      )}
                    </div>

                    {/* شريط الدقة والجغرافيا المباشرة */}
                    <div className={`w-full p-2 rounded-xl mb-2 flex items-center justify-between text-[11px] font-bold border transition-all ${
                      isAligned
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Sparkles size={15} className={isAligned ? 'text-emerald-600 animate-pulse' : 'text-amber-600'} />
                        <span>
                          {isAligned
                            ? 'أنت باتجاه القبلة الصحيح تماماً 🎯'
                            : 'توجيه جغرافي حقيقي مباشر ومستقر'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                        {isAligned ? 'متطابق' : 'نشط'}
                      </span>
                    </div>

                    {/* قرص البوصلة التفاعلي ثلاثي الأبعاد */}
                    <div className="relative w-72 h-72 flex items-center justify-center my-2 select-none touch-none">
                      {/* هالة توهج عند تطابق القبلة */}
                      <AnimatePresence>
                        {isAligned && (
                          <motion.div 
                            key="qibla-aligned-glow"
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 blur-xl opacity-50"
                          />
                        )}
                      </AnimatePresence>

                      {/* إطار البوصلة الخارجي الملكي */}
                      <div className={`absolute inset-0 rounded-full border-[6px] border-amber-500/90 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 shadow-[0_15px_35px_rgba(4,47,31,0.4)] transition-all duration-500 ${
                        isAligned ? 'ring-[10px] ring-emerald-500/35 border-amber-400 shadow-[0_0_40px_rgba(16,185,129,0.4)]' : 'ring-4 ring-amber-500/10'
                      }`}>
                        <div className="absolute inset-1 rounded-full border border-amber-300/30"></div>
                        <div className="absolute inset-2 rounded-full border border-dashed border-amber-400/20"></div>
                      </div>
                      
                      {/* علامات الدرجات الثابتة */}
                      <div className="absolute inset-3 pointer-events-none opacity-40">
                        {[...Array(72)].map((_, i) => (
                          <div key={i} className="absolute w-full h-full flex justify-center" style={{ rotate: `${i * 5}deg` }}>
                            <div className={`w-[1px] ${i % 9 === 0 ? 'h-3.5 bg-amber-400' : i % 3 === 0 ? 'h-2.5 bg-amber-400/60' : 'h-1.5 bg-amber-300/30'}`}></div>
                          </div>
                        ))}
                      </div>

                      {/* وجه البوصلة الثابت بالجهات الأصلية المستقرة (شمال، شرق، جنوب، غرب) */}
                      <div className="absolute w-56 h-56 rounded-full bg-gradient-to-b from-emerald-950 to-slate-950 shadow-[inset_0_4px_12px_rgba(0,0,0,0.7)] flex items-center justify-center overflow-hidden">
                        {/* زخرفة إسلامية خلفية */}
                        <svg className="absolute w-44 h-44 text-amber-400/10 pointer-events-none" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                          <rect x="23" y="23" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="0.6" />
                          <rect x="23" y="23" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="0.6" transform="rotate(45 50 50)" />
                        </svg>

                        {/* الجهات الأصلية الأربع باللغة العربية */}
                        <div className="absolute top-3 flex flex-col items-center">
                          <span className="font-black text-amber-400 text-base leading-none">ش</span>
                          <span className="text-[6px] text-amber-300/60 font-bold">شمال</span>
                        </div>
                        <div className="absolute bottom-3 flex flex-col items-center">
                          <span className="font-black text-amber-200/80 text-base leading-none">ج</span>
                          <span className="text-[6px] text-amber-300/40 font-bold">جنوب</span>
                        </div>
                        <div className="absolute right-3 flex flex-col items-center">
                          <span className="font-black text-amber-200/80 text-base leading-none">ق</span>
                          <span className="text-[6px] text-amber-300/40 font-bold">شرق</span>
                        </div>
                        <div className="absolute left-3 flex flex-col items-center">
                          <span className="font-black text-amber-200/80 text-base leading-none">غ</span>
                          <span className="text-[6px] text-amber-300/40 font-bold">غرب</span>
                        </div>
                      </div>

                      {/* شارة زاوية البوصلة المباشرة */}
                      <div className="absolute bottom-10 bg-slate-950/90 backdrop-blur-md px-3 py-0.5 rounded-full border border-amber-500/40 shadow-md z-20">
                        <span className="text-[11px] font-black text-amber-400 tracking-wider">
                          {Math.round(rawHeading)}°
                        </span>
                      </div>

                      {/* target القبلة الجغرافي المستقر على وجه البوصلة (في الزاوية الصحيحة مثل الشمال الغربي) */}
                      {qiblaDirection !== null && (
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-start pointer-events-none p-2 z-20"
                          style={{ transform: `rotate(${qiblaDirection}deg)` }}
                        >
                          <div className="flex flex-col items-center relative top-2">
                            <motion.div 
                              animate={isAligned ? { scale: [1, 1.15, 1] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              className={`w-11 h-11 rounded-full shadow-2xl border-2 flex items-center justify-center transition-all duration-500 ${
                                isAligned ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-amber-300 shadow-emerald-500/60 ring-4 ring-emerald-400/50' : 'bg-gradient-to-br from-slate-900 via-amber-950 to-slate-950 border-amber-400 shadow-amber-500/30'
                              }`}
                            >
                              <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="18" fill="none" stroke={isAligned ? "#34D399" : "#FBBF24"} strokeWidth="0.75" strokeDasharray="2,2" />
                                <path d="M20 10 L10 14 L10 27 L20 23 Z" fill="#18181B" stroke="#FBBF24" strokeWidth="0.5" />
                                <path d="M20 10 L30 14 L30 27 L20 23 Z" fill="#27272A" stroke="#FBBF24" strokeWidth="0.5" />
                                <path d="M20 10 L30 14 L20 18 L10 14 Z" fill="#3F3F46" stroke="#FBBF24" strokeWidth="0.5" />
                                <path d="M10 18.5 L20 14.5 L30 18.5" fill="none" stroke="#FBBF24" strokeWidth="1.5" />
                                <path d="M13.5 19 L17 17.5 L17 23.5 L13.5 25 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="0.5" />
                              </svg>
                            </motion.div>
                            <span className="text-[9px] font-black text-amber-300 bg-slate-950/90 px-1.5 py-0.5 rounded-full mt-1 border border-amber-500/40 shadow-sm whitespace-nowrap">
                              القبلة ({Math.round(qiblaDirection)}°)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* مؤشر اتجاه الهاتف الحركي المباشر (يدور مع اتجاه رأس الجهاز) */}
                      <motion.div 
                        className="absolute inset-0 flex flex-col items-center justify-start z-30 pointer-events-none p-2"
                        animate={{ rotate: headingRotation }}
                        transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.8 }}
                      >
                        <div className="flex flex-col items-center relative top-2">
                          <div className={`w-10 h-10 rounded-full border-2 shadow-2xl flex items-center justify-center transition-all duration-300 ${
                            isAligned 
                              ? 'bg-emerald-400 text-slate-950 border-amber-300 shadow-emerald-500/80 scale-110' 
                              : 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 border-amber-200 shadow-amber-500/50'
                          }`}>
                            <Navigation size={20} className="fill-current rotate-0" />
                          </div>
                          <div className={`w-1 h-28 rounded-full mt-1 transition-all duration-500 bg-gradient-to-b ${
                            isAligned ? 'from-emerald-400 via-amber-300 to-transparent' : 'from-amber-400 via-amber-500/30 to-transparent'
                          }`}></div>
                        </div>
                      </motion.div>

                      {/* المحور المركزي للبوصلة */}
                      <div className="absolute w-6 h-6 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 rounded-full shadow-md z-30 flex items-center justify-center border border-amber-200">
                        <div className="w-2 h-2 bg-emerald-950 rounded-full"></div>
                      </div>
                    </div>

                    {/* بطاقة الحالة والنتيجة */}
                    <div className="w-full mt-2">
                      <div className={`p-3.5 rounded-2xl border transition-all duration-500 shadow-sm ${
                        isAligned 
                          ? 'bg-gradient-to-r from-emerald-950 to-emerald-900 border-amber-500/60 text-white' 
                          : 'bg-slate-50 border-slate-200/80'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                            isAligned ? 'bg-amber-400 text-emerald-950 shadow-md' : 'bg-slate-800 text-slate-100'
                          }`}>
                            {isAligned ? <CheckCircle2 size={20} className="stroke-[2.5]" /> : <Navigation size={20} className="rotate-45" />}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-black text-sm ${isAligned ? 'text-amber-400' : 'text-slate-900'}`}>
                              {isAligned ? 'تم توجيه القبلة بنجاح!' : 'قم بتدوير الهاتف نحو الكعبة'}
                            </h4>
                            <p className={`text-xs leading-relaxed ${isAligned ? 'text-emerald-100 font-medium' : 'text-slate-500'}`}>
                              {isAligned 
                                ? 'أنت الآن باتجاه الكعبة المشرفة تماماً. تقبل الله طاعتكم.' 
                                : 'حرك هاتفك ببطء في حركة دائرية حتى تتطابق إبرة الكعبة مع المؤشر العلوي.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* MAIN CONTENT TAB 2: Location & GPS Fallback Mode (الخيار الثاني عبر الموقع والمدينة) */}
            {activeTab === 'location' && (
              <div className="w-full flex flex-col items-center">
                {/* شريط معلومات موقع المدينة المعين حالياً */}
                <div className="w-full bg-slate-50 rounded-2xl p-2.5 border border-slate-200/70 mb-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MapPin size={16} className={isUsingGPS ? 'text-emerald-600 shrink-0' : 'text-amber-500 shrink-0'} />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate leading-snug">{currentLocationName}</p>
                      {currentCoords && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          خط العرض: {currentCoords.lat.toFixed(2)}° | الطول: {currentCoords.lon.toFixed(2)}°
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => setShowCitySelector(!showCitySelector)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-[11px] hover:bg-slate-100 flex items-center gap-1 shadow-sm"
                    >
                      <Globe size={12} className="text-amber-600" />
                      <span>تغيير المدينة</span>
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>

                {/* قائمة اختيار المدينة المباشرة */}
                <AnimatePresence>
                  {showCitySelector && (
                    <motion.div 
                      key="qibla-city-selector"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full bg-slate-900 text-white rounded-2xl p-4 mb-3 shadow-xl border border-slate-800 overflow-hidden"
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                          <Globe size={14} /> اختر مدينتك للحساب الدقيق:
                        </span>
                        <button onClick={() => setShowCitySelector(false)} className="text-slate-400 hover:text-white p-1">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                        {POPULAR_CITIES.map((city, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              updateLocationData(city.lat, city.lon, city.name, false);
                              setShowCitySelector(false);
                            }}
                            className="text-right text-xs p-2 rounded-xl bg-slate-800/90 hover:bg-amber-500 hover:text-slate-950 font-bold transition-colors truncate border border-slate-700/50"
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* تنبيه واضح أن هذا هو الخيار الثاني البديل */}
                <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 text-right">
                  <div className="flex items-start gap-2.5">
                    <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-black text-xs text-slate-900">
                        الخيار الثاني: تحديد اتجاه القبلة عبر الموقع والمدينة
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        يتم حساب الزاوية الجغرافية الدقيقة بالكيلومترات والدرجات بالنسبة للشمال الحقيقي لموقعك.
                      </p>
                    </div>
                  </div>
                </div>

                {/* بطاقة نتيجة زاوية القبلة والمسافة */}
                <div className="w-full bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 mb-4 shadow-xl border border-amber-500/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">زاوية القبلة بالنسبة للشمال الحقيقي</span>
                      <p className="text-2xl font-black text-white mt-0.5">
                        {qiblaDirection !== null ? Math.round(qiblaDirection) : 0}°
                        <span className="text-sm font-bold text-amber-300 mr-2">({qiblaCardinal})</span>
                      </p>
                    </div>
                    {distanceToMakkah && (
                      <div className="text-left bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10">
                        <span className="text-[9px] text-slate-300 block font-medium">المسافة للكعبة</span>
                        <span className="text-xs font-black text-amber-400">{distanceToMakkah.toLocaleString('ar-SA')} كم</span>
                      </div>
                    )}
                  </div>

                  {/* رسم توضيحي ثنائي الأبعاد مخصص لمؤشر القبلة بالنسبة للشمال */}
                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-2">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/30 flex items-center justify-center">
                      <div className="absolute top-2 font-black text-amber-400 text-xs">ش (الشمال)</div>
                      <div className="absolute bottom-2 font-bold text-slate-400 text-[10px]">ج</div>
                      <div className="absolute right-2 font-bold text-slate-400 text-[10px]">ق</div>
                      <div className="absolute left-2 font-bold text-slate-400 text-[10px]">غ</div>
                    </div>

                    {/* إبرة اتجاه الشمال */}
                    <div className="absolute top-6 w-1 h-14 bg-red-500 rounded-t-full shadow-sm"></div>

                    {/* إبرة القبلة المحسوبة */}
                    {qiblaDirection !== null && (
                      <div 
                        className="absolute w-full h-full flex flex-col items-center justify-start pointer-events-none p-2"
                        style={{ transform: `rotate(${qiblaDirection}deg)` }}
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-bold text-xs border border-white">
                            🕋
                          </div>
                          <div className="w-1 h-16 bg-gradient-to-b from-amber-400 to-transparent rounded-full mt-1"></div>
                        </div>
                      </div>
                    )}

                    <div className="w-4 h-4 bg-amber-400 rounded-full shadow-md z-10 border-2 border-slate-950"></div>
                  </div>

                  <p className="text-center text-[11px] text-slate-300 font-medium mt-2">
                    قم بتوجيه أعلى هاتفك نحو اتجاه <strong className="text-amber-400 font-bold">{qiblaCardinal} ({qiblaDirection !== null ? Math.round(qiblaDirection) : 0}°)</strong> بالنسبة لجهة الشمال في منطقتك.
                  </p>
                </div>

                {/* أزرار تحديث الموقع والـ GPS */}
                <div className="w-full space-y-2">
                  {locationError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-xs font-medium flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-500" />
                      <span>{locationError}</span>
                    </div>
                  )}

                  <button
                    onClick={() => fetchLocation(true)}
                    disabled={isRequestingGPS}
                    className="w-full py-3 px-4 bg-[var(--color-primary)] text-white font-bold text-xs rounded-2xl shadow-md hover:bg-[var(--color-primary-dark)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRequestingGPS ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>جاري تحديد موقع الـ GPS...</span>
                      </>
                    ) : (
                      <>
                        <Crosshair size={16} />
                        <span>تحديد الموقع عبر الـ GPS المباشر</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCitySelector(true)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <Globe size={16} className="text-amber-600" />
                    <span>اختر مدينتك من القائمة المباشرة</span>
                  </button>
                </div>
              </div>
            )}

            {/* معايرة البوصلة والمعلومات المساعدة */}
            <div className="w-full mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <button 
                onClick={() => setShowCalibrationGuide(!showCalibrationGuide)} 
                className="text-amber-600 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>كيفية معايرة البوصلة؟</span>
              </button>
              <span>دقة الحساب: متناهية (Adhan High Precision)</span>
            </div>

            {/* دليل المعايرة عند الضغط */}
            <AnimatePresence>
              {showCalibrationGuide && (
                <motion.div 
                  key="qibla-calibration-guide"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 mt-2 text-xs leading-relaxed"
                >
                  <p className="font-bold mb-1">طريقة معايرة المستشعر:</p>
                  <p>
                    لزيادة دقة البوصلة ومنع التشويش المغناطيسي، امسك هاتفك وحركه في الهواء ببطء على شكل رقم ثمانية باللغة الإنجليزية <strong>(8)</strong> لعدة مرات بعيداً عن الأجهزة الكهربائية والمعادن.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
