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

export const DailyVerse = React.memo<DailyVerseProps>(({ onOpenQuran }) => {
  const [verse, setVerse] = useState(VERSES[0]);

  useEffect(() => {
    // Pick a verse based on the day of the year
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setVerse(VERSES[dayOfYear % VERSES.length]);
  }, []);

  const refreshVerse = () => {
    const currentIndex = VERSES.indexOf(verse);
    let nextIndex = Math.floor(Math.random() * VERSES.length);
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * VERSES.length);
    }
    setVerse(VERSES[nextIndex]);
  };

  return (
    <div 
      className="bg-[#FAF6EE] dark:bg-[#FAF6EE] rounded-2xl p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(197,160,89,0.18)] border border-[var(--color-gold)]/60 hover:border-[var(--color-gold)] relative overflow-hidden group transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-[0.99]"
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
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.12)_0%,_transparent_70%)] pointer-events-none"></div>

      <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-[var(--color-gold)] via-[var(--color-gold-light)] to-[var(--color-gold-dark)]"></div>
      
      {/* Subtle gold top border line glow */}
      <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-80"></div>

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-1.5 text-[#7A5812]">
          <div className="p-1 bg-[#F1E5D1] rounded-md border border-[var(--color-gold)]/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
            <BookOpen size={14} className="text-[#8B6B23]" />
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-[#2C3E35]">آية وتأمل</h3>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            refreshVerse();
          }}
          className="p-1 text-[#8B6B23] hover:bg-[#F1E5D1] rounded-md transition-all border border-transparent hover:border-[var(--color-gold)]/40"
          title="آية أخرى"
        >
          <RefreshCw size={14} className="hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${verse.surah}-${verse.ayah}-${verse.text}`}
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center relative z-10 my-1"
        >
          <div className="relative w-full text-center">
            {/* Soft text glow effect */}
            <div className="absolute inset-0 bg-[var(--color-gold-light)]/15 blur-lg rounded-full scale-105 pointer-events-none"></div>
            
            <p 
              className="relative z-10 text-xl sm:text-2xl md:text-[26px] font-bold leading-[2.1] text-[#11241C] mb-3 px-2 quran-text tracking-normal drop-shadow-xs"
              style={{ textShadow: '0 1px 2px rgba(197, 160, 89, 0.25)' }}
            >
              "{verse.text}"
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-black text-[#7A5812] bg-[#F1E5D1]/90 px-3 py-1 rounded-lg border border-[var(--color-gold)]/50 shadow-2xs backdrop-blur-xs">
            <span className="font-outfit">سورة {verse.surah}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-gold)]"></span>
            <span className="font-outfit">الآية {verse.ayah}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
