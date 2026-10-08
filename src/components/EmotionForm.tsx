import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, HelpCircle, X, Sparkles, WifiOff, Lock, 
  Mic, MicOff, CornerDownLeft
} from 'lucide-react';

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
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea according to content
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, variant === 'centered' ? 48 : 42), 160);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  // Draft persistence
  useEffect(() => {
    try {
      if (text) {
        localStorage.setItem('anis_chat_draft', text);
      } else {
        localStorage.removeItem('anis_chat_draft');
      }
    } catch (e) {}
  }, [text]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'ar-SA';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setText(prev => {
              const cleaned = prev.trim();
              return cleaned ? `${cleaned} ${transcript}` : transcript;
            });
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current || !isOnline) return;
    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (e) {
      console.warn('Toggle speech recognition error:', e);
      setIsListening(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isOnline || isLoading) return;
    
    const trimmed = text.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setText('');
      try {
        localStorage.removeItem('anis_chat_draft');
      } catch (e) {}
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without shift submits, Shift+Enter or Ctrl+Enter inserts newline
    if (e.key === 'Enter') {
      if (!e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  const handleClear = () => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInsertNewline = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = text;
    const nextText = current.substring(0, start) + '\n' + current.substring(end);
    setText(nextText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
        textareaRef.current.focus();
      }
    }, 10);
  };

  const charCount = text.length;

  return (
    <div className={`relative max-w-full ${variant === 'centered' ? 'max-w-3xl mx-auto w-full' : 'w-full'}`} dir="rtl">
      {/* Main Input Form */}
      <form 
        onSubmit={handleSubmit} 
        className="relative group perspective-1000 max-w-full"
      >
        {/* 3D Radiant Outer Warm Golden & Emerald Aura */}
        <div 
          className={`absolute -inset-0.5 sm:-inset-1 rounded-2xl sm:rounded-[30px] transition-all duration-500 pointer-events-none ${
            !isOnline
              ? 'bg-amber-600/20 opacity-30 blur-sm'
              : isFocused 
                ? 'bg-gradient-to-r from-amber-400/80 via-emerald-500/50 to-amber-400/80 opacity-90 blur-md sm:blur-xl scale-[1.008]'
                : 'bg-gradient-to-r from-amber-300/35 via-emerald-400/20 to-amber-300/35 opacity-50 blur-sm sm:blur-md group-hover:opacity-75'
          }`}
        />

        {/* Main Flexible Card Container */}
        <div 
          className={`relative flex flex-col transition-all duration-300 rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 max-w-full overflow-hidden ${
            !isOnline
              ? 'bg-gradient-to-b from-[#FAF8F5] via-[#F3ECE0] to-[#EAE2D2] border-2 border-amber-500/50 opacity-90 cursor-not-allowed shadow-md'
              : variant === 'centered'
                ? 'bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE1] backdrop-blur-2xl border-2 border-amber-300/85'
                : 'bg-gradient-to-b from-[#FFFDF9] to-[#F5EFE1] backdrop-blur-2xl border-2 border-amber-300/85'
          } ${
            isOnline && isFocused 
              ? 'border-amber-500 shadow-[0_12px_40px_rgba(180,130,50,0.22),0_0_20px_rgba(217,178,86,0.35),inset_0_1px_2px_rgba(255,255,255,1)]'
              : isOnline
                ? 'shadow-[0_10px_30px_rgba(120,90,40,0.1),0_0_12px_rgba(217,178,86,0.12),inset_0_1px_1px_rgba(255,255,255,1)] hover:border-amber-400'
                : ''
          }`}
        >
          {/* Subtle Quranic Arabesque/Paper Texture Feel */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] pointer-events-none rounded-2xl sm:rounded-3xl" />

          {/* Top 3D Golden/Emerald Specular Light Line */}
          <div className="absolute top-0 inset-x-4 sm:inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none rounded-full" />

          {/* Core Input Body */}
          <div className="flex items-start gap-2.5 sm:gap-3.5 w-full">
            {/* Leading 3D Badge Icon */}
            <div className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border shrink-0 transition-colors mt-0.5 ${
              !isOnline
                ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm'
                : 'bg-gradient-to-br from-amber-100 via-amber-50 to-emerald-50 border-amber-300/60 text-amber-800 shadow-[inset_0_1px_2px_rgba(255,255,255,1),0_2px_6px_rgba(180,130,50,0.12)]'
            }`}>
              {!isOnline ? (
                <div className="relative flex items-center justify-center">
                  <WifiOff size={17} className="text-amber-800 sm:w-5 sm:h-5" />
                  <Lock size={10} className="absolute -bottom-1 -right-1 text-red-600 bg-amber-100 rounded-full p-0.2" />
                </div>
              ) : isListening ? (
                <Mic size={18} className="text-red-600 animate-pulse sm:w-5 sm:h-5" />
              ) : isFocused ? (
                <Sparkles size={18} className="text-amber-600 animate-spin-slow drop-shadow sm:w-5 sm:h-5" />
              ) : (
                <HelpCircle size={18} className="text-amber-700 drop-shadow-[0_0_4px_rgba(217,119,6,0.3)] transition-transform duration-300 group-hover:scale-110 sm:w-5 sm:h-5" />
              )}
            </div>

            {/* Flexible Multi-line Textarea */}
            <div className="flex-1 min-w-0 flex flex-col">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => isOnline && setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={1}
                placeholder="ما هو سؤالك أو ما تشعر به؟ اكتب وسيجيبك أنيس القلوب..."
                disabled={!isOnline || isLoading}
                className={`w-full resize-none bg-transparent py-1.5 sm:py-2 px-1 text-xs sm:text-base md:text-base font-bold focus:outline-none border-none tracking-wide leading-relaxed overflow-y-auto custom-scrollbar ${
                  !isOnline
                    ? 'text-amber-900/50 placeholder:text-amber-900/40 cursor-not-allowed select-none'
                    : 'text-emerald-950 placeholder:text-amber-900/50'
                }`}
                style={{
                  maxHeight: '160px',
                  minHeight: variant === 'centered' ? '46px' : '40px',
                }}
                dir="rtl"
              />
            </div>

            {/* Clear Button when user typed text */}
            {text.trim() && !isLoading && isOnline && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-amber-800/60 hover:text-amber-950 rounded-full hover:bg-amber-200/50 transition-colors shrink-0 mt-1"
                title="مسح النص بالكامل"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Bottom Flexible Control Toolbar */}
          <div className="mt-1.5 pt-2 border-t border-amber-300/40 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Right Tools: Voice & Newline */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Speech to Text Dictation Button */}
              {speechSupported && isOnline && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-sm' 
                      : 'bg-amber-100/80 text-amber-950 border-amber-300/60 hover:bg-amber-200/90'
                  }`}
                  title={isListening ? 'إيقاف الإملاء الصوتي' : 'إملاء السؤال صوتياً'}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  <span className="hidden sm:inline">{isListening ? 'جاري الاستماع...' : 'إملاء صوتي'}</span>
                </button>
              )}

              {/* Insert Newline Button for touch screens */}
              {isOnline && (
                <button
                  type="button"
                  onClick={handleInsertNewline}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-100/70 text-amber-950 border border-amber-300/50 hover:bg-amber-200/80 transition-all"
                  title="النزول سطر جديد داخل مربع النص (أو اضغط Shift+Enter)"
                >
                  <CornerDownLeft size={13} className="text-amber-800" />
                  <span className="hidden xs:inline">سطر جديد</span>
                </button>
              )}
            </div>

            {/* Left Tools: Character Count & 3D Glowing Raised Submit Button */}
            <div className="flex items-center gap-2 mr-auto">
              {charCount > 0 && isOnline && (
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-900/60 select-none">
                  {charCount} حرف
                </span>
              )}

              <button
                type="submit"
                disabled={!isOnline || !text.trim() || isLoading}
                className={`relative px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 shrink-0 overflow-hidden ${
                  !isOnline
                    ? 'bg-amber-200/80 text-amber-800/40 border border-amber-300/50 cursor-not-allowed shadow-none'
                    : text.trim() && !isLoading
                      ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_4px_16px_rgba(217,119,6,0.35),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:brightness-105 hover:shadow-[0_6px_20px_rgba(217,119,6,0.5)] active:translate-y-0.5 cursor-pointer'
                      : 'bg-amber-100/70 text-amber-800/40 border border-amber-200/50 cursor-not-allowed shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]'
                }`}
                title={
                  !isOnline
                    ? "المساعد الذكي يتطلب الاتصال بالإنترنت"
                    : "إرسال السؤال للمساعد الذكي"
                }
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>إرسال</span>
                    <Send size={14} className={`transition-transform duration-300 ${text.trim() && isOnline ? 'rtl:-scale-x-100 translate-x-[-1px] drop-shadow' : ''}`} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
