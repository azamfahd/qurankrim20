import { UserLocation } from '../types';

export interface CityPreset {
  country: string;
  countryCode: string;
  flag: string;
  city: string;
  latitude: number;
  longitude: number;
  calculationMethod?: string;
}

export const MAJOR_CITIES: CityPreset[] = [
  // اليمن
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'صنعاء', latitude: 15.3694, longitude: 44.1910, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'عدن', latitude: 12.7855, longitude: 45.0187, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'تعز', latitude: 13.5789, longitude: 44.0195, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'المكلا (حضرموت)', latitude: 14.5425, longitude: 49.1242, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'الحديدة', latitude: 14.7978, longitude: 42.9545, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'إب', latitude: 13.9667, longitude: 44.1833, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'ذمار', latitude: 14.5427, longitude: 44.4051, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'مأرب', latitude: 15.4600, longitude: 45.3200, calculationMethod: 'UmmAlQura' },
  { country: 'اليمن', countryCode: 'YE', flag: '🇾🇪', city: 'سيئون', latitude: 15.9333, longitude: 48.7833, calculationMethod: 'UmmAlQura' },

  // السعودية
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'مكة المكرمة', latitude: 21.4225, longitude: 39.8262, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'المدينة المنورة', latitude: 24.5247, longitude: 39.5692, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'الرياض', latitude: 24.7136, longitude: 46.6753, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'جدة', latitude: 21.5433, longitude: 39.1728, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'الدمام', latitude: 26.4207, longitude: 50.0888, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'أبها', latitude: 18.2164, longitude: 42.5053, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'تبوك', latitude: 28.3835, longitude: 36.5662, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'الطائف', latitude: 21.2854, longitude: 40.4222, calculationMethod: 'UmmAlQura' },
  { country: 'السعودية', countryCode: 'SA', flag: '🇸🇦', city: 'القصيم (بريدة)', latitude: 26.3260, longitude: 43.9750, calculationMethod: 'UmmAlQura' },

  // مصر
  { country: 'مصر', countryCode: 'EG', flag: '🇪🇬', city: 'القاهرة', latitude: 30.0444, longitude: 31.2357, calculationMethod: 'Egyptian' },
  { country: 'مصر', countryCode: 'EG', flag: '🇪🇬', city: 'الإسكندرية', latitude: 31.2001, longitude: 29.9187, calculationMethod: 'Egyptian' },
  { country: 'مصر', countryCode: 'EG', flag: '🇪🇬', city: 'الجيزة', latitude: 30.0131, longitude: 31.2089, calculationMethod: 'Egyptian' },
  { country: 'مصر', countryCode: 'EG', flag: '🇪🇬', city: 'المنصورة', latitude: 31.0409, longitude: 31.3785, calculationMethod: 'Egyptian' },
  { country: 'مصر', countryCode: 'EG', flag: '🇪🇬', city: 'طنطا', latitude: 30.7865, longitude: 31.0004, calculationMethod: 'Egyptian' },
  { country: 'مصر', countryCode: 'EG', flag: '🇪🇬', city: 'أسوان', latitude: 24.0889, longitude: 32.8998, calculationMethod: 'Egyptian' },

  // الإمارات
  { country: 'الإمارات', countryCode: 'AE', flag: '🇦🇪', city: 'دبي', latitude: 25.2048, longitude: 55.2708, calculationMethod: 'Dubai' },
  { country: 'الإمارات', countryCode: 'AE', flag: '🇦🇪', city: 'أبوظبي', latitude: 24.4539, longitude: 54.3773, calculationMethod: 'Dubai' },
  { country: 'الإمارات', countryCode: 'AE', flag: '🇦🇪', city: 'الشارقة', latitude: 25.3463, longitude: 55.4209, calculationMethod: 'Dubai' },
  { country: 'الإمارات', countryCode: 'AE', flag: '🇦🇪', city: 'عجمان', latitude: 25.4052, longitude: 55.5136, calculationMethod: 'Dubai' },

  // الأردن
  { country: 'الأردن', countryCode: 'JO', flag: '🇯🇴', city: 'عمان', latitude: 31.9454, longitude: 35.9284, calculationMethod: 'UmmAlQura' },
  { country: 'الأردن', countryCode: 'JO', flag: '🇯🇴', city: 'إربد', latitude: 32.5568, longitude: 35.8469, calculationMethod: 'UmmAlQura' },
  { country: 'الأردن', countryCode: 'JO', flag: '🇯🇴', city: 'الزرقاء', latitude: 32.0728, longitude: 36.0880, calculationMethod: 'UmmAlQura' },

  // فلسطين
  { country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', city: 'القدس الشريف', latitude: 31.7683, longitude: 35.2137, calculationMethod: 'Egyptian' },
  { country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', city: 'غزة', latitude: 31.5017, longitude: 34.4668, calculationMethod: 'Egyptian' },
  { country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', city: 'رام الله', latitude: 31.9038, longitude: 35.2034, calculationMethod: 'Egyptian' },
  { country: 'فلسطين', countryCode: 'PS', flag: '🇵🇸', city: 'نابلس', latitude: 32.2211, longitude: 35.2544, calculationMethod: 'Egyptian' },

  // العراق
  { country: 'العراق', countryCode: 'IQ', flag: '🇮🇶', city: 'بغداد', latitude: 33.3152, longitude: 44.3661, calculationMethod: 'MuslimWorldLeague' },
  { country: 'العراق', countryCode: 'IQ', flag: '🇮🇶', city: 'البصرة', latitude: 30.5081, longitude: 47.7835, calculationMethod: 'MuslimWorldLeague' },
  { country: 'العراق', countryCode: 'IQ', flag: '🇮🇶', city: 'أربيل', latitude: 36.1901, longitude: 44.0091, calculationMethod: 'MuslimWorldLeague' },
  { country: 'العراق', countryCode: 'IQ', flag: '🇮🇶', city: 'الموصل', latitude: 36.3400, longitude: 43.1300, calculationMethod: 'MuslimWorldLeague' },

  // سوريا
  { country: 'سوريا', countryCode: 'SY', flag: '🇸🇾', city: 'دمشق', latitude: 33.5138, longitude: 36.2765, calculationMethod: 'MuslimWorldLeague' },
  { country: 'سوريا', countryCode: 'SY', flag: '🇸🇾', city: 'حلب', latitude: 36.2021, longitude: 37.1343, calculationMethod: 'MuslimWorldLeague' },
  { country: 'سوريا', countryCode: 'SY', flag: '🇸🇾', city: 'حمص', latitude: 34.7324, longitude: 36.7137, calculationMethod: 'MuslimWorldLeague' },

  // قطر، الكويت، البحرين، عمان
  { country: 'الكويت', countryCode: 'KW', flag: '🇰🇼', city: 'مدينة الكويت', latitude: 29.3759, longitude: 47.9774, calculationMethod: 'UmmAlQura' },
  { country: 'قطر', countryCode: 'QA', flag: '🇶🇦', city: 'الدوحة', latitude: 25.2854, longitude: 51.5310, calculationMethod: 'UmmAlQura' },
  { country: 'البحرين', countryCode: 'BH', flag: '🇧🇭', city: 'المنامة', latitude: 26.2285, longitude: 50.5860, calculationMethod: 'UmmAlQura' },
  { country: 'عُمان', countryCode: 'OM', flag: '🇴🇲', city: 'مسقط', latitude: 23.5880, longitude: 58.3829, calculationMethod: 'UmmAlQura' },

  // المغرب العربي
  { country: 'المغرب', countryCode: 'MA', flag: '🇲🇦', city: 'الرباط', latitude: 34.0209, longitude: -6.8416, calculationMethod: 'MuslimWorldLeague' },
  { country: 'المغرب', countryCode: 'MA', flag: '🇲🇦', city: 'الدار البيضاء', latitude: 33.5731, longitude: -7.5898, calculationMethod: 'MuslimWorldLeague' },
  { country: 'المغرب', countryCode: 'MA', flag: '🇲🇦', city: 'مراكش', latitude: 31.6295, longitude: -7.9811, calculationMethod: 'MuslimWorldLeague' },
  { country: 'المغرب', countryCode: 'MA', flag: '🇲🇦', city: 'فاس', latitude: 34.0331, longitude: -5.0003, calculationMethod: 'MuslimWorldLeague' },

  { country: 'الجزائر', countryCode: 'DZ', flag: '🇩🇿', city: 'الجزائر العاصمة', latitude: 36.7538, longitude: 3.0588, calculationMethod: 'MuslimWorldLeague' },
  { country: 'الجزائر', countryCode: 'DZ', flag: '🇩🇿', city: 'وهران', latitude: 35.6987, longitude: -0.6349, calculationMethod: 'MuslimWorldLeague' },
  { country: 'الجزائر', countryCode: 'DZ', flag: '🇩🇿', city: 'قسنطينة', latitude: 36.3650, longitude: 6.6147, calculationMethod: 'MuslimWorldLeague' },

  { country: 'تونس', countryCode: 'TN', flag: '🇹🇳', city: 'تونس العاصمة', latitude: 36.8065, longitude: 10.1815, calculationMethod: 'MuslimWorldLeague' },
  { country: 'تونس', countryCode: 'TN', flag: '🇹🇳', city: 'صفاقس', latitude: 34.7406, longitude: 10.7603, calculationMethod: 'MuslimWorldLeague' },

  { country: 'ليبيا', countryCode: 'LY', flag: '🇱🇾', city: 'طرابلس', latitude: 32.8872, longitude: 13.1913, calculationMethod: 'MuslimWorldLeague' },
  { country: 'ليبيا', countryCode: 'LY', flag: '🇱🇾', city: 'بنغازي', latitude: 32.1167, longitude: 20.0667, calculationMethod: 'MuslimWorldLeague' },

  { country: 'السودان', countryCode: 'SD', flag: '🇸🇩', city: 'الخرطوم', latitude: 15.5007, longitude: 32.5599, calculationMethod: 'Egyptian' },
  { country: 'لبنان', countryCode: 'LB', flag: '🇱🇧', city: 'بيروت', latitude: 33.8938, longitude: 35.5018, calculationMethod: 'MuslimWorldLeague' },
  { country: 'تركيا', countryCode: 'TR', flag: '🇹🇷', city: 'إسطنبول', latitude: 41.0082, longitude: 28.9784, calculationMethod: 'MuslimWorldLeague' },
  { country: 'تركيا', countryCode: 'TR', flag: '🇹🇷', city: 'أنقرة', latitude: 39.9334, longitude: 32.8597, calculationMethod: 'MuslimWorldLeague' }
];

export interface LocationDetectionResult {
  location: UserLocation;
  source: 'gps' | 'ip' | 'saved' | 'default';
  isFirstLaunch: boolean;
  success: boolean;
  message: string;
}

/**
 * Service to automatically and transparently detect the user's location
 * via GPS (high-precision) or GeoIP fallback without requiring any manual button clicks.
 */
export class LocationService {
  private static cachedLocation: UserLocation | null = null;
  private static isDetecting = false;
  private static listeners: Array<(loc: UserLocation) => void> = [];

  /**
   * Loads any previously persisted location from localStorage
   */
  public static getSavedLocation(): UserLocation | null {
    if (this.cachedLocation) return this.cachedLocation;
    try {
      const saved = localStorage.getItem('anis_saved_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          this.cachedLocation = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading saved location:', e);
    }
    return null;
  }

  /**
   * Saves location to localStorage and memory cache, and notifies listeners
   */
  public static saveLocation(loc: UserLocation): void {
    if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number') return;
    this.cachedLocation = loc;
    try {
      localStorage.setItem('anis_saved_location', JSON.stringify(loc));
      localStorage.setItem('anis_location_confirmed_v1', 'true');
    } catch (e) {
      console.warn('Error saving location to localStorage:', e);
    }
    this.notify(loc);
  }

  /**
   * Subscribe to location updates
   */
  public static onLocationUpdated(callback: (loc: UserLocation) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private static notify(loc: UserLocation): void {
    this.listeners.forEach(cb => {
      try {
        cb(loc);
      } catch (e) {
        console.error('Location listener error:', e);
      }
    });
  }

  /**
   * Automatically detects the user's location with full details (for first-time notifications)
   */
  public static async detectLocationWithDetails(forceRefresh = false): Promise<LocationDetectionResult> {
    const isFirstLaunch = !localStorage.getItem('anis_location_confirmed_v1');
    const saved = this.getSavedLocation();

    if (saved && !forceRefresh) {
      this.refineLocationInBackground();
      return {
        location: saved,
        source: 'saved',
        isFirstLaunch,
        success: true,
        message: `الموقع المحفوظ: ${saved.name}`
      };
    }

    this.isDetecting = true;

    try {
      // 1. Try Browser Geolocation
      if ('geolocation' in navigator) {
        const gpsLocation = await this.tryGpsLocation(7000);
        if (gpsLocation) {
          this.saveLocation(gpsLocation);
          this.isDetecting = false;
          return {
            location: gpsLocation,
            source: 'gps',
            isFirstLaunch,
            success: true,
            message: `تم تحديد موقعك بدقة عبر GPS: ${gpsLocation.name}`
          };
        }
      }

      // 2. Try Fast IP-based Geolocation fallback
      const ipLocation = await this.tryIpLocation();
      if (ipLocation) {
        this.saveLocation(ipLocation);
        this.isDetecting = false;
        return {
          location: ipLocation,
          source: 'ip',
          isFirstLaunch,
          success: true,
          message: `تم تحديد موقعك التلقائي: ${ipLocation.name}`
        };
      }
    } catch (err) {
      console.warn('Auto location detection encountered issue, using fallback:', err);
    } finally {
      this.isDetecting = false;
    }

    // 3. Fallback: Saved or intelligent default
    const fallback: UserLocation = saved || this.getSmartDefaultLocation();
    this.saveLocation(fallback);
    return {
      location: fallback,
      source: 'default',
      isFirstLaunch,
      success: false,
      message: `الموقع الافتراضي: ${fallback.name}`
    };
  }

  /**
   * Simplified auto detection
   */
  public static async autoDetectLocation(forceRefresh = false): Promise<UserLocation> {
    const result = await this.detectLocationWithDetails(forceRefresh);
    return result.location;
  }

  /**
   * Refines location in the background if GPS permission is active
   */
  private static async refineLocationInBackground(): Promise<void> {
    if ('permissions' in navigator && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as any });
        if (status.state === 'granted') {
          const freshGps = await this.tryGpsLocation(6000);
          if (freshGps) {
            this.saveLocation(freshGps);
          }
        }
      } catch (e) {
        // Ignored
      }
    }
  }

  /**
   * Attempts high accuracy GPS location with reverse geocoding
   */
  public static async tryGpsLocation(timeoutMs = 7000): Promise<UserLocation | null> {
    if (!('geolocation' in navigator)) return null;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 180000
        });
      });

      const { latitude, longitude } = position.coords;
      let name = 'موقعك الحالي (GPS)';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision;
          const country = data.countryName;
          if (city && country) {
            name = `${city}، ${country}`;
          } else if (city) {
            name = city;
          } else if (country) {
            name = country;
          }
        }
      } catch (geoErr) {
        console.warn('Reverse geocoding failed or timed out:', geoErr);
      }

      return { latitude, longitude, name };
    } catch (e) {
      console.warn('GPS location request failed or was dismissed:', e);
      return null;
    }
  }

  /**
   * Fetches accurate city/country and coordinates from reliable IP lookup services
   */
  public static async tryIpLocation(): Promise<UserLocation | null> {
    const services = [
      {
        url: 'https://get.geojs.io/v1/ip/geo.json',
        parse: (d: any) => {
          const lat = parseFloat(d.latitude);
          const lon = parseFloat(d.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;
          const city = d.city || '';
          const country = d.country || '';
          const name = city && country ? `${city}، ${country}` : (city || country || 'موقعك التلقائي');
          return { latitude: lat, longitude: lon, name };
        }
      },
      {
        url: 'https://ipapi.co/json/',
        parse: (d: any) => {
          const lat = parseFloat(d.latitude);
          const lon = parseFloat(d.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;
          const city = d.city || '';
          const country = d.country_name || '';
          const name = city && country ? `${city}، ${country}` : (city || country || 'موقعك التلقائي');
          return { latitude: lat, longitude: lon, name };
        }
      }
    ];

    for (const service of services) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(service.url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const loc = service.parse(data);
          if (loc) return loc;
        }
      } catch (err) {
        console.warn(`IP service ${service.url} failed:`, err);
      }
    }

    return null;
  }

  /**
   * Searches cities by name or country
   */
  public static searchCities(query: string): CityPreset[] {
    const clean = query.trim().toLowerCase();
    if (!clean) return MAJOR_CITIES;

    return MAJOR_CITIES.filter(c => 
      c.city.toLowerCase().includes(clean) ||
      c.country.toLowerCase().includes(clean)
    );
  }

  /**
   * Smart timezone-based fallback if all network & GPS are offline
   */
  private static getSmartDefaultLocation(): UserLocation {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    
    if (timeZone.includes('Riyadh') || timeZone.includes('Saudi')) {
      return { latitude: 24.7136, longitude: 46.6753, name: 'الرياض، السعودية' };
    }
    if (timeZone.includes('Aden') || timeZone.includes('Yemen') || timeZone.includes('Sanaa')) {
      return { latitude: 15.3694, longitude: 44.1910, name: 'صنعاء، اليمن' };
    }
    if (timeZone.includes('Cairo') || timeZone.includes('Egypt')) {
      return { latitude: 30.0444, longitude: 31.2357, name: 'القاهرة، مصر' };
    }
    if (timeZone.includes('Dubai') || timeZone.includes('Gulf') || timeZone.includes('Muscat')) {
      return { latitude: 25.2048, longitude: 55.2708, name: 'دبي، الإمارات' };
    }
    if (timeZone.includes('Amman') || timeZone.includes('Jordan')) {
      return { latitude: 31.9454, longitude: 35.9284, name: 'عمان، الأردن' };
    }
    if (timeZone.includes('Baghdad') || timeZone.includes('Iraq')) {
      return { latitude: 33.3152, longitude: 44.3661, name: 'بغداد، العراق' };
    }
    if (timeZone.includes('Casablanca') || timeZone.includes('Morocco')) {
      return { latitude: 33.5731, longitude: -7.5898, name: 'الدار البيضاء، المغرب' };
    }
    if (timeZone.includes('Algiers') || timeZone.includes('Algeria')) {
      return { latitude: 36.7538, longitude: 3.0588, name: 'الجزائر العاصمة، الجزائر' };
    }

    return {
      latitude: 21.4225,
      longitude: 39.8262,
      name: 'مكة المكرمة، السعودية'
    };
  }
}
