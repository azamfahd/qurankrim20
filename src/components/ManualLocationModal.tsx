import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Globe2, 
  Check, 
  X, 
  Compass, 
  Clock, 
  Sparkles, 
  RotateCw, 
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserLocation } from '../types';
import { LocationService, MAJOR_CITIES, CityPreset } from '../services/locationService';

interface ManualLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: UserLocation;
  onSelectLocation: (loc: UserLocation, calculationMethod?: string) => void;
}

export const ManualLocationModal: React.FC<ManualLocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('الكل');
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [showCustomCoords, setShowCustomCoords] = useState(false);

  // Custom coordinates form
  const [customLat, setCustomLat] = useState<string>(currentLocation ? currentLocation.latitude.toString() : '15.3694');
  const [customLon, setCustomLon] = useState<string>(currentLocation ? currentLocation.longitude.toString() : '44.1910');
  const [customName, setCustomName] = useState<string>(currentLocation ? currentLocation.name : '');

  // Extract unique countries
  const countries = useMemo(() => {
    const list = Array.from(new Set(MAJOR_CITIES.map(c => c.country)));
    return ['الكل', ...list];
  }, []);

  // Filter cities by search & country tab
  const filteredCities = useMemo(() => {
    return MAJOR_CITIES.filter(c => {
      const matchesCountry = selectedCountry === 'الكل' || c.country === selectedCountry;
      const cleanQuery = searchQuery.trim().toLowerCase();
      const matchesSearch = !cleanQuery || 
        c.city.toLowerCase().includes(cleanQuery) || 
        c.country.toLowerCase().includes(cleanQuery);
      return matchesCountry && matchesSearch;
    });
  }, [searchQuery, selectedCountry]);

  // Handle GPS Direct Click
  const handleGPSDetect = async () => {
    setIsLocatingGPS(true);
    setGpsStatusMessage('جاري الاتصال بالأقمار الصناعية وطلب الإحداثيات...');
    try {
      const gpsResult = await LocationService.tryGpsLocation(10000);
      if (gpsResult) {
        LocationService.saveLocation(gpsResult);
        onSelectLocation(gpsResult);
        setGpsStatusMessage(`تم تحديد موقعك بنجاح: ${gpsResult.name}`);
        setTimeout(() => {
          setIsLocatingGPS(false);
          setGpsStatusMessage(null);
          onClose();
        }, 1200);
      } else {
        // Fallback to IP
        setGpsStatusMessage('تعذر الوصول لـ GPS، جاري التحديد التلقائي عبر الشبكة...');
        const ipResult = await LocationService.tryIpLocation();
        if (ipResult) {
          LocationService.saveLocation(ipResult);
          onSelectLocation(ipResult);
          setGpsStatusMessage(`تم تحديد موقعك عبر الشبكة: ${ipResult.name}`);
          setTimeout(() => {
            setIsLocatingGPS(false);
            setGpsStatusMessage(null);
            onClose();
          }, 1200);
        } else {
          setGpsStatusMessage('تعذر التحديد التلقائي. يُرجى اختيار مدينتك من القائمة أدناه.');
          setIsLocatingGPS(false);
        }
      }
    } catch (e) {
      console.warn("GPS error:", e);
      setGpsStatusMessage('حدث خطأ أثناء تحديد الموقع، يرجى اختيار المدينة يدوياً.');
      setIsLocatingGPS(false);
    }
  };

  // Handle Pick City Preset
  const handleSelectCity = (preset: CityPreset) => {
    const loc: UserLocation = {
      latitude: preset.latitude,
      longitude: preset.longitude,
      name: `${preset.city}، ${preset.country}`
    };
    LocationService.saveLocation(loc);
    onSelectLocation(loc, preset.calculationMethod);
    onClose();
  };

  // Handle Custom Coordinate Apply
  const handleApplyCustomCoords = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (isNaN(lat) || isNaN(lon)) {
      alert('يرجى إدخال أرقام صحيحة لخط العرض وخط الطول');
      return;
    }
    const loc: UserLocation = {
      latitude: lat,
      longitude: lon,
      name: customName.trim() || `موقع مخصص (${lat.toFixed(2)}, ${lon.toFixed(2)})`
    };
    LocationService.saveLocation(loc);
    onSelectLocation(loc);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="manual-location-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-md"
        >
          {/* Modal Window */}
          <motion.div
            key="manual-location-container"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 z-10"
          >
          {/* Header */}
          <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
                <MapPin size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>تحديد موقعك الجغرافي</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    مواقيت الصلاة والقبلة
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  يضبط النظام مواقيت الأذان والقبلة والتقويم الهجري تلقائياً بدقة بحسب مدينتك
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            
            {/* Current Active Location Card */}
            {currentLocation && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">الموقع الحالي الفعّال</span>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {currentLocation.name || 'موقع محدد'}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {currentLocation.latitude.toFixed(4)}° N, {currentLocation.longitude.toFixed(4)}° E
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    مضبوط ونشط
                  </span>
                </div>
              </div>
            )}

            {/* Quick GPS Auto-Detect Button */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20 relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Navigation size={16} />
                    <span>التحديد التلقائي فائق الدقة (GPS)</span>
                  </h4>
                  <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                    استشعار موقعك المباشر بدقة عبر المتصفح لضبط أوقات الصلاة والقبلة بالثانية
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGPSDetect}
                  disabled={isLocatingGPS}
                  className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-75 cursor-pointer shrink-0"
                >
                  {isLocatingGPS ? (
                    <>
                      <RotateCw size={16} className="animate-spin text-emerald-600" />
                      <span>جاري الاستشعار...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={16} className="text-emerald-700" />
                      <span>تحديد موقعي الآن</span>
                    </>
                  )}
                </button>
              </div>

              {gpsStatusMessage && (
                <div className="mt-3 pt-3 border-t border-emerald-500/30 text-xs text-emerald-100 flex items-center gap-2 animate-fadeIn">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{gpsStatusMessage}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-bold text-slate-400">أو اختر مدينتك بسهولة</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن دولتك أو مدينتك (مثل: صنعاء، مكة، القاهرة، دبي...)"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-4 pr-11 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Country Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
              {countries.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCountry(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCountry === c
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Cities Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {filteredCities.length > 0 ? (
                filteredCities.map((preset) => {
                  const isCurrent = currentLocation?.name?.includes(preset.city);
                  return (
                    <button
                      key={`${preset.country}-${preset.city}`}
                      type="button"
                      onClick={() => handleSelectCity(preset)}
                      className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                        isCurrent 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20' 
                          : 'bg-white dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{preset.flag}</span>
                        <div className="min-w-0 text-right">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {preset.city}
                          </h5>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {preset.country}
                          </span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="p-1 rounded-full bg-emerald-600 text-white shrink-0">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono group-hover:text-emerald-600 transition-colors shrink-0">
                          اختيار
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  لم يتم العثور على مدينة تطابق بحثك. يمكنك إدخال الإحداثيات يدوياً بالأسفل.
                </div>
              )}
            </div>

            {/* Custom Coordinates Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCustomCoords(!showCustomCoords)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sliders size={14} className="text-emerald-600" />
                  <span>إدخال إحداثيات مخصصة يدوياً (متقدم)</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {showCustomCoords ? 'إخفاء ▲' : 'إظهار ▼'}
                </span>
              </button>

              <AnimatePresence>
                {showCustomCoords && (
                  <motion.div
                    key="manual-location-custom-coords"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">اسم الموقع</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="مثال: منزلي / قريتي"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">خط العرض (Latitude)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={customLat}
                        onChange={(e) => setCustomLat(e.target.value)}
                        placeholder="15.3694"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">خط الطول (Longitude)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={customLon}
                        onChange={(e) => setCustomLon(e.target.value)}
                        placeholder="44.1910"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCustomCoords}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    حفظ وتطبيق الإحداثيات المخصصة
                  </button>
                </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sync Notice */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300">
              <Sparkles size={16} className="shrink-0 text-amber-600 mt-0.5" />
              <p className="leading-relaxed">
                <b>مزامنة تلقائية شاملة:</b> عند تغيير موقعك يتم تحديث توقيت الصلوات الخمس، شروق الشمس، حسابات اتجاه القبلة على البوصلة، وجدول تشغيل الأذان بدقة متناهية.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
