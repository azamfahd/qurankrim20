import { MushafTheme } from '../store/QuranContext';

export interface MushafThemeItem {
  id: MushafTheme;
  name: string;
  sub: string;
  previewBg: string;
  previewBorder: string;
  previewHeader: string;
  accent: string;
  textColor: string;
}

export const MUSHAF_THEMES: MushafThemeItem[] = [
  {
    id: 'royal_green',
    name: 'مصحف المدينة الملكي',
    sub: 'طبعة مجمع الملك فهد',
    previewBg: 'bg-[#fcf8ed]',
    previewBorder: 'border-[#1b4332]',
    previewHeader: 'bg-[#1b4332] text-amber-200',
    accent: '#1b4332',
    textColor: 'text-gray-900',
  },
  {
    id: 'shamarli',
    name: 'مصحف ابن عثمان (الشمرلي)',
    sub: 'الطبعة المصرية التراثية',
    previewBg: 'bg-[#f5eecb]',
    previewBorder: 'border-[#8c6239]',
    previewHeader: 'bg-[#8c6239] text-amber-100',
    accent: '#8c6239',
    textColor: 'text-[#2a1a08]',
  },
  {
    id: 'golden',
    name: 'المصحف الذهبي الفاخر',
    sub: 'إطار مذهب وزخارف أندلسية',
    previewBg: 'bg-[#fffdf7]',
    previewBorder: 'border-amber-400',
    previewHeader: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 text-white',
    accent: '#d97706',
    textColor: 'text-amber-950',
  },
  {
    id: 'tajweed',
    name: 'مصحف التجويد الملون',
    sub: 'ورق مخملي مع دلالات الأحكام',
    previewBg: 'bg-[#fdf6f0]',
    previewBorder: 'border-[#b5838d]',
    previewHeader: 'bg-[#6d597a] text-pink-100',
    accent: '#b5838d',
    textColor: 'text-gray-900',
  },
  {
    id: 'night',
    name: 'المصحف الليلي الفاخر',
    sub: 'مريح للعين ومناسب للظلام',
    previewBg: 'bg-[#121824]',
    previewBorder: 'border-emerald-800',
    previewHeader: 'bg-[#0a0f18] text-emerald-400 border-b border-emerald-900',
    accent: '#34d399',
    textColor: 'text-emerald-300',
  }
];
