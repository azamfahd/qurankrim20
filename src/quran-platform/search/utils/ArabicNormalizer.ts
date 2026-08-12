/**
 * Arabic Text Normalizer Utility
 * Handles smart text normalization for Quranic Arabic search:
 * - Removes diacritics (tashkeel, tanween, sukoon, shaddah)
 * - Normalizes Alef forms (أ, إ, آ, ٱ, ٲ, ٳ -> ا)
 * - Normalizes Yaa and Alef Maksura (ى, ي -> ي / ى)
 * - Normalizes Taa Marbuta and Haa (ة, ه)
 * - Removes Quranic stop/pause marks, sajdah marks, juz marks, and symbols
 * - Normalizes whitespace and digits
 */

export class ArabicNormalizer {
  // Regex for diacritics / tashkeel
  private static DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

  // Regex for Quranic symbols & pause marks
  private static QURANIC_SYMBOLS_REGEX = /[\u0610-\u061A\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06EDۖۗۚۛۜۤ۩ۦۧۨ]/g;

  // Regex for non-alphanumeric punctuation
  private static PUNCTUATION_REGEX = /[!?,.:;"'()\[\]{}،؟«»\-—_]/g;

  /**
   * Remove diacritics / tashkeel from Arabic text
   */
  static removeDiacritics(text: string): string {
    if (!text) return '';
    return text.replace(this.DIACRITICS_REGEX, '');
  }

  /**
   * Normalize Alef forms: أ, إ, آ, ٱ, ٲ, ٳ -> ا
   */
  static normalizeAlef(text: string): string {
    if (!text) return '';
    return text.replace(/[أإآٱٲٳ]/g, 'ا');
  }

  /**
   * Normalize Yaa and Alef Maksura: ى -> ي
   */
  static normalizeYaa(text: string): string {
    if (!text) return '';
    return text.replace(/ى/g, 'ي');
  }

  /**
   * Normalize Taa Marbuta and Haa: ة -> ه
   */
  static normalizeTaaMarbuta(text: string): string {
    if (!text) return '';
    return text.replace(/ة/g, 'ه');
  }

  /**
   * Convert Arabic-Indic (Eastern) digits to standard Western digits
   * e.g. ١٢٣ -> 123
   */
  static convertArabicDigitsToWestern(text: string): string {
    if (!text) return '';
    const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return text.replace(/[٠-٩]/g, (w) => {
      return easternDigits.indexOf(w).toString();
    });
  }

  /**
   * Clean punctuation, Quranic marks, and extra spaces
   */
  static cleanSymbolsAndWhitespace(text: string): string {
    if (!text) return '';
    return text
      .replace(this.QURANIC_SYMBOLS_REGEX, ' ')
      .replace(this.PUNCTUATION_REGEX, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Complete Smart Normalization
   * Applies all normalizations to generate a unified searchable string
   */
  static smartNormalize(text: string): string {
    if (!text) return '';
    let result = text;
    result = this.removeDiacritics(result);
    result = this.normalizeAlef(result);
    result = this.normalizeYaa(result);
    result = this.normalizeTaaMarbuta(result);
    result = this.convertArabicDigitsToWestern(result);
    result = this.cleanSymbolsAndWhitespace(result);
    return result.toLowerCase();
  }

  /**
   * Parse numeric intent from query
   * e.g. "صفحة 45", "سورة 2", "جزء 30", "حزب 5", "45"
   */
  static parseNumericIntent(query: string): {
    number: number | null;
    type: 'surah' | 'page' | 'juz' | 'hizb' | 'rub' | 'unknown';
  } {
    const converted = this.convertArabicDigitsToWestern(query.trim());
    const matchNumber = converted.match(/\d+/);

    if (!matchNumber) {
      return { number: null, type: 'unknown' };
    }

    const num = parseInt(matchNumber[0], 10);
    const cleanQ = this.smartNormalize(query);

    if (cleanQ.includes('سوره') || cleanQ.includes('سورة')) {
      return { number: num, type: 'surah' };
    }
    if (cleanQ.includes('صفحه') || cleanQ.includes('صفحة')) {
      return { number: num, type: 'page' };
    }
    if (cleanQ.includes('جزء') || cleanQ.includes('الجزء')) {
      return { number: num, type: 'juz' };
    }
    if (cleanQ.includes('حزب') || cleanQ.includes('الحزب')) {
      return { number: num, type: 'hizb' };
    }
    if (cleanQ.includes('ربع') || cleanQ.includes('الربع')) {
      return { number: num, type: 'rub' };
    }

    // Direct number without prefix
    if (/^\d+$/.test(converted.trim())) {
      if (num >= 1 && num <= 604) {
        return { number: num, type: 'page' };
      }
    }

    return { number: num, type: 'unknown' };
  }

  /**
   * Calculate match ranges for highlighting in text
   */
  static findMatchRanges(originalText: string, searchQuery: string): [number, number][] {
    if (!originalText || !searchQuery) return [];

    const normOriginal = this.smartNormalize(originalText);
    const normQuery = this.smartNormalize(searchQuery);

    if (!normOriginal || !normQuery) return [];

    const ranges: [number, number][] = [];
    let idx = normOriginal.indexOf(normQuery);

    while (idx !== -1) {
      ranges.push([idx, idx + normQuery.length]);
      idx = normOriginal.indexOf(normQuery, idx + normQuery.length);
    }

    return ranges;
  }
}
