import React, { useState, useRef, useEffect } from 'react';
import { Send, HelpCircle, X, Sparkles, WifiOff, Lock, Mic, MicOff, Lightbulb, CornerDownLeft, Sparkle, RefreshCw } from 'lucide-react';

interface EmotionFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isOnline: boolean;
  variant: 'centered' | 'bottom';
  onPromptSelect?: (prompt: string) => void;
}

export const EmotionForm: React.FC<EmotionFormProps> = ({ 
  onSubmit, 
  isLoading, 
  isOnline, 
  variant,
  onPromptSelect 
}) => {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem('anis_chat_draft') || '';
    } catch {
      return '';
    }
  });
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const hasSpeechSupport = 
    typeof window !== 'undefined' && 
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  // Sync draft to localStorage
  useEffect(() => {
    try {
      if (text) {
        localStorage.setItem('anis_chat_draft', text);
      } else {
        localStorage.removeItem('anis_chat_draft');
      }
    } catch (e) {}
  }, [text]);

  // Dynamic flexible auto-resize for textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const minH = variant === 'centered' ? 48 : 42;
    const maxH = variant === 'centered' ? 180 : 130;
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(Math.max(scrollH, minH), maxH)}px`;
  }, [text, variant]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isOnline) return;

    if (text.trim() && !isLoading) {
      if (isListening && recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        setIsListening(false);
      }
      onSubmit(text.trim());
      setText('');
      setShowTemplates(false);
      try {
        localStorage.removeItem('anis_chat_draft');
      } catch (e) {}
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift/Alt sends the message immediately
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const toggleListening = () => {
    if (!hasSpeechSupport || !isOnline) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const professionalTemplates = [
    { label: "سكينة القلب", prompt: "أشعر بضيق وقلق في صدري، وأريد آيات قرآنية تجلب السكينة والطمأنينة لقلبي" },
    { label: "اتخاذ القرار", prompt: "محتار في اتخاذ قرار مصيري، كيف يرشدني القرآن لحسن التوكل واليقين؟" },
    { label: "تفريج الكرب", prompt: "أمرّ بفترة ابتلاء وصعوبة، أريد آيات تُذكرني بفرج الله ورحمته القريبة" },
    { label: "الخشوع والهمة", prompt: "كيف أستحضر الخشوع وأجدد إيماني وعلاقتي بكتاب الله والصلوات؟" },
    { label: "البر والأخلاق", prompt: "ما هي وصايا القرآن في كظم الغيظ، وحسن التعامل مع الأهل والناس؟" },
  ];

  return (
    <div className={`relative max-w-full ${variant === 'centered' ? 'max-w-3xl mx-auto w-full' : 'w-full'}`} dir="rtl">
      <form 
        onSubmit={handleSubmit} 
        className="relative group perspective-1000 max-w-full"
      >
        {/* 3D Radiant Outer Warm Golden & Emerald Aura */}
        <div 
          className={`absolute -inset-0.5 sm:-inset-1 rounded-2xl sm:rounded-[32px] transition-all duration-700 pointer-events-none ${
            !isOnline
              ? 'bg-amber-600/20 opacity-40 blur-sm'
              : isFocused 
                ? 'bg-gradient-to-r from-amber-400/80 via-emerald-500/50 to-amber-400/80 opacity-90 blur-lg sm:blur-xl scale-[1.01] animate-pulse'
                : 'bg-gradient-to-r from-amber-300/40 via-emerald-400/25 to-amber-300/40 opacity-60 blur-md sm:blur-lg group-hover:opacity-80 group-hover:blur-xl'
          }`}
        />

        {/* Main Flexible Container - Cream Paper / Parchment Quranic Aesthetic */}
        <div 
          className={`relative flex flex-col transition-all duration-500 rounded-2xl sm:rounded-3xl p-2 sm:p-3 max-w-full overflow-hidden ${
            !isOnline
              ? 'bg-gradient-to-b from-[#FAF8F5] via-[#F3ECE0] to-[#EAE2D2] border-2 border-amber-500/60 opacity-90 cursor-not-allowed shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
              : 'bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE1] backdrop-blur-2xl border-2 border-amber-300/80'
          } ${
            isOnline && isFocused 
              ? 'border-amber-500 shadow-[0_20px_50px_rgba(180,130,50,0.25),0_0_25px_rgba(217,178,86,0.4),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-2px_6px_rgba(180,140,80,0.15)] scale-[1.003]'
              : isOnline
                ? 'shadow-[0_15px_35px_rgba(120,90,40,0.12),0_0_15px_rgba(217,178,86,0.15),inset_0_1px_1px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(180,140,80,0.1)] hover:border-amber-400'
                : ''
          }`}
        >
          {/* Subtle Quranic Arabesque/Paper Texture Feel */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none rounded-2xl sm:rounded-3xl" />

          {/* Top Specular Light Line */}
          <div className="absolute top-0 inset-x-4 sm:inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none rounded-full" />

          {/* Primary Input Row: Badge + Flexible Textarea + Action Controls */}
          <div className="flex items-end gap-2 sm:gap-2.5 w-full relative z-10">
            {/* Leading Badge Icon */}
            <div className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border shrink-0 transition-colors mb-0.5 ${
              !isOnline
                ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                : 'bg-gradient-to-br from-amber-100 via-amber-50 to-emerald-50 border-amber-300/60 text-amber-800 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_8px_rgba(180,130,50,0.15)]'
            }`}>
              {!isOnline ? (
                <div className="relative flex items-center justify-center">
                  <WifiOff size={18} className="text-amber-800" />
                  <Lock size={10} className="absolute -bottom-1 -right-1 text-red-600 bg-amber-100 rounded-full" />
                </div>
              ) : isListening ? (
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-full h-full rounded-xl bg-red-400 animate-ping opacity-60"></span>
                  <Mic size={18} className="text-red-600 animate-pulse relative z-10" />
                </div>
              ) : isFocused ? (
                <Sparkles size={18} className="text-amber-600 animate-spin-slow drop-shadow" />
              ) : (
                <HelpCircle size={18} className="text-amber-700 drop-shadow-[0_0_4px_rgba(217,119,6,0.3)] transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>

            {/* Auto-growing Flexible Textarea */}
            <div className="flex-1 min-w-0 relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => isOnline && setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="ما هو سؤالك أو ما تشعر به؟ اكتب وسيجيبك أنيس القلوب..."
                disabled={!isOnline || isLoading}
                rows={1}
                className={`w-full bg-transparent py-2.5 sm:py-3 px-1 sm:px-2.5 text-xs sm:text-base font-bold focus:outline-none border-none tracking-wide resize-none leading-relaxed overflow-y-auto ${
                  !isOnline
                    ? 'text-amber-900/50 placeholder:text-amber-900/40 cursor-not-allowed select-none'
                    : 'text-emerald-950 placeholder:text-amber-900/45'
                }`}
                style={{
                  minHeight: variant === 'centered' ? '46px' : '40px',
                  maxHeight: variant === 'centered' ? '180px' : '130px',
                }}
                dir="rtl"
              />
            </div>

            {/* Functional Buttons: Clear, Voice Dictation, Submit */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 mb-0.5">
              {/* Clear Button */}
              {text.trim() && !isLoading && isOnline && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-amber-800/60 hover:text-amber-900 rounded-xl hover:bg-amber-100/60 transition-colors shrink-0 cursor-pointer"
                  title="مسح النص"
                >
                  <X size={16} />
                </button>
              )}

              {/* Voice Input Button (Speech-to-Text) */}
              {hasSpeechSupport && isOnline && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all duration-200 shrink-0 cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white shadow-md animate-pulse'
                      : 'text-amber-800/70 hover:text-amber-900 hover:bg-amber-100/70 border border-amber-200/60'
                  }`}
                  title={isListening ? "إيقاف التسجيل الصوتي" : "تحدث بصوتك لطرح السؤال"}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isOnline || !text.trim() || isLoading}
                className={`relative px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-300 shrink-0 overflow-hidden ${
                  !isOnline
                    ? 'bg-amber-200/80 text-amber-800/40 border border-amber-300/50 cursor-not-allowed shadow-none'
                    : text.trim() && !isLoading
                      ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_6px_20px_rgba(217,119,6,0.35),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:brightness-105 hover:shadow-[0_8px_25px_rgba(217,119,6,0.5)] active:translate-y-0.5 cursor-pointer'
                      : 'bg-amber-100/70 text-amber-800/40 border border-amber-200/50 cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                }`}
                title={
                  !isOnline
                    ? "المساعد الذكي يتطلب الاتصال بالإنترنت"
                    : "إرسال السؤال للمساعد الذكي"
                }
              >
                {isLoading ? (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="hidden sm:inline">إرسال</span>
                    <Send 
                      size={15} 
                      className={`transition-transform duration-300 sm:w-4 sm:h-4 ${
                        text.trim() && isOnline ? 'rtl:-scale-x-100 drop-shadow' : ''
                      }`} 
                    />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub-bar: Character count & Professional helper tips */}
          <div className="flex items-center justify-between pt-1.5 px-1 border-t border-amber-200/50 text-[10px] text-amber-800/70 font-medium select-none">
            <div className="flex items-center gap-2">
              {variant === 'centered' && (
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="inline-flex items-center gap-1 font-bold text-amber-900 hover:text-amber-950 transition-colors cursor-pointer bg-amber-100/60 hover:bg-amber-200/60 px-2 py-0.5 rounded-lg border border-amber-300/40"
                >
                  <Lightbulb size={11} className="text-amber-600" />
                  <span>{showTemplates ? "إخفاء النماذج" : "نماذج أسئلة احترافية"}</span>
                </button>
              )}
              {isListening && (
                <span className="text-red-600 font-bold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  جاري الاستماع لصوتك...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {text.length > 0 && (
                <span className={`${text.length > 2500 ? 'text-red-600 font-bold' : 'text-amber-800/60'}`}>
                  {text.length} / 3000 حرف
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1 opacity-70 text-[9px]">
                <CornerDownLeft size={10} />
                Enter للإرسال • Shift+Enter لسطر جديد
              </span>
            </div>
          </div>

          {/* Expandable Professional Question Templates Tray */}
          {showTemplates && variant === 'centered' && (
            <div className="mt-2.5 pt-2 border-t border-amber-200/70 animate-in fade-in duration-200">
              <p className="text-[11px] font-bold text-emerald-950 mb-1.5 flex items-center gap-1">
                <Sparkle size={12} className="text-amber-600" />
                <span>اختر نموذجاً لصياغة سؤالك القرآني باحترافية:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {professionalTemplates.map((t, idx) => (
                  <button
                    key={`template-${idx}`}
                    type="button"
                    onClick={() => {
                      setText(t.prompt);
                      setShowTemplates(false);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-100/80 hover:bg-amber-200/90 text-amber-950 border border-amber-300/60 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>{t.label}:</span>
                    <span className="font-normal opacity-90 truncate max-w-[200px] sm:max-w-xs">{t.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
