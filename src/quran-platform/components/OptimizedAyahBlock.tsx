import React, { memo } from 'react';
import { AyahMarker, toArabicNumerals } from './AyahMarker';
import { Play, Brain, Eye, EyeOff } from 'lucide-react';

export interface OptimizedAyahProps {
  currentSurah: number;
  ayah: any;
  translationText?: string;
  isBookmarked: boolean;
  isActive: boolean;
  isMarked: boolean;
  isPlayingThisAyah: boolean;
  highlightClass?: string;
  isMemorizeMode: boolean;
  memorizeType: 'words' | 'verses';
  memorizePercent: number;
  isVerseHidden: boolean;
  revealedWords: Set<string>;
  revealedVerses: Set<number>;
  currentTheme: any;
  onAyahClick: (ayahNumber: number, e: React.MouseEvent) => void;
  onPlayDirect?: (ayahNumber: number, e: React.MouseEvent) => void;
  onToggleWordReveal?: (wordId: string, e: React.MouseEvent) => void;
  onToggleVerseReveal?: (ayahNumber: number, e: React.MouseEvent) => void;
}

export const OptimizedAyahItem: React.FC<OptimizedAyahProps> = memo(({
  currentSurah,
  ayah,
  isBookmarked,
  isActive,
  isPlayingThisAyah,
  highlightClass,
  isMemorizeMode,
  memorizeType,
  memorizePercent,
  isVerseHidden,
  revealedWords,
  revealedVerses,
  currentTheme,
  onAyahClick,
  onPlayDirect,
  onToggleWordReveal,
  onToggleVerseReveal
}) => {
  let text = ayah.text;
  if (currentSurah !== 1 && ayah.numberInSurah === 1 && text.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ')) {
    text = text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ', '');
  }

  const ayahNumber = ayah.numberInSurah || ayah.number;

  // Content rendering based on memorization mode
  let ayahContent: React.ReactNode;

  if (isVerseHidden) {
    ayahContent = (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 mx-1.5 my-1 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-2xl select-none align-middle font-sans text-xs transition-all hover:bg-amber-500/25 cursor-pointer relative"
        onClick={(e) => {
          e.stopPropagation();
          onToggleVerseReveal?.(ayahNumber, e);
        }}
        title="آية مخفية - انقر لإظهارها يدوياً"
      >
        <span className="font-bold text-amber-850 dark:text-amber-400 flex items-center gap-1">
          <Brain size={12} className="animate-pulse text-amber-600 dark:text-amber-400" />
          آية {toArabicNumerals(ayahNumber)} مخفية
        </span>

        {onPlayDirect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayDirect(ayahNumber, e);
            }}
            className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-transform scale-90 hover:scale-105 cursor-pointer flex items-center justify-center shadow-xs"
            title="استماع مباشر للآية للتحقق"
          >
            <Play size={10} className="fill-current" />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVerseReveal?.(ayahNumber, e);
          }}
          className="p-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white rounded-lg transition-transform scale-90 hover:scale-105 cursor-pointer flex items-center justify-center shadow-xs"
          title="إظهار الآية"
        >
          <Eye size={10} />
        </button>
      </span>
    );
  } else if (isMemorizeMode && memorizeType === 'words') {
    const words = text.split(' ');
    ayahContent = (
      <span className={`${isPlayingThisAyah ? 'text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold' : isBookmarked && !isMemorizeMode ? 'text-[var(--color-primary-dark)] font-medium' : currentTheme.textColor} ${highlightClass || ''}`}>
        {words.map((word: string, index: number) => {
          const wordId = `${ayahNumber}-${index}`;
          let shouldBeHiddenByPercent = false;
          if (memorizePercent === 100) {
            shouldBeHiddenByPercent = true;
          } else if (memorizePercent === 50) {
            shouldBeHiddenByPercent = index % 2 === 0;
          } else if (memorizePercent === 25) {
            shouldBeHiddenByPercent = index % 4 === 0;
          }

          const isWordHidden = shouldBeHiddenByPercent && !revealedWords.has(wordId);

          return (
            <React.Fragment key={wordId}>
              <span
                onClick={(e) => {
                  onToggleWordReveal?.(wordId, e);
                }}
                className="cursor-pointer hover:bg-amber-500/10 rounded px-0.5"
                style={isWordHidden ? {
                  color: 'transparent',
                  backgroundColor: currentTheme.id === 'night' ? '#3f3f46' : '#e4e4e7',
                  borderRadius: '4px',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  marginRight: '2px',
                  marginLeft: '2px',
                  userSelect: 'none'
                } : {}}
                title={isWordHidden ? "انقر لإظهار هذه الكلمة" : undefined}
              >
                {word}
              </span>
              {' '}
            </React.Fragment>
          );
        })}
      </span>
    );
  } else {
    // Normal high-performance rendering (no word-by-word span splitting needed)
    ayahContent = (
      <span className={`${isPlayingThisAyah ? 'text-[var(--color-primary-dark)] dark:text-emerald-300 font-bold' : isBookmarked ? 'text-[var(--color-primary-dark)] font-medium' : currentTheme.textColor} ${highlightClass || ''}`}>
        {text}{' '}
      </span>
    );
  }

  const ayahMarker = (
    <AyahMarker
      ayahNumber={ayahNumber}
      themeId={currentTheme.id}
      isPlaying={isPlayingThisAyah}
      isBookmarked={isBookmarked && !isMemorizeMode}
      isMemorizeHidden={isMemorizeMode && memorizeType === 'words' && !revealedWords.has(`ayah-marker-${ayahNumber}`)}
      onClick={(e) => {
        if (isMemorizeMode) {
          if (memorizeType === 'words') {
            onToggleWordReveal?.(`ayah-marker-${ayahNumber}`, e);
          } else {
            onToggleVerseReveal?.(ayahNumber, e);
          }
        }
      }}
    />
  );

  const playButtonDirect = isMemorizeMode && !isVerseHidden && onPlayDirect && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onPlayDirect(ayahNumber, e);
      }}
      className="inline-flex items-center justify-center p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-md transition-all scale-90 mx-1 align-middle cursor-pointer"
      title="استماع لهذه الآية للتحقق"
    >
      <Play size={11} className="fill-current" />
    </button>
  );

  const hideButtonDirect = isMemorizeMode && memorizeType === 'verses' && revealedVerses.has(ayahNumber) && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleVerseReveal?.(ayahNumber, e);
      }}
      className="inline-flex items-center justify-center p-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-md transition-all scale-90 mx-1 align-middle cursor-pointer"
      title="إخفاء الآية مجدداً"
    >
      <EyeOff size={11} />
    </button>
  );

  return (
    <span
      id={`ayah-${ayahNumber}`}
      className={`inline transition-all duration-300 rounded relative px-1 ${
        isPlayingThisAyah
          ? 'bg-[var(--color-primary)]/20 dark:bg-[var(--color-primary)]/40 ring-2 ring-[var(--color-primary)] ring-offset-1 font-bold shadow-sm'
          : isActive
          ? (currentTheme.id === 'night' ? 'bg-[var(--color-primary)]/20' : 'bg-[var(--color-primary)]/10')
          : !isMemorizeMode
          ? (currentTheme.id === 'night' ? 'hover:bg-gray-800 cursor-pointer' : 'hover:bg-[var(--color-primary)]/5 cursor-pointer')
          : ''
      }`}
      onClick={(e) => {
        if (!isMemorizeMode) {
          onAyahClick(ayahNumber, e);
        }
      }}
    >
      {ayahContent}
      {playButtonDirect}
      {hideButtonDirect}
      {ayahMarker}
    </span>
  );
});

OptimizedAyahItem.displayName = 'OptimizedAyahItem';

/**
 * Optimized Ayah Chunk with CSS content-visibility for 60fps scrolling & 0ms freeze on long surahs
 */
export const OptimizedAyahChunk: React.FC<{
  children: React.ReactNode;
  chunkIndex: number;
}> = memo(({ children, chunkIndex }) => {
  return (
    <div
      data-chunk-index={chunkIndex}
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 220px',
        contain: 'layout style'
      }}
      className="inline"
    >
      {children}
    </div>
  );
});

OptimizedAyahChunk.displayName = 'OptimizedAyahChunk';
