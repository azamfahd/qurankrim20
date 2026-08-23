import React, { useState } from 'react';
import { Send, HelpCircle, X, Sparkles } from 'lucide-react';

interface EmotionFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isOnline: boolean;
  variant: 'centered' | 'bottom';
}

export const EmotionForm: React.FC<EmotionFormProps> = ({ onSubmit, isLoading, isOnline, variant }) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading && isOnline) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`relative ${variant === 'centered' ? 'max-w-3xl mx-auto w-full' : 'w-full'} group perspective-1000`}
      dir="rtl"
    >
      {/* 3D Radiant Outer Warm Golden & Emerald Aura */}
      <div 
        className={`absolute -inset-1 rounded-[28px] sm:rounded-[34px] transition-all duration-700 pointer-events-none ${
          isFocused 
            ? 'bg-gradient-to-r from-amber-400/80 via-emerald-500/50 to-amber-400/80 opacity-90 blur-xl scale-[1.02] animate-pulse' 
            : 'bg-gradient-to-r from-amber-300/40 via-emerald-400/25 to-amber-300/40 opacity-60 blur-lg group-hover:opacity-80 group-hover:blur-xl'
        }`}
      />

      {/* Main 3D Container - Cream Paper / Parchment Quranic Aesthetic */}
      <div 
        className={`relative flex items-center transition-all duration-500 rounded-2xl sm:rounded-3xl p-2 sm:p-2.5 ${
          variant === 'centered'
            ? 'bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE1] backdrop-blur-2xl border-2 border-amber-300/80'
            : 'bg-gradient-to-b from-[#FFFDF9] to-[#F5EFE1] backdrop-blur-2xl border-2 border-amber-300/70'
        } ${
          isFocused 
            ? 'border-amber-500 shadow-[0_20px_50px_rgba(180,130,50,0.25),0_0_25px_rgba(217,178,86,0.4),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(180,140,80,0.15)] scale-[1.01]' 
            : 'shadow-[0_15px_35px_rgba(120,90,40,0.12),0_0_15px_rgba(217,178,86,0.15),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(180,140,80,0.1)] hover:border-amber-400 hover:shadow-[0_20px_45px_rgba(120,90,40,0.18),0_0_20px_rgba(217,178,86,0.25)]'
        } ${
          !isOnline ? 'opacity-60 grayscale cursor-not-allowed border-red-400/50' : ''
        }`}
      >
        {/* Subtle Quranic Arabesque/Paper Texture Feel */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none rounded-2xl sm:rounded-3xl" />

        {/* Top 3D Golden Specular Light Line (Prismatic Edge Reflection) */}
        <div className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none rounded-full" />

        {/* Leading 3D Badge Icon */}
        <div className="flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-emerald-50 border border-amber-300/60 text-amber-800 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_8px_rgba(180,130,50,0.15)] shrink-0 pr-0.5">
          {isFocused ? (
            <Sparkles size={22} className="text-amber-600 animate-spin-slow drop-shadow-[0_0_6px_rgba(217,119,6,0.5)]" />
          ) : (
            <HelpCircle size={22} className="text-amber-700 drop-shadow-[0_0_4px_rgba(217,119,6,0.3)] transition-transform duration-300 group-hover:scale-110" />
          )}
        </div>

        {/* Input Text Field */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isOnline ? "ما هو سؤالك أو استفسارك؟" : "أنت غير متصل بالإنترنت حالياً"}
          disabled={isLoading || !isOnline}
          className="flex-1 bg-transparent py-3 sm:py-4 px-3 sm:px-4 text-emerald-950 placeholder:text-amber-900/40 text-sm sm:text-base md:text-lg font-bold focus:outline-none border-none tracking-wide"
          dir="rtl"
        />

        {/* Clear Button when user typed text */}
        {text.trim() && !isLoading && isOnline && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-amber-800/60 hover:text-amber-900 rounded-full hover:bg-amber-100/60 transition-colors mx-1 shrink-0"
            title="مسح النص"
          >
            <X size={18} />
          </button>
        )}

        {/* 3D Glowing Raised Submit Button - Islamic Royal Gold */}
        <button
          type="submit"
          disabled={!text.trim() || isLoading || !isOnline}
          className={`relative px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-300 shrink-0 overflow-hidden ${
            text.trim() && !isLoading && isOnline
              ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_6px_20px_rgba(217,119,6,0.35),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:brightness-105 hover:shadow-[0_8px_25px_rgba(217,119,6,0.5)] active:translate-y-0.5 active:shadow-[0_2px_8px_rgba(217,119,6,0.3)] cursor-pointer'
              : 'bg-amber-100/70 text-amber-800/40 border border-amber-200/50 cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
          }`}
          title="إرسال السؤال"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="hidden sm:inline">إرسال</span>
              <Send size={17} className={`transition-transform duration-300 ${text.trim() ? 'rtl:-scale-x-100 translate-x-[-1px] drop-shadow' : ''}`} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
