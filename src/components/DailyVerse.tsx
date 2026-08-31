import React, { useState, useEffect } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VERSES = [
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "الشرح", ayah: 6 },
  { text: "وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا", surah: "الطور", ayah: 48 },
  { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", surah: "الرعد", ayah: 28 },
  { text: "وَقُل رَّبِّ زِدْنِي عِلْمًا", surah: "طه", ayah: 114 },
  { text: "فَإِنِّي قَرِيبٌ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ", surah: "البقرة", ayah: 186 },
  { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", surah: "الطلاق", ayah: 3 },
  { text: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا", surah: "آل عمران", ayah: 8 },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", surah: "البقرة", ayah: 153 },
  { text: "وَقُولُوا لِلنَّاسِ حُسْنًا", surah: "البقرة", ayah: 83 },
  { text: "وَأَحْسِنُوا ۛ إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ", surah: "البقرة", ayah: 195 },
  { text: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", surah: "الزمر", ayah: 53 },
  { text: "وَاللَّهُ يَعْلَمُ مَا فِي قُلُوبِكُمْ", surah: "الأحزاب", ayah: 51 }
];

interface DailyVerseProps {
  onOpenQuran?: (surah?: number, ayah?: number, view?: any) => void;
}

export const DailyVerse: React.FC<DailyVerseProps> = ({ onOpenQuran }) => {
  const [verse, setVerse] = useState(VERSES[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Pick a verse based on the day of the year
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setVerse(VERSES[dayOfYear % VERSES.length]);
  }, []);

  const refreshVerse = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const currentIndex = VERSES.indexOf(verse);
      let nextIndex = Math.floor(Math.random() * VERSES.length);
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * VERSES.length);
      }
      setVerse(VERSES[nextIndex]);
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div 
      className="bg-[#FAF6EE] dark:bg-[#FAF6EE] rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(197,160,89,0.25)] border-2 border-[var(--color-gold)]/70 hover:border-[var(--color-gold)] relative overflow-hidden group transition-all duration-500 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
      onClick={() => {
        // Map surah names to numbers for VERSES
        const surahMap: Record<string, number> = {
          "الشرح": 94, "الطور": 52, "الرعد": 13, "طه": 20, "البقرة": 2, 
          "الطلاق": 65, "آل عمران": 3, "الزمر": 39, "الأحزاب": 33
        };
        const surahNumber = surahMap[verse.surah] || 1;
        onOpenQuran?.(surahNumber, verse.ayah, 'reader');
      }}
    >
      <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-[var(--color-gold)] via-[var(--color-gold-light)] to-[var(--color-gold-dark)]"></div>
      
      {/* Subtle gold top border line glow */}
      <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-90"></div>

      <div className="flex items-center justify-between mb-2.5 relative z-10">
        <div className="flex items-center gap-2 text-[#7A5812]">
          <div className="p-1.5 bg-[#F1E5D1] rounded-lg border border-[var(--color-gold)]/40 shadow-inner group-hover:scale-105 transition-transform duration-500">
            <BookOpen size={16} className="text-[#8B6B23]" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-[#2C3E35]">آية وتأمل</h3>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            refreshVerse();
          }}
          className={`p-1 text-[#8B6B23] hover:bg-[#F1E5D1] rounded-lg transition-all border border-transparent hover:border-[var(--color-gold)]/40 ${isRefreshing ? 'animate-spin' : ''}`}
          title="آية أخرى"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${verse.surah}-${verse.ayah}-${verse.text}`}
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center relative z-10 my-0.5"
        >
          <p className="text-sm sm:text-base md:text-lg font-bold leading-[1.7] text-center text-[#1C2B26] mb-2.5 px-1 quran-text drop-shadow-xs tracking-normal">
            "{verse.text}"
          </p>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-black text-[#7A5812] bg-[#F1E5D1]/80 px-3 py-1 rounded-lg border border-[var(--color-gold)]/50 shadow-2xs">
            <span className="font-outfit">سورة {verse.surah}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]"></span>
            <span className="font-outfit">الآية {verse.ayah}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
