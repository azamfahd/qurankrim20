import React, { useState, useEffect, useRef } from 'react';
import { useQuranContext } from '../store/QuranContext';
import { QuranDataService } from '../services/QuranDataService';
import { QuranSyncService } from '../services/quranSyncService';
import { ChevronRight, MessageCircle, Share2, Download, Image as ImageIcon, Book } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

const TAFSIRS = [
  { id: 'ar.muyassar', name: 'التفسير الميسر' },
  { id: 'ar.jalalayn', name: 'تفسير الجلالين' },
  { id: 'ar.qurtubi', name: 'تفسير القرطبي' },
  { id: 'ar.tabari', name: 'تفسير الطبري' },
  { id: 'ar.ibnkathir', name: 'تفسير ابن كثير' },
  { id: 'en.transliteration', name: 'English Transliteration' },
  { id: 'en.asad', name: 'English (Muhammad Asad)' },
];

const QuranTafsir = () => {
  const { currentSurah, currentAyah, setCurrentView, fontSize } = useQuranContext();
  const [tafsirData, setTafsirData] = useState<any>(null);
  const [ayahData, setAyahData] = useState<any>(null);
  const [surahName, setSurahName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedTafsir, setSelectedTafsir] = useState('ar.muyassar');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchTafsir = async () => {
      setLoading(true);
      // Fetch the uthmani text for the ayah as well
      const ayahRes = await QuranDataService.getTafsir(currentSurah, currentAyah, 'quran-uthmani');
      setAyahData(ayahRes);
      if (ayahRes && ayahRes.surah) {
        setSurahName(ayahRes.surah.name);
      }
      
      const data = await QuranDataService.getTafsir(currentSurah, currentAyah, selectedTafsir);
      setTafsirData(data);
      setLoading(false);
    };
    fetchTafsir();
  }, [currentSurah, currentAyah, selectedTafsir]);

  const shareTafsir = () => {
    if (!tafsirData || !ayahData) return;
    const textToShare = `الآية:\n${ayahData.text}\n\nالتفسير (${TAFSIRS.find(t => t.id === selectedTafsir)?.name}):\n${tafsirData.text}\n\nسورة ${currentSurah} - آية ${currentAyah}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'تفسير آية',
        text: textToShare
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(textToShare);
      alert('تم نسخ التفسير إلى الحافظة');
    }
  };

  const downloadImageCard = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `ayah-${currentSurah}-${currentAyah}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image, trying fallback without external fonts...', err);
      try {
        const dataUrl = await htmlToImage.toPng(cardRef.current, {
          quality: 1,
          pixelRatio: 2,
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          },
          skipFonts: true
        });
        
        const link = document.createElement('a');
        link.download = `ayah-${currentSurah}-${currentAyah}.png`;
        link.href = dataUrl;
        link.click();
      } catch (fallbackErr) {
        console.error('Fallback image generation failed', fallbackErr);
        alert('حدث خطأ أثناء إنشاء البطاقة');
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (loading && !tafsirData) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] overflow-y-auto">
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('reader')}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <div>
            <h2 className="font-bold text-[var(--color-primary-dark)] text-lg">التفسير والتدبر</h2>
            <p className="text-xs text-gray-500">سورة {currentSurah} - آية {currentAyah}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTafsir}
            onChange={(e) => setSelectedTafsir(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] block p-2 outline-none max-w-[120px] sm:max-w-[200px] truncate"
          >
            {TAFSIRS.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button 
            onClick={shareTafsir}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors hidden sm:flex"
            title="مشاركة النص"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full pb-32">
        {tafsirData && ayahData && (
          <>
            {/* Shareable Card Container (hidden by default, used for image generation) */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
              <div 
                ref={cardRef} 
                className="bg-white p-10 relative overflow-hidden" 
                style={{ width: '800px', borderRadius: '32px' }}
                dir="rtl"
              >
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/10 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-primary)]/10 rounded-tr-full"></div>
                
                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary-dark)] px-4 py-2 rounded-full mb-8 font-bold border border-[var(--color-primary)]/20">
                    {surahName || `سورة ${currentSurah}`} - آية {currentAyah}
                  </div>
                  
                  <p 
                    className="text-[var(--color-primary-dark)] leading-loose mb-10"
                    style={{ fontSize: '32px', fontFamily: "'Amiri', serif" }}
                  >
                    {ayahData.text}
                  </p>
                  
                  <div className="w-24 h-px bg-[var(--color-primary)]/30 mx-auto mb-10"></div>
                  
                  <h3 className="font-bold text-[var(--color-primary-dark)] text-xl mb-4">{TAFSIRS.find(t => t.id === selectedTafsir)?.name}</h3>
                  <p className="text-gray-700 leading-relaxed text-justify" style={{ fontSize: '20px' }}>
                    {tafsirData.text}
                  </p>
                  
                  <div className="mt-12 flex items-center justify-center gap-2 text-[var(--color-primary)]/60 font-bold">
                    <Book size={20} />
                    <span>تطبيق أنيس القلوب</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ayah Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--color-primary)]/20 mb-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
              <p 
                className="text-[var(--color-primary-dark)] leading-loose relative z-10"
                style={{ fontSize: `${fontSize}px`, fontFamily: "'Amiri', serif" }}
              >
                {ayahData.text}
              </p>
            </div>

            <div className="flex justify-end mb-4">
              <button 
                onClick={downloadImageCard}
                disabled={isGeneratingImage}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm disabled:opacity-70"
              >
                {isGeneratingImage ? <div className="spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <ImageIcon size={16} />}
                {isGeneratingImage ? 'جاري التصميم...' : 'حفظ كبطاقة صورة'}
              </button>
            </div>

            {/* Tafsir */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                  <div className="spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-4 text-[var(--color-primary-dark)] border-b border-gray-100 pb-3">
                <Book className="w-5 h-5" />
                <h3 className="font-bold text-lg">{TAFSIRS.find(t => t.id === selectedTafsir)?.name}</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg text-justify whitespace-pre-wrap" dir={selectedTafsir.startsWith('en') ? 'ltr' : 'rtl'}>
                {tafsirData.text}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuranTafsir;
