import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface EmotionFormProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isOnline: boolean;
  variant: 'centered' | 'bottom';
}

export const EmotionForm: React.FC<EmotionFormProps> = ({ onSubmit, isLoading, isOnline, variant }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading && isOnline) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-3.5 ${variant === 'centered' ? 'max-w-3xl mx-auto w-full' : 'w-full'}`}>
      <div className="relative flex-1 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-gold)]/35 to-[var(--color-gold-dark)]/35 rounded-full blur-md opacity-25 group-hover:opacity-60 transition duration-700"></div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isOnline ? "بماذا تشعر اليوم؟ أو ما هو سؤالك الروحاني؟" : "أنت غير متصل بالإنترنت حالياً"}
          disabled={isLoading || !isOnline}
          className={`relative w-full bg-white/10 backdrop-blur-2xl border border-white/25 rounded-full py-4.5 px-8 text-white placeholder:text-white/55 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/70 shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all ${
            variant === 'centered' ? 'py-5 text-center sm:text-right' : 'py-4'
          } ${!isOnline ? 'opacity-55 cursor-not-allowed bg-red-950/25 border-red-500/25' : ''}`}
          dir="rtl"
        />
      </div>
      <button
        type="submit"
        disabled={!text.trim() || isLoading || !isOnline}
        className={`relative w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_10px_25px_rgba(153,101,21,0.4)] shrink-0 group overflow-hidden ${!isOnline ? 'grayscale' : ''}`}
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        {isLoading ? (
          <div className="relative z-10 w-6 h-6 border-2.5 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <Send size={22} className={`relative z-10 transition-transform duration-300 group-hover:translate-x-[-2px] group-hover:translate-y-[2px] ${text.trim() && !isLoading ? 'rtl:-scale-x-100' : ''}`} />
        )}
      </button>
    </form>
  );
};
