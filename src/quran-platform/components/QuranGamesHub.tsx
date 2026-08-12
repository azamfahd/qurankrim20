import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowRight, Map, Trophy, Sparkles } from 'lucide-react';
import QuranKidsGame from './QuranKidsGame';
import AyahCatcherGame from './AyahCatcherGame';
import QuranTreasureGame from './QuranTreasureGame';
import IslamicQuizGame from './IslamicQuizGame';

interface QuranGamesHubProps {
  surahData: any;
  currentSurah: number;
}

const QuranGamesHub: React.FC<QuranGamesHubProps> = ({ surahData, currentSurah }) => {
  const [activeGame, setActiveGame] = useState<'hub' | 'word' | 'catcher' | 'treasure' | 'quiz'>('hub');

  if (activeGame === 'quiz') {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setActiveGame('hub')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold"
        >
          <ArrowRight size={16} />
          العودة لقائمة الألعاب
        </button>
        <IslamicQuizGame onBackToHub={() => setActiveGame('hub')} />
      </div>
    );
  }

  if (activeGame === 'word') {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setActiveGame('hub')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold"
        >
          <ArrowRight size={16} />
          العودة لقائمة الألعاب
        </button>
        <QuranKidsGame surahData={surahData} currentSurah={currentSurah} />
      </div>
    );
  }

  if (activeGame === 'catcher') {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setActiveGame('hub')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold"
        >
          <ArrowRight size={16} />
          العودة لقائمة الألعاب
        </button>
        <AyahCatcherGame surahData={surahData} />
      </div>
    );
  }

  if (activeGame === 'treasure') {
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setActiveGame('hub')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm font-bold"
        >
          <ArrowRight size={16} />
          العودة لقائمة الألعاب
        </button>
        <QuranTreasureGame surahData={surahData} />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-3xl p-6 sm:p-10 border-4 border-white shadow-xl relative overflow-hidden text-center">
      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
        <Gamepad2 className="w-10 h-10 text-indigo-600" />
      </div>
      
      <h2 className="text-3xl font-black text-indigo-900 mb-2">ألعاب القرآن والعلوم الإسلامية 🎮</h2>
      <p className="text-indigo-700 font-bold mb-8 text-lg">اختر اللعبة لتبدأ المتعة والتحدي المعرفي في سورة {surahData?.name}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {/* NEW FEATURED GAME: Islamic Quiz Game */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveGame('quiz')}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 rounded-2xl shadow-xl border-2 border-emerald-300/60 text-white text-right relative overflow-hidden group sm:col-span-2 lg:col-span-3"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full mb-2 shadow-sm">
                <Sparkles size={12} />
                <span>لعبة جديدة مميزة (أوفلاين / أونلاين AI)</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-2 drop-shadow-md">فرسان القرآن والعلوم الإسلامية 🏆</h3>
              <p className="text-emerald-100 font-bold text-sm sm:text-base">
                مسابقة احترافية متدرجة من السهل إلى الصعب، تضم ألغاز الرموز والمعجزات، التفسير، قصص الأنبياء، والشريعة. تعمل بدون إنترنت مع خيار تحديث الأسئلة بالذكاء الاصطناعي!
              </p>
            </div>
            <Trophy className="w-16 h-16 text-amber-300 opacity-90 shrink-0 hidden sm:block" />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveGame('treasure')}
          className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-2xl shadow-lg border-2 border-white/50 text-white text-right relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h3 className="text-2xl font-black mb-1 drop-shadow-md">الكنز القرآني 🗺️</h3>
              <p className="text-amber-100 font-bold text-xs">مغامرة رائعة لاختبار حفظك والوصول للكنز</p>
            </div>
            <Map className="w-10 h-10 text-amber-200 opacity-80 shrink-0" />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveGame('catcher')}
          className="bg-gradient-to-br from-green-400 to-emerald-600 p-6 rounded-2xl shadow-lg border-2 border-white/50 text-white text-right relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          <h3 className="text-2xl font-black mb-1">صيد الآيات 🦋</h3>
          <p className="text-emerald-100 font-bold text-xs">التقط الكلمات الصحيحة بالترتيب</p>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveGame('word')}
          className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-2xl shadow-lg border-2 border-white/50 text-white text-right relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
          <h3 className="text-2xl font-black mb-1">أكمل الآية 🧩</h3>
          <p className="text-purple-100 font-bold text-xs">اختر الكلمة الناقصة لتكتمل الآية</p>
        </motion.button>
      </div>
    </div>
  );
};

export default QuranGamesHub;
