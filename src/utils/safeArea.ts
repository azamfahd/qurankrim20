/**
 * Safe Area Insets & Status Bar Helper for Android APK, iOS, PWA, and Web.
 * Ensures consistent safe area spacing on all screen sizes, aspect ratios,
 * and handles Android status bar and gesture navigation bar overlaps.
 */

export function initSafeAreaManager(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const updateSafeArea = () => {
    try {
      const isCapacitor = Boolean(
        (window as any).Capacitor?.isNativePlatform?.() ||
        window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'ionic:'
      );
      const isStandalone = 
        window.matchMedia?.('(display-mode: standalone)')?.matches ||
        (window.navigator as any).standalone === true;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      // Measure current browser env() values using an invisible probe div
      const probe = document.createElement('div');
      probe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        padding-top: env(safe-area-inset-top, 0px);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        padding-left: env(safe-area-inset-left, 0px);
        padding-right: env(safe-area-inset-right, 0px);
        visibility: hidden;
        pointer-events: none;
        z-index: -9999;
      `;
      document.body.appendChild(probe);
      const computed = window.getComputedStyle(probe);
      const envTop = parseFloat(computed.paddingTop) || 0;
      const envBottom = parseFloat(computed.paddingBottom) || 0;
      const envLeft = parseFloat(computed.paddingLeft) || 0;
      const envRight = parseFloat(computed.paddingRight) || 0;
      probe.remove();

      // Provide a clean top status bar safe inset for standalone/Capacitor/mobile environments
      // so battery, clock, and camera cutouts never overlap with the header
      let finalTop = envTop;
      if (finalTop === 0 && (isCapacitor || isStandalone)) {
        finalTop = isIOS ? 44 : 26;
      }

      const finalBottom = envBottom;
      const finalLeft = envLeft;
      const finalRight = envRight;

      const root = document.documentElement;
      root.style.setProperty('--safe-area-top', `${finalTop}px`);
      root.style.setProperty('--safe-area-bottom', `${finalBottom}px`);
      root.style.setProperty('--safe-area-left', `${finalLeft}px`);
      root.style.setProperty('--safe-area-right', `${finalRight}px`);

      root.style.setProperty('--safe-area-top-num', `${finalTop}`);
      root.style.setProperty('--safe-area-bottom-num', `${finalBottom}`);

      // Add responsive status classes
      if (isCapacitor) root.classList.add('is-native-apk');
      if (isStandalone) root.classList.add('is-standalone-pwa');
      if (isMobile) root.classList.add('is-mobile-device');
    } catch (err) {
      console.warn('Safe area initialization notice:', err);
    }
  };

  // Run on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateSafeArea);
  } else {
    updateSafeArea();
  }

  // Recalculate on screen resize or orientation change
  window.addEventListener('resize', updateSafeArea, { passive: true });
  window.addEventListener('orientationchange', updateSafeArea, { passive: true });
}
