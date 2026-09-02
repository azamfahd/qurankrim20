import React from 'react';

// Helper to clean "سُورَةُ" or "سورة" from a name to prevent "سورة سورة" duplication
export const getCleanSurahName = (name: string): string => {
  if (!name) return '';
  let cleaned = name.trim();
  while (/^(سُورَةُ|سورة)\s*/.test(cleaned)) {
    cleaned = cleaned.replace(/^(سُورَةُ|سورة)\s*/, '').trim();
  }
  return cleaned;
};

// Helper to convert English digits to Eastern Arabic numerals
export const toArabicNumerals = (num: number): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .split('')
    .map(digit => {
      const parsed = parseInt(digit, 10);
      return isNaN(parsed) ? digit : arabicDigits[parsed];
    })
    .join('');
};

interface DecoratedBismillahProps {
  fontSize: number;
  themeId: string;
}

export const DecoratedBismillah: React.FC<DecoratedBismillahProps> = ({ fontSize, themeId }) => {
  const isNight = themeId === 'night';
  
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 my-10 text-center select-none" dir="rtl">
      {/* Right Ornament */}
      <div className="hidden sm:flex items-center flex-1 justify-end gap-2">
        <div className="h-[2px] w-16 bg-gradient-to-l from-amber-600/60 to-transparent dark:from-amber-500/60" />
        <span className="text-amber-700 dark:text-amber-400 text-lg">❦</span>
      </div>

      {/* Center Bismillah */}
      <div className="relative px-10 py-4 bg-gradient-to-b from-amber-50/50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/30 rounded-full border border-amber-600/30 shadow-inner">
        <div 
          className={`font-serif tracking-wide select-text ${
            isNight ? 'text-amber-200' : 'text-[var(--color-primary-dark)] dark:text-emerald-300'
          }`}
          style={{ 
            fontSize: `${fontSize + 4}px`, 
            fontFamily: "'Amiri', 'Uthmani', serif",
            lineHeight: 1.2
          }}
        >
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </div>
      </div>

      {/* Left Ornament */}
      <div className="hidden sm:flex items-center flex-1 justify-start gap-2">
        <span className="text-amber-700 dark:text-amber-400 text-lg">❦</span>
        <div className="h-[2px] w-16 bg-gradient-to-r from-amber-600/60 to-transparent dark:from-amber-500/60" />
      </div>
    </div>
  );
};

interface AyahMarkerProps {
  ayahNumber: number;
  themeId: string;
  isPlaying: boolean;
  isBookmarked: boolean;
  isMemorizeHidden?: boolean; // When true, the number itself is obscured for memorization testing
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export const AyahMarker: React.FC<AyahMarkerProps> = ({
  ayahNumber,
  themeId,
  isPlaying,
  isBookmarked,
  isMemorizeHidden = false,
  onClick,
  style,
}) => {
  // Determine dynamic sizes and classes
  const numStr = toArabicNumerals(ayahNumber);
  // Dynamically adjust font-size of the numeral inside the SVG based on digit count
  let textFontSize = '28px';
  let textYOffset = '51.5'; // Optical vertical centering alignment
  if (numStr.length === 1) {
    textFontSize = '33px';
  } else if (numStr.length === 2) {
    textFontSize = '27px';
  } else if (numStr.length === 3) {
    textFontSize = '21px';
    textYOffset = '52';
  }

  // Handle click wrapper
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
  };

  // Base style for inline integration in Quranic text flow
  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '1.45em',
    height: '1.45em',
    verticalAlign: 'middle',
    userSelect: 'none',
    cursor: 'pointer',
    margin: '0 0.25em',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isPlaying ? 'scale(1.15)' : 'scale(1)',
    ...style,
  };

  // Render a special blurred/obscured placeholder in memorize mode if hidden
  if (isMemorizeHidden) {
    const isDark = themeId === 'night';
    return (
      <span
        onClick={handleClick}
        style={baseStyle}
        className="relative group inline-flex items-center justify-center"
        title="انقر للكشف عن رقم الآية"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transition-transform active:scale-95"
        >
          {/* Subtle placeholder ornament */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill={isDark ? '#1e293b' : '#f3f4f6'}
            stroke={isDark ? '#4b5563' : '#d1d5db'}
            strokeWidth="3"
            strokeDasharray="6,4"
          />
          <circle
            cx="50"
            cy="50"
            r="28"
            fill={isDark ? '#374151' : '#e5e7eb'}
            className="animate-pulse"
          />
          <text
            x="50"
            y="52"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: '26px',
              fill: isDark ? '#9ca3af' : '#6b7280',
              fontFamily: "'Amiri', serif",
              fontWeight: 'bold',
            }}
          >
            ؟
          </text>
        </svg>
      </span>
    );
  }

  // --- Theme-Specific SVG Rendering ---

  // 1. ROYAL GREEN THEME (Traditional Medina Star)
  if (themeId === 'royal_green') {
    const primaryGreen = '#1b4332';
    const medinaGold = isPlaying ? '#fbbf24' : isBookmarked ? '#ea580c' : '#c5a85c';
    const innerFill = isPlaying ? '#163f2e' : '#fdfaf2';
    const numeralColor = isPlaying ? '#fef3c7' : '#1b4332';
    const glowFilter = isPlaying ? 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.6))' : 'none';

    return (
      <span onClick={handleClick} style={{ ...baseStyle, filter: glowFilter }} className="group">
        <svg viewBox="0 0 100 100" className="w-full h-full transition-all group-hover:rotate-45 duration-500">
          {/* 8-pointed star - Rub el Hizb (Two overlapping squares rotated by 45 deg) */}
          <rect
            x="18"
            y="18"
            width="64"
            height="64"
            rx="5"
            fill="none"
            stroke={medinaGold}
            strokeWidth="3.5"
            transform="rotate(0, 50, 50)"
          />
          <rect
            x="18"
            y="18"
            width="64"
            height="64"
            rx="5"
            fill="none"
            stroke={medinaGold}
            strokeWidth="3.5"
            transform="rotate(45, 50, 50)"
          />

          {/* Dots at intersection corners */}
          <circle cx="50" cy="11" r="3" fill={medinaGold} />
          <circle cx="50" cy="89" r="3" fill={medinaGold} />
          <circle cx="11" cy="50" r="3" fill={medinaGold} />
          <circle cx="89" cy="50" r="3" fill={medinaGold} />

          {/* Double inner border lines */}
          <circle cx="50" cy="50" r="31" fill={primaryGreen} opacity={isPlaying ? '1' : '0.1'} />
          <circle cx="50" cy="50" r="28" fill={innerFill} stroke={medinaGold} strokeWidth="2.5" />
          <circle cx="50" cy="50" r="23" fill="none" stroke={primaryGreen} strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />

          {/* Centered numeral */}
          <text
            x="50"
            y={textYOffset}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: textFontSize,
              fill: numeralColor,
              fontFamily: "'Amiri', 'Uthmani', serif",
              fontWeight: 'bold',
            }}
          >
            {numStr}
          </text>
        </svg>
      </span>
    );
  }

  // 2. SHAMARLI THEME (Heritage Scalloped Floral Medallion)
  if (themeId === 'shamarli') {
    const borderBronze = isPlaying ? '#78350f' : isBookmarked ? '#b45309' : '#8c6239';
    const innerGold = isPlaying ? '#d97706' : '#c5a85c';
    const fillBg = isPlaying ? '#fbf4d4' : '#fdfbe7';
    const numeralColor = isPlaying ? '#78350f' : '#2a1a08';

    // Generates points around a circle to draw 12 scallops
    const points: string[] = [];
    const radius = 37;
    const center = 50;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    // Path linking scallops
    const scallopPath = points.map((p, idx) => {
      const nextP = points[(idx + 1) % 12];
      const midAngle = ((idx + 0.5) * Math.PI) / 6;
      // Control point pulled outwards for round scallops
      const ctrlR = radius + 6;
      const ctrlX = center + ctrlR * Math.cos(midAngle);
      const ctrlY = center + ctrlR * Math.sin(midAngle);
      return `${idx === 0 ? 'M' : 'Q'} ${ctrlX.toFixed(1)},${ctrlY.toFixed(1)} ${nextP}`;
    }).join(' ') + ' Z';

    return (
      <span onClick={handleClick} style={baseStyle} className="group">
        <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105 duration-300">
          {/* Scalloped outer edge */}
          <path
            d={scallopPath}
            fill={fillBg}
            stroke={borderBronze}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Concentric inner designs */}
          <circle cx="50" cy="50" r="28" fill="none" stroke={innerGold} strokeWidth="1.5" />
          <circle cx="50" cy="50" r="24" fill="none" stroke={borderBronze} strokeWidth="1" strokeDasharray="4,2" />

          {/* Tiny decorative beads inside scallops */}
          {points.map((p, idx) => {
            const [x, y] = p.split(',').map(Number);
            // Move slightly towards center
            const dx = x - center;
            const dy = y - center;
            const len = Math.sqrt(dx * dx + dy * dy);
            const bx = center + (dx / len) * (radius - 3);
            const by = center + (dy / len) * (radius - 3);
            return (
              <circle
                key={`bead-ring-${idx}`}
                cx={bx}
                cy={by}
                r="1.5"
                fill={idx % 2 === 0 ? borderBronze : innerGold}
              />
            );
          })}

          {/* Centered numeral */}
          <text
            x="50"
            y={textYOffset}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: textFontSize,
              fill: numeralColor,
              fontFamily: "'Amiri', 'Uthmani', serif",
              fontWeight: 'bold',
            }}
          >
            {numStr}
          </text>
        </svg>
      </span>
    );
  }

  // 3. GOLDEN THEME (Intricate 12-Pointed Andalusian Rosette)
  if (themeId === 'golden') {
    const goldGlow = isPlaying ? 'drop-shadow(0 0 6px rgba(217, 119, 6, 0.75))' : 'none';
    const coreBorderColor = isPlaying ? '#ea580c' : isBookmarked ? '#ef4444' : '#d97706';

    return (
      <span onClick={handleClick} style={{ ...baseStyle, filter: goldGlow }} className="group">
        <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:rotate-30 duration-700">
          <defs>
            {/* Real radiant gold gradient */}
            <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="30%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="70%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            
            <linearGradient id="goldActive" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Three overlapping squares to form 12-pointed Andalusian star */}
          <rect
            x="19"
            y="19"
            width="62"
            height="62"
            rx="3"
            fill="none"
            stroke="url(#goldMetallic)"
            strokeWidth="3.5"
            transform="rotate(0, 50, 50)"
          />
          <rect
            x="19"
            y="19"
            width="62"
            height="62"
            rx="3"
            fill="none"
            stroke="url(#goldMetallic)"
            strokeWidth="3.5"
            transform="rotate(30, 50, 50)"
          />
          <rect
            x="19"
            y="19"
            width="62"
            height="62"
            rx="3"
            fill="none"
            stroke="url(#goldMetallic)"
            strokeWidth="3.5"
            transform="rotate(60, 50, 50)"
          />

          {/* Ornate corner floral buds */}
          <circle cx="50" cy="11" r="3.5" fill="url(#goldMetallic)" />
          <circle cx="50" cy="89" r="3.5" fill="url(#goldMetallic)" />
          <circle cx="11" cy="50" r="3.5" fill="url(#goldMetallic)" />
          <circle cx="89" cy="50" r="3.5" fill="url(#goldMetallic)" />

          {/* Double inner circle borders */}
          <circle
            cx="50"
            cy="50"
            r="28"
            fill={isPlaying ? 'rgba(251, 191, 36, 0.15)' : '#fffdfa'}
            stroke={isPlaying ? 'url(#goldActive)' : 'url(#goldMetallic)'}
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="23"
            fill="none"
            stroke={coreBorderColor}
            strokeWidth="1"
            strokeDasharray="2,2"
          />

          {/* Centered numeral */}
          <text
            x="50"
            y={textYOffset}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: textFontSize,
              fill: isPlaying ? '#78350f' : '#451a03',
              fontFamily: "'Amiri', 'Uthmani', serif",
              fontWeight: 'bold',
            }}
          >
            {numStr}
          </text>
        </svg>
      </span>
    );
  }

  // 4. TAJWEED THEME (Soft Concentric Velvet Arabesque)
  if (themeId === 'tajweed') {
    const mainRose = isPlaying ? '#be123c' : isBookmarked ? '#9f1239' : '#b5838d';
    const subPurple = isPlaying ? '#4c0519' : '#6d597a';
    const innerBg = isPlaying ? '#ffe4e6' : '#fefaf6';
    const numeralColor = isPlaying ? '#881337' : '#2d2424';

    return (
      <span onClick={handleClick} style={baseStyle} className="group">
        <svg viewBox="0 0 100 100" className="w-full h-full transition-transform group-hover:scale-105 duration-300">
          {/* Beautiful 8-lobed flower backdrop */}
          <g transform="translate(50,50)" stroke={mainRose} strokeWidth="3" fill={innerBg}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <path
                key={idx}
                d="M 0,0 C -12,-28 12,-28 0,0"
                transform={`rotate(${idx * 45})`}
                strokeLinejoin="round"
              />
            ))}
            {/* Outer circular overlay link */}
            <circle cx="0" cy="0" r="34" fill="none" stroke={mainRose} strokeWidth="1" opacity="0.3" />
          </g>

          {/* Dual circular borders */}
          <circle cx="50" cy="50" r="26" fill={innerBg} stroke={subPurple} strokeWidth="2" />
          <circle cx="50" cy="50" r="22" fill="none" stroke={mainRose} strokeWidth="1.5" strokeDasharray="3,1.5" />

          {/* Petal center beads */}
          {Array.from({ length: 8 }).map((_, idx) => {
            const angle = (idx * 45 * Math.PI) / 180;
            const bx = 50 + 38 * Math.cos(angle);
            const by = 50 + 38 * Math.sin(angle);
            return (
              <circle
                key={idx}
                cx={bx}
                cy={by}
                r="2"
                fill={mainRose}
              />
            );
          })}

          {/* Centered numeral */}
          <text
            x="50"
            y={textYOffset}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: textFontSize,
              fill: numeralColor,
              fontFamily: "'Amiri', 'Uthmani', serif",
              fontWeight: 'bold',
            }}
          >
            {numStr}
          </text>
        </svg>
      </span>
    );
  }

  // 5. NIGHT THEME (Ethereal Emerald & Celestial Gold Starburst)
  if (themeId === 'night') {
    const activeGold = '#fcd34d';
    const normalMint = '#34d399';
    const strokeColor = isPlaying ? activeGold : isBookmarked ? '#f59e0b' : normalMint;
    const numeralColor = isPlaying ? '#0f172a' : normalMint;
    const fillBg = isPlaying ? strokeColor : '#121824';
    const shadowColor = isPlaying ? 'rgba(252, 211, 77, 0.5)' : 'rgba(52, 211, 153, 0.25)';

    return (
      <span
        onClick={handleClick}
        style={{
          ...baseStyle,
          filter: `drop-shadow(0 0 5px ${shadowColor})`,
        }}
        className="group"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full transition-all group-hover:scale-110 duration-300">
          {/* Celestial sharp starburst rays */}
          <g stroke={strokeColor} strokeWidth="2.5" fill="none" strokeLinecap="round">
            {/* Long perpendicular axes */}
            <line x1="50" y1="10" x2="50" y2="90" />
            <line x1="10" y1="50" x2="90" y2="50" strokeWidth={isPlaying ? '3' : '2.5'} />
            
            {/* Diagonal axes */}
            <line x1="22" y1="22" x2="78" y2="78" strokeWidth="1.5" />
            <line x1="22" y1="78" x2="78" y2="22" strokeWidth="1.5" />
          </g>

          {/* Tiny cosmic stars/dots on vertices */}
          <circle cx="50" cy="8" r="2.5" fill={strokeColor} />
          <circle cx="50" cy="92" r="2.5" fill={strokeColor} />
          <circle cx="8" cy="50" r="2.5" fill={strokeColor} />
          <circle cx="92" cy="50" r="2.5" fill={strokeColor} />

          {/* Central orb/circle frame */}
          <circle cx="50" cy="50" r="27" fill={fillBg} stroke={strokeColor} strokeWidth="3" />
          <circle cx="50" cy="50" r="22" fill="none" stroke={isPlaying ? '#1e293b' : 'rgba(52, 211, 153, 0.4)'} strokeWidth="1.5" strokeDasharray="3,2" />

          {/* Centered numeral */}
          <text
            x="50"
            y={textYOffset}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: textFontSize,
              fill: numeralColor,
              fontFamily: "'Amiri', 'Uthmani', serif",
              fontWeight: 'bold',
            }}
          >
            {numStr}
          </text>
        </svg>
      </span>
    );
  }

  // --- FALLBACK (In case of missing themes, although all 5 are covered above) ---
  return (
    <span onClick={handleClick} style={baseStyle}>
      ﴿{numStr}﴾
    </span>
  );
};
