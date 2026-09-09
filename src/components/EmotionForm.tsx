import React, { useState } from 'react';
import { Send, HelpCircle, X, Sparkles, WifiOff, Wifi, Lock, AlertCircle } from 'lucide-react';

interface EmotionFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isOnline: boolean;
  variant: 'centered' | 'bottom';
}

export const EmotionForm: React.FC<EmotionFormProps> = ({ onSubmit, isLoading, isOnline, variant }) => {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem('anis_chat_draft') || '';
    } catch {
      return '';
    }
  });
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    try {
      if (text) {
        localStorage.setItem('anis_chat_draft', text);
      } else {
        localStorage.removeItem('anis_chat_draft');
      }
    } catch (e) {}
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      return;
    }
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
      setText('');
      try {
        localStorage.removeItem('anis_chat_draft');
      } catch (e) {}
    }
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className={`relative max-w-full ${variant === 'centered' ? 'max-w-3xl mx-auto w-full' : 'w-full'}`} dir="rtl">
      <form 
        onSubmit={handleSubmit} 
        className="relative group perspective-1000 max-w-full"
      >
        {/* 3D Radiant Outer Warm Golden & Emerald Aura */}
        <div 
          className={`absolute -inset-0.5 sm:-inset-1 rounded-2xl sm:rounded-[34px] transition-all duration-700 pointer-events-none ${
            !isOnline
              ? 'bg-amber-600/20 opacity-40 blur-sm'
              : isFocused 
                ? 'bg-gradient-to-r from-amber-400/80 via-emerald-500/50 to-amber-400/80 opacity-90 blur-lg sm:blur-xl scale-[1.01] animate-pulse'
                : 'bg-gradient-to-r from-amber-300/40 via-emerald-400/25 to-amber-300/40 opacity-60 blur-md sm:blur-lg group-hover:opacity-80 group-hover:blur-xl'
          }`}
        />

        {/* Main 3D Container - Cream Paper / Parchment Quranic Aesthetic or Offline Locked Aesthetic */}
        <div 
          className={`relative flex items-center transition-all duration-500 rounded-2xl sm:rounded-3xl p-1.5 sm:p-2.5 max-w-full overflow-hidden ${
            !isOnline
              ? 'bg-gradient-to-b from-[#FAF8F5] via-[#F3ECE0] to-[#EAE2D2] border-2 border-amber-500/60 opacity-90 cursor-not-allowed shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
              : variant === 'centered'
                ? 'bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE1] backdrop-blur-2xl border-2 border-amber-300/80'
                : 'bg-gradient-to-b from-[#FFFDF9] to-[#F5EFE1] backdrop-blur-2xl border-2 border-amber-300/80'
          } ${
            isOnline && isFocused 
              ? 'border-amber-500 shadow-[0_20px_50px_rgba(180,130,50,0.25),0_0_25px_rgba(217,178,86,0.4),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(180,140,80,0.15)] scale-[1.005]'
              : isOnline
                ? 'shadow-[0_15px_35px_rgba(120,90,40,0.12),0_0_15px_rgba(217,178,86,0.15),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(180,140,80,0.1)] hover:border-amber-400 hover:shadow-[0_20px_45px_rgba(120,90,40,0.18),0_0_20px_rgba(217,178,86,0.25)]'
                : ''
          }`}
        >
          {/* Subtle Quranic Arabesque/Paper Texture Feel */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none rounded-2xl sm:rounded-3xl" />

          {/* Top 3D Golden/Emerald Specular Light Line */}
          <div className="absolute top-0 inset-x-4 sm:inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none rounded-full" />

          {/* Leading 3D Badge Icon */}
          <div className={`flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border shrink-0 transition-colors ${
            !isOnline
              ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
              : 'bg-gradient-to-br from-amber-100 via-amber-50 to-emerald-50 border-amber-300/60 text-amber-800 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_8px_rgba(180,130,50,0.15)]'
          }`}>
            {!isOnline ? (
              <div className="relative flex items-center justify-center">
                <WifiOff size={18} className="text-amber-800 sm:w-5 sm:h-5" />
                <Lock size={10} className="absolute -bottom-1 -right-1 text-red-600 bg-amber-100 rounded-full p-0.2" />
              </div>
            ) : isFocused ? (
              <Sparkles size={18} className="text-amber-600 animate-spin-slow drop-shadow sm:w-5 sm:h-5" />
            ) : (
              <HelpCircle size={18} className="text-amber-700 drop-shadow-[0_0_4px_rgba(217,119,6,0.3)] transition-transform duration-300 group-hover:scale-110 sm:w-5 sm:h-5" />
            )}
          </div>

          {/* Input Text Field */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => isOnline && setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              isOnline 
                ? "ما هو سؤالك أو ما تشعر به؟ اكتب وسيجيبك أنيس القلوب..." 
                : "مربع البحث والاستفسار مغلق (يتطلب الاتصال بالإنترنت)"
            }
            disabled={!isOnline || isLoading}
            className={`flex-1 min-w-0 bg-transparent py-2.5 sm:py-4 px-2 sm:px-4 text-xs sm:text-base md:text-lg font-bold focus:outline-none border-none tracking-wide ${
              !isOnline
                ? 'text-amber-900/50 placeholder:text-amber-900/50 cursor-not-allowed select-none'
                : 'text-emerald-950 placeholder:text-amber-900/45'
            }`}
            dir="rtl"
          />

          {/* Clear Button when user typed text */}
          {text.trim() && !isLoading && isOnline && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-amber-800/60 hover:text-amber-900 rounded-full hover:bg-amber-100/60 transition-colors shrink-0"
              title="مسح النص"
            >
              <X size={16} />
            </button>
          )}

          {/* 3D Glowing Raised Submit Button */}
          <button
            type="submit"
            disabled={!isOnline || !text.trim() || isLoading}
            className={`relative px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 shrink-0 overflow-hidden ${
              !isOnline
                ? 'bg-amber-200/80 text-amber-800/40 border border-amber-300/50 cursor-not-allowed shadow-none'
                : text.trim() && !isLoading
                  ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_6px_20px_rgba(217,119,6,0.35),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:brightness-105 hover:shadow-[0_8px_25px_rgba(217,119,6,0.5)] active:translate-y-0.5 active:shadow-[0_2px_8px_rgba(217,119,6,0.3)] cursor-pointer'
                  : 'bg-amber-100/70 text-amber-800/40 border border-amber-200/50 cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
            }`}
            title={
              !isOnline
                ? "البحث والاستفسار مغلق حالياً - يتطلب إتصال بالإنترنت"
                : "إرسال السؤال للمساعد الذكي"
            }
          >
            {isLoading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="hidden sm:inline">
                  إرسال
                </span>
                <Send size={15} className={`transition-transform duration-300 sm:w-[17px] sm:h-[17px] ${text.trim() && isOnline ? 'rtl:-scale-x-100 translate-x-[-1px] drop-shadow' : ''}`} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Offline Alert Notification when disconnected */}
      {!isOnline && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs p-3 sm:p-3.5 mt-2.5 bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-amber-950/95 border-2 border-amber-500/70 rounded-2xl text-amber-100 font-medium backdrop-blur-md shadow-xl animate-fade-in max-w-full overflow-hidden">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0 text-amber-300 shadow-inner mt-0.5 sm:mt-0">
              <WifiOff size={18} className="animate-pulse text-amber-300" />
            </div>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-amber-200">
                  تنبيه: مربع البحث والاستفسار مغلق لعدم توفر الإنترنت
                </span>
                <span className="text-[10px] bg-red-500/20 text-red-200 font-black px-2 py-0.5 rounded-md border border-red-400/30 whitespace-nowrap">
                  غير متصل
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-amber-200/90 mt-1 font-semibold leading-relaxed">
                يرجى فتح أو الاتصال بالإنترنت لتتكن من كتابة أسئلتك والبحث في المساعد القرآني الذكي.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && navigator.onLine) {
                window.dispatchEvent(new Event('online'));
              } else {
                alert('لا يزال جهازك غير متصل بالإنترنت. يرجى تفعيل شبكة الواي فاي (Wi-Fi) أو بيانات الهاتف المحمول.');
              }
            }}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs transition-all duration-300 flex items-center justify-center gap-1.5 shrink-0 shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Wifi size={14} />
            <span>فتح / فحص اتصال الإنترنت</span>
          </button>
        </div>
      )}
    </div>
  );
};

