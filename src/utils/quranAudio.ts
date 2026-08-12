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
  'ar.yasseraddussary': '128',
  'ar.abdurrahmaansudais': '192',
  'ar.as-sudais': '192',
  'ar.saoodshuraym': '64',
  'ar.shuraym': '64',
  'ar.ahmedajamy': '128',
  'ar.hanirifai': '192',
  'ar.hudhaify': '128',
  'ar.shaatree': '128',
  'ar.abdullahbasfar': '192'
};

export const EVERYAYAH_MAP: Record<string, string> = {
  'ar.alafasy': 'Alafasy_128kbps',
  'ar.abdulbasitmurattal': 'Abdul_Basit_Murattal_192kbps',
  'ar.abdulsamad': 'Abdul_Basit_Murattal_192kbps',
  'ar.abdulbasitmujawwad': 'Abdul_Basit_Mujawwad_128kbps',
  'ar.minshawi': 'Minshawy_Murattal_128kbps',
  'ar.minshawimujawwad': 'Minshawy_Mujawwad_128kbps',
  'ar.husary': 'Husary_128kbps',
  'ar.husarymujawwad': 'Husary_128kbps_Mujawwad',
  'ar.mahermuaiqly': 'Maher_AlMuaiqly_64kbps',
  'ar.maheralmuaiqly': 'Maher_AlMuaiqly_64kbps',
  'ar.yasseraddussary': 'Yasser_Ad-Dussary_128kbps',
  'ar.yasseraldosari': 'Yasser_Ad-Dussary_128kbps',
  'ar.faresabbad': 'Fares_Abbad_64kbps',
  'ar.fares': 'Fares_Abbad_64kbps',
  'ar.abdurrahmaansudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.as-sudais': 'Abdurrahmaan_As-Sudais_192kbps',
  'ar.saoodshuraym': 'Saood_ash-Shuraym_64kbps',
  'ar.ahmedajamy': 'Ahmed_ibn_Ali_al-Ajamy_128kbps',
  'ar.hanirifai': 'Hani_Rifai_192kbps',
  'ar.hudhaify': 'Hudhaify_64kbps',
  'ar.shaatree': 'Abu_Bakr_Ash-Shaatree_128kbps',
  'ar.abdullahbasfar': 'Abdullah_Basfar_192kbps'
};

/**
 * Get direct Quran Audio URL for a given reciter and verse
 */
export function getQuranAudioUrl(
  reciterId: string, 
  globalAyahNumber?: number, 
  surahNumber?: number, 
  ayahNumberInSurah?: number
): string {
  const normReciter = reciterId || 'ar.faresabbad';

  // 1. If Yasser Ad-Dussary, Fares Abbad, Saood Shuraym, Ahmed Ajamy, or if globalAyahNumber is missing, prefer EveryAyah if surah & ayah are given
  const preferEveryAyah = ['ar.yasseraddussary', 'ar.yasseraldosari', 'ar.faresabbad', 'ar.fares', 'ar.saoodshuraym', 'ar.ahmedajamy'].includes(normReciter);

  if ((preferEveryAyah || !globalAyahNumber) && surahNumber && ayahNumberInSurah) {
    const folder = EVERYAYAH_MAP[normReciter] || 'Fares_Abbad_64kbps';
    const sStr = String(surahNumber).padStart(3, '0');
    const aStr = String(ayahNumberInSurah).padStart(3, '0');
    return `https://everyayah.com/data/${folder}/${sStr}${aStr}.mp3`;
  }

  // 2. Use cdn.islamic.network with correct bitrate for global ayah number
  if (globalAyahNumber) {
    const bitrate = RECITER_BITRATES[normReciter] || '128';
    return `https://cdn.islamic.network/quran/audio/${bitrate}/${normReciter}/${globalAyahNumber}.mp3`;
  }

  // 3. Fallback to EveryAyah
  const folder = EVERYAYAH_MAP[normReciter] || 'Alafasy_128kbps';
  const sStr = String(surahNumber || 1).padStart(3, '0');
  const aStr = String(ayahNumberInSurah || 1).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${sStr}${aStr}.mp3`;
}
