declare global {
  const __APP_VERSION__: string;
}

export type GeminiModel = 
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-1.5-pro'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-3-flash-preview'
  | 'gemini-3.1-flash-lite';

export interface UserLocation {
  latitude: number;
  longitude: number;
  name: string;
}

export interface AdhanSettings {
  enabled: boolean;
  muezzin: string;
  fajrEnabled: boolean;
  dhuhrEnabled: boolean;
  asrEnabled: boolean;
  maghribEnabled: boolean;
  ishaEnabled: boolean;
  volume: number;
  calculationMethod?: 'MuslimWorldLeague' | 'UmmAlQura' | 'Egyptian' | 'Karachi' | 'Dubai' | 'NorthAmerica' | string;
  autoPlayLiveAdhan?: boolean;
}

export interface DhikrReciterInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar?: string;
  previewUrl: string;
  audioUrls?: { [dhikrId: string]: string };
  fallbackUrls?: { [dhikrId: string]: string };
  isBuiltIn?: boolean;
  sizeFormatted?: string;
  offlineReady?: boolean;
}

export interface DhikrReminderSettings {
  enabled: boolean;
  triggerOnAppOpen?: boolean; // تفعيل أو إيقاف التنبيه التلقائي المباشر فور فتح التطبيق
  intervalMinutes: number;
  soundType: 'voice_and_chime' | 'voice_only' | 'chime_only' | 'silent';
  category: 'all' | 'prophet_salawat' | 'istighfar' | 'baqiyat' | 'hawqala' | 'morning_evening' | 'custom';
  selectedDhikrIds?: string[];
  reciterId?: string; // 'mishary' | 'maher' | 'abdulbasit' | 'alghamdi' | 'qatami' | 'nufais' | 'sudais' | 'random'
  volume: number; // 0 - 100
  vibrate: boolean;
  showFloatingBanner: boolean;
  compactBanner?: boolean;
  autoDismissSeconds: number;
  speechRate?: number;
}

export interface DhikrItem {
  id: string;
  text: string;
  spokenText: string;
  category: 'prophet_salawat' | 'istighfar' | 'baqiyat' | 'hawqala' | 'morning_evening' | 'general';
  categoryName: string;
  virtue: string;
  source?: string;
  timeContext?: 'morning' | 'evening' | 'night' | 'day' | 'friday' | 'any';
  reciterAudios?: { [reciterId: string]: string };
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  geminiModel?: GeminiModel;
  model?: GeminiModel;
  showTafsir?: boolean;
  showTranslation?: boolean;
  username?: string;
  email?: string;
  photoURL?: string;
  creativityLevel?: number;
  reciter?: string;
  lastUpdated?: number | string;
  apiKey?: string;
  bookmarks?: Bookmark[];
  isLoggedIn?: boolean;
  uid?: string;
  location?: UserLocation;
  adhanSettings?: AdhanSettings;
  dhikrReminderSettings?: DhikrReminderSettings;
  analysisStyle?: 'smart_adaptive' | 'balanced' | 'detailed' | 'smart_summary' | 'spiritual' | 'scientific' | 'practical_life' | 'tadabbur' | string;
}

export interface Verse {
  text: string;
  arabicText?: string;
  surah: string;
  surahName?: string;
  number: number;
  surahNumber?: number;
  ayahNumber?: number;
  tafsir?: string;
  tadabbur?: string;
  translation?: string;
}

export interface QuranResponse {
  title?: string;
  introMessage?: string;
  verses: Verse[];
  explanation?: string;
  practicalAdvice?: string;
  tafakkur?: string;
  summary?: string;
  analysisStyle?: 'smart_adaptive' | 'balanced' | 'detailed' | 'smart_summary' | 'spiritual' | 'scientific' | 'practical_life' | 'tadabbur' | string;
}

export interface ChatMessage {
  id: string;
  role?: 'user' | 'ai';
  type?: 'text' | 'quran' | 'user' | 'ai' | string;
  content?: string;
  timestamp?: number;
  quranResponse?: QuranResponse;
  data?: any;
}

export interface ChatSession {
  id: string;
  title?: string;
  date?: number | string;
  preview?: string;
  messages: ChatMessage[];
  updatedAt?: number;
  createdAt?: number;
}

export interface Bookmark {
  id: string;
  verse: Verse;
  note?: string;
  createdAt?: number;
  dateAdded?: number;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface AppData {
  currentSessionId: string | null;
  sessions: ChatSession[];
  bookmarks: Bookmark[];
  settings: UserSettings;
}
