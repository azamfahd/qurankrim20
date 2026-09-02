import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, disabled = false }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  
  // Smart threshold constants:
  // 1. minRevealThreshold (55px): Ignores small/accidental scrolling completely (system knows user doesn't want to refresh).
  // 2. targetThreshold (135px): Intentional deep pull to confirm refresh action.
  const minRevealThreshold = 55;
  const targetThreshold = 135; 
  const maxPull = 180;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only allow when user is at the exact top
    if (window.scrollY <= 1) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPullingRef.current || startYRef.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      if (diff > 0 && window.scrollY <= 1) {
        // Natural rubber-band resistance
        const dampedDistance = Math.min(diff * 0.5, maxPull);
        setPullDistance(dampedDistance);
      } else if (diff <= 0) {
        setPullDistance(0);
        isPullingRef.current = false;
      }
    });
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (!isPullingRef.current || isRefreshing) return;
    
    isPullingRef.current = false;
    startYRef.current = null;

    // Only activate if user intentionally pulled down past the confirmation threshold
    if (pullDistance >= targetThreshold) {
      setIsRefreshing(true);
      setPullDistance(65); // Stable resting position during background refresh

      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update().catch(() => {});
          }
        }

        await Promise.resolve(onRefresh());
        
        setIsSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 700));
      } catch (err) {
        console.warn('Silent refresh error:', err);
      } finally {
        setIsSuccess(false);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Small or incomplete pull: return smoothly to 0 with zero action
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, targetThreshold]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Smart check: If pull is minimal and not refreshing, completely hide without rendering any DOM
  if ((pullDistance < minRevealThreshold && !isRefreshing) || disabled) {
    return null;
  }

  const isTriggerReady = pullDistance >= targetThreshold;
  // Calculate smooth opacity from 0 to 1 as pull goes from 55px to 110px
  const opacity = isRefreshing 
    ? 1 
    : Math.min(Math.max((pullDistance - minRevealThreshold) / 50, 0), 1);
  const rotation = (pullDistance - minRevealThreshold) * 3.5;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-100 ease-out"
      style={{
        transform: `translateY(${Math.max(pullDistance - 20, 10)}px)`,
        opacity: opacity
      }}
    >
      {/* Ultra-subtle, transparent crystal-clear pill */}
      <div 
        className="backdrop-blur-md shadow-lg rounded-full px-4 py-1.5 flex items-center gap-2 text-xs text-white select-none transition-all duration-150"
        style={{
          backgroundColor: isTriggerReady 
            ? 'rgba(2, 44, 34, 0.45)' 
            : 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
        }}
      >
        {isSuccess ? (
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <Check size={14} className="stroke-[3] text-emerald-400" />
            <span className="text-[11px]">تم التحديث بنجاح</span>
          </div>
        ) : isRefreshing ? (
          <div className="flex items-center gap-2 text-amber-200 font-semibold">
            <RefreshCw size={13} className="animate-spin text-[var(--color-gold)]" />
            <span className="text-[11px] opacity-95">جاري التحديث في الخلفية...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative w-3.5 h-3.5 flex items-center justify-center">
              <RefreshCw 
                size={13} 
                style={{ transform: `rotate(${rotation}deg)` }}
                className={`transition-colors duration-150 ${isTriggerReady ? 'text-[var(--color-gold)] scale-110' : 'text-white/70'}`} 
              />
            </div>
            <span className={`text-[11px] transition-all duration-150 ${isTriggerReady ? 'text-[var(--color-gold-light)] font-black' : 'text-white/85 font-medium'}`}>
              {isTriggerReady ? 'أفلت الآن للتحديث ✨' : 'اسحب للأسفل لتأكيد التحديث'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
