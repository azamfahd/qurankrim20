// Cumulative surah verse counts for 100% accurate global <-> surah/ayah coordinate mapping
export const SURAH_VERSE_COUNTS: number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6
];

/**
 * Convert global Ayah number (1-6236) to surah number and ayah number in surah
 */
export function getAyahLocationFromGlobal(globalAyah: number): { surah: number; ayahInSurah: number } {
  if (!globalAyah || globalAyah < 1) return { surah: 1, ayahInSurah: 1 };
  let count = 0;
  for (let s = 0; s < SURAH_VERSE_COUNTS.length; s++) {
    const surahVerses = SURAH_VERSE_COUNTS[s];
    if (count + surahVerses >= globalAyah) {
      return { surah: s + 1, ayahInSurah: globalAyah - count };
    }
    count += surahVerses;
  }
  return { surah: 114, ayahInSurah: 6 };
}

/**
 * Convert surah number and ayah in surah to global Ayah number (1-6236)
 */
export function getGlobalAyahFromLocation(surah: number, ayahInSurah: number): number {
  if (!surah || surah < 1) return 1;
  let global = 0;
  for (let s = 0; s < Math.min(surah - 1, SURAH_VERSE_COUNTS.length); s++) {
    global += SURAH_VERSE_COUNTS[s];
  }
  return global + (ayahInSurah || 1);
}

export interface QuranReciter {
  id: string;
  name: string;
  sub: string;
  desc?: string;
}

export const QURAN_RECITERS: QuranReciter[] = [
  { id: 'ar.alafasy', name: 'مشاري راشد العفاسي', sub: 'العفاسي', desc: 'تلاوة خاشعة ومحبوبة تريح القلب' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي (مرتل)', sub: 'مرتل', desc: 'المصحف المرتل الخاشع الباكي' },
  { id: 'ar.minshawimujawwad', name: 'محمد صديق المنشاوي (مجود)', sub: 'مجود', desc: 'المصحف المجود الخالد' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد (مرتل)', sub: 'مرتل', desc: 'المصحف المرتل الخاشع والوقور' },
  { id: 'ar.abdulbasitmujawwad', name: 'عبد الباسط عبد الصمد (مجود)', sub: 'مجود', desc: 'صوت مكة الخالد والأداء الفريد' },
  { id: 'ar.husary', name: 'محمود خليل الحصري (مرتل)', sub: 'مرتل', desc: 'المصحف المعلم المتقن بدقة التجويد' },
  { id: 'ar.husarymujawwad', name: 'محمود خليل الحصري (مجود)', sub: 'مجود', desc: 'التلاوة المجودة الرائعة' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي', sub: 'الحرم المكي', desc: 'إمام المسجد الحرام وتلاوة شجية' },
  { id: 'ar.yasseraddussary', name: 'ياسر الدوسري', sub: 'الحرم المكي', desc: 'تلاوة مهيبة من رحاب الحرم المكي' },
  { id: 'ar.abdurrahmaansudais', name: 'عبد الرحمن السديس', sub: 'الحرم المكي', desc: 'إمام وخطيب المسجد الحرام' },
  { id: 'ar.faresabbad', name: 'فارس عباد', sub: 'مرتل', desc: 'تلاوة عذبة وشجية مرتلة' },
  { id: 'ar.saoodshuraym', name: 'سعود الشريم', sub: 'الحرم المكي', desc: 'تلاوة الحرم المكي الخاشعة' },
  { id: 'ar.ahmedajamy', name: 'أحمد بن علي العجمي', sub: 'مرتل', desc: 'تلاوة عذبة ومؤثرة' },
  { id: 'ar.hanirifai', name: 'هاني الرفاعي', sub: 'مرتل', desc: 'تلاوة باكية خاشعة' },
  { id: 'ar.hudhaify', name: 'علي عبد الرحمن الحذيفي', sub: 'الحرم المدني', desc: 'إمام المسجد النبوي الشريف' },
  { id: 'ar.shaatree', name: 'أبو بكر الشاطري', sub: 'مرتل', desc: 'تلاوة هادئة ووقورة' },
  { id: 'ar.abdullahbasfar', name: 'عبد الله بصفر', sub: 'مرتل', desc: 'تلاوة مرتلة متقنة' },
  { id: 'ar.saadghamidi', name: 'سعد الغامدي', sub: 'مرتل', desc: 'تلاوة صافية وهادئة' },
  { id: 'ar.ayyoub', name: 'محمد أيوب', sub: 'الحرم النبوي', desc: 'تلاوة حجازية ندية وخاشعة' },
  { id: 'ar.mustafaismail', name: 'مصطفى إسماعيل', sub: 'مجود', desc: 'عبقري التلاوة والأنغام القرآنية' },
  { id: 'ar.husarymuallim', name: 'محمود خليل الحصري (المعلم)', sub: 'المعلم', desc: 'تلاوة تعليمية متأنية' }
];

export function normalizeReciterId(reciterId?: string): string {
  if (!reciterId) return 'ar.faresabbad';
  const r = reciterId.trim();
  if (r === 'ar.yasseraldosari') return 'ar.yasseraddussary';
  if (r === 'ar.as-sudais') return 'ar.abdurrahmaansudais';
  if (r === 'ar.fares') return 'ar.faresabbad';
  if (r === 'ar.abdulsamad') return 'ar.abdulbasitmurattal';
  if (r === 'ar.maheralmuaiqly') return 'ar.mahermuaiqly';
  if (r === 'ar.shuraym') return 'ar.saoodshuraym';
  if (r === 'ar.alghamdi') return 'ar.saadghamidi';
  if (r === 'ar.muhammadayyoub') return 'ar.ayyoub';
  return r;
}

export const RECITER_BITRATES: Record<string, string> = {
  'ar.alafasy': '128',
  'ar.abdulbasitmurattal': '192',
  'ar.abdulsamad': '192',
  'ar.minshawi': '128',
  'ar.minshawimujawwad': '64',
  'ar.husary': '128',
  'ar.husarymujawwad': '128',
  'ar.mahermuaiqly': '128',
  'ar.maheralmuaiqly': '128',
  'ar.abdurrahmaansudais': '192',
  'ar.as-sudais': '192',
  'ar.saoodshuraym': '64',
  'ar.shuraym': '64',
  'ar.ahmedajamy': '128',
  'ar.hanirifai': '192',
  'ar.hudhaify': '128',
  'ar.shaatree': '128',
  'ar.abdullahbasfar': '192',
  'ar.ayyoub': '128',
  'ar.muhammadayyoub': '128'
};

export const EVERYAYAH_MAP: Record<string, string> = {
  'ar.alafasy': 'Alafasy_128kbps',
  'ar.abdulbasitmurattal': 'Abdul_Basit_Murattal_192kbps',
  'ar.abdulsamad': 'Abdul_Basit_Murattal_192kbps',
  'ar.abdulbasitmujawwad': 'Abdul_Basit_Mujawwad_128kbps',
  'ar.minshawi': 'Minshawy_Murattal_128kbps',
  'ar.minshawimujawwad': 'Minshawy_Mujawwad_192kbps',
  'ar.husary': 'Husary_128kbps',
  'ar.husarymujawwad': 'Husary_128kbps_Mujawwad',
  'ar.husarymuallim': 'Husary_Muallim_128kbps',
  'ar.mahermuaiqly': 'Maher_AlMuaiqly_64kbps',
  'ar.maheralmuaiqly': 'Maher_AlMuaiqly_64kbps',
  'ar.yasseraddussary': 'Yasser_Ad-Dussary_128kbps',
  'ar.yasseraldosari': 'Yasser_Ad-Dussary_128kbps',
  'ar.faresabbad': 'Fares_Abbad_64kbps',
  'ar.fares': 'Fares_Abbad_64kbps',
  'ar.abdurrahmaansudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.as-sudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.saoodshuraym': 'Saood_ash-Shuraym_64kbps',
  'ar.shuraym': 'Saood_ash-Shuraym_64kbps',
  'ar.ahmedajamy': 'Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com',
  'ar.hanirifai': 'Hani_Rifai_192kbps',
  'ar.hudhaify': 'Hudhaify_64kbps',
  'ar.shaatree': 'Abu_Bakr_Ash-Shaatree_128kbps',
  'ar.abdullahbasfar': 'Abdullah_Basfar_192kbps',
  'ar.saadghamidi': 'Ghamadi_40kbps',
  'ar.alghamdi': 'Ghamadi_40kbps',
  'ar.ayyoub': 'Muhammad_Ayyoub_128kbps',
  'ar.muhammadayyoub': 'Muhammad_Ayyoub_128kbps',
  'ar.mustafaismail': 'Mustafa_Ismail_48kbps'
};

/**
 * Get direct, verified Quran Audio URL for a given reciter and verse
 */
export function getQuranAudioUrl(
  reciterId: string, 
  globalAyahNumber?: number, 
  surahNumber?: number, 
  ayahNumberInSurah?: number
): string {
  const normReciter = normalizeReciterId(reciterId);

  // Compute full coordinates if either side is missing
  let sNum = surahNumber;
  let aNum = ayahNumberInSurah;
  let gNum = globalAyahNumber;

  if ((!sNum || !aNum) && gNum) {
    const loc = getAyahLocationFromGlobal(gNum);
    sNum = loc.surah;
    aNum = loc.ayahInSurah;
  } else if ((!gNum || gNum < 1) && sNum && aNum) {
    gNum = getGlobalAyahFromLocation(sNum, aNum);
  }

  // Reciters that MUST use EveryAyah (not on Islamic Network or forbidden)
  const mustUseEveryAyah = [
    'ar.faresabbad', 
    'ar.fares', 
    'ar.yasseraddussary', 
    'ar.yasseraldosari', 
    'ar.abdulbasitmujawwad',
    'ar.saadghamidi',
    'ar.alghamdi',
    'ar.mustafaismail',
    'ar.husarymuallim',
    'ar.ayyoub',
    'ar.muhammadayyoub'
  ].includes(normReciter);

  // 1. If reciter requires EveryAyah or if surah & ayah are available
  if (mustUseEveryAyah && sNum && aNum) {
    const folder = EVERYAYAH_MAP[normReciter] || 'Fares_Abbad_64kbps';
    const sStr = String(sNum).padStart(3, '0');
    const aStr = String(aNum).padStart(3, '0');
    return `https://everyayah.com/data/${folder}/${sStr}${aStr}.mp3`;
  }

  // 2. Use cdn.islamic.network if reciter has confirmed CDN bitrate
  if (gNum && RECITER_BITRATES[normReciter]) {
    const bitrate = RECITER_BITRATES[normReciter];
    return `https://cdn.islamic.network/quran/audio/${bitrate}/${normReciter}/${gNum}.mp3`;
  }

  // 3. Fallback to EveryAyah
  const folder = EVERYAYAH_MAP[normReciter] || 'Alafasy_128kbps';
  const sStr = String(sNum || 1).padStart(3, '0');
  const aStr = String(aNum || 1).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${sStr}${aStr}.mp3`;
}

/**
 * Get resilient secondary/fallback audio URL if the primary fails to load
 */
export function getQuranAudioFallbackUrl(
  reciterId: string, 
  globalAyahNumber?: number, 
  surahNumber?: number, 
  ayahNumberInSurah?: number
): string {
  const normReciter = normalizeReciterId(reciterId);

  let sNum = surahNumber;
  let aNum = ayahNumberInSurah;
  let gNum = globalAyahNumber;

  if ((!sNum || !aNum) && gNum) {
    const loc = getAyahLocationFromGlobal(gNum);
    sNum = loc.surah;
    aNum = loc.ayahInSurah;
  } else if ((!gNum || gNum < 1) && sNum && aNum) {
    gNum = getGlobalAyahFromLocation(sNum, aNum);
  }

  // If primary was CDN, fallback to EveryAyah
  if (RECITER_BITRATES[normReciter] && sNum && aNum && EVERYAYAH_MAP[normReciter]) {
    const folder = EVERYAYAH_MAP[normReciter];
    const sStr = String(sNum).padStart(3, '0');
    const aStr = String(aNum).padStart(3, '0');
    return `https://everyayah.com/data/${folder}/${sStr}${aStr}.mp3`;
  }

  // If primary was EveryAyah, fallback to Alafasy CDN
  if (gNum) {
    return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${gNum}.mp3`;
  }

  return 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3';
}
