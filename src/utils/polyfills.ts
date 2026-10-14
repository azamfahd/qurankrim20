/**
 * Anis Al-Qulub - Compatibility & Polyfill Layer
 * Provides robust polyfills and CSS feature-detection flags for older Android WebViews,
 * legacy iOS Safari versions, and non-updated mobile browsers.
 */

export function initPolyfills(): void {
  if (typeof window === 'undefined') return;

  /* -------------------------------------------------------------
   * 1. JavaScript Primitives & Modern Runtime Polyfills
   * ------------------------------------------------------------- */

  // 1.1 globalThis
  if (typeof (window as any).globalThis === 'undefined') {
    (window as any).globalThis = window;
  }

  // 1.2 Object.hasOwn
  if (!Object.hasOwn) {
    Object.hasOwn = function (obj: any, prop: PropertyKey): boolean {
      if (obj === null || obj === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      return Object.prototype.hasOwnProperty.call(obj, prop);
    };
  }

  // 1.3 Object.fromEntries
  if (!Object.fromEntries) {
    Object.fromEntries = function (entries: any): any {
      if (!entries || !entries[Symbol.iterator]) {
        throw new TypeError('Object.fromEntries requires an iterable');
      }
      const obj: Record<string, any> = {};
      for (const [key, value] of entries) {
        obj[key] = value;
      }
      return obj;
    };
  }

  // 1.4 Array.prototype.at
  if (!Array.prototype.at) {
    Array.prototype.at = function (n: number) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }

  // 1.5 String.prototype.at
  if (!String.prototype.at) {
    String.prototype.at = function (n: number) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this.charAt(n);
    };
  }

  // 1.6 String.prototype.replaceAll
  if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (
      searchValue: any,
      replaceValue: any
    ): string {
      if (searchValue instanceof RegExp) {
        if (!searchValue.global) {
          throw new TypeError('replaceAll called with a non-global RegExp');
        }
        return this.replace(searchValue, replaceValue);
      }
      return this.split(searchValue).join(replaceValue);
    };
  }

  // 1.7 Array.prototype.flat & flatMap
  if (!Array.prototype.flat) {
    (Array.prototype as any).flat = function (depth: number = 1): any[] {
      const flatDeep = (arr: any[], d: number): any[] => {
        return d > 0
          ? arr.reduce(
              (acc, val) =>
                acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val),
              []
            )
          : arr.slice();
      };
      return flatDeep(this as any[], Math.floor(depth) || 1);
    };
  }

  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function (
      callback: any,
      thisArg?: any
    ): any[] {
      return this.map(callback, thisArg).flat();
    };
  }

  // 1.8 structuredClone deep-clone fallback
  if (typeof (window as any).structuredClone !== 'function') {
    (window as any).structuredClone = function <T>(value: T): T {
      if (value === null || typeof value !== 'object') {
        return value;
      }
      if (value instanceof Date) {
        return new Date(value.getTime()) as any;
      }
      if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags) as any;
      }
      if (value instanceof Map) {
        const mapCopy = new Map();
        value.forEach((v, k) => {
          mapCopy.set((window as any).structuredClone(k), (window as any).structuredClone(v));
        });
        return mapCopy as any;
      }
      if (value instanceof Set) {
        const setCopy = new Set();
        value.forEach((v) => {
          setCopy.add((window as any).structuredClone(v));
        });
        return setCopy as any;
      }
      if (Array.isArray(value)) {
        return value.map((item) => (window as any).structuredClone(item)) as any;
      }
      try {
        // Fast JSON clone for serializable objects
        return JSON.parse(JSON.stringify(value));
      } catch {
        const copy: Record<string, any> = {};
        for (const key of Object.keys(value as any)) {
          copy[key] = (window as any).structuredClone((value as any)[key]);
        }
        return copy as any;
      }
    };
  }

  // 1.9 Promise.allSettled
  if (!Promise.allSettled) {
    Promise.allSettled = function <T>(
      promises: Iterable<T | PromiseLike<T>>
    ): Promise<Array<PromiseSettledResult<Awaited<T>>>> {
      return Promise.all(
        Array.from(promises).map((p) =>
          Promise.resolve(p).then(
            (value) => ({ status: 'fulfilled' as const, value }),
            (reason) => ({ status: 'rejected' as const, reason })
          )
        )
      );
    };
  }

  // 1.10 Promise.any
  if (!Promise.any) {
    Promise.any = function <T>(
      promises: Iterable<T | PromiseLike<T>>
    ): Promise<T> {
      return new Promise((resolve, reject) => {
        const list = Array.from(promises);
        if (list.length === 0) {
          reject(new (window as any).AggregateError([], 'All promises were rejected'));
          return;
        }
        let rejections = 0;
        const errors: any[] = new Array(list.length);
        list.forEach((p, idx) => {
          Promise.resolve(p).then(
            (val) => resolve(val),
            (err) => {
              errors[idx] = err;
              rejections++;
              if (rejections === list.length) {
                const aggregate = typeof (window as any).AggregateError === 'function'
                  ? new (window as any).AggregateError(errors, 'All promises were rejected')
                  : new Error('All promises were rejected');
                (aggregate as any).errors = errors;
                reject(aggregate);
              }
            }
          );
        });
      });
    };
  }

  // 1.11 queueMicrotask
  if (typeof window.queueMicrotask !== 'function') {
    window.queueMicrotask = function (callback: () => void): void {
      Promise.resolve().then(callback).catch((err) => {
        setTimeout(() => {
          throw err;
        }, 0);
      });
    };
  }

  // 1.12 requestIdleCallback & cancelIdleCallback
  if (typeof (window as any).requestIdleCallback !== 'function') {
    (window as any).requestIdleCallback = function (
      cb: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
      options?: { timeout?: number }
    ): number {
      const start = Date.now();
      const timeout = options?.timeout || 50;
      return window.setTimeout(() => {
        cb({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1);
    };
  }

  if (typeof (window as any).cancelIdleCallback !== 'function') {
    (window as any).cancelIdleCallback = function (id: number): void {
      clearTimeout(id);
    };
  }

  // 1.13 AbortSignal.timeout
  if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout !== 'function') {
    (AbortSignal as any).timeout = function (ms: number): AbortSignal {
      const controller = new AbortController();
      setTimeout(() => {
        try {
          controller.abort(new DOMException('TimeoutError', 'TimeoutError'));
        } catch {
          controller.abort();
        }
      }, ms);
      return controller.signal;
    };
  }

  // 1.14 matchMedia listener compatibility (older Safari used addListener instead of addEventListener)
  if (typeof window.matchMedia === 'function') {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function (query: string): MediaQueryList {
      const mql = originalMatchMedia.call(window, query);
      if (mql && !mql.addEventListener && (mql as any).addListener) {
        mql.addEventListener = function (type: string, listener: any) {
          if (type === 'change') {
            (mql as any).addListener(listener);
          }
        };
        mql.removeEventListener = function (type: string, listener: any) {
          if (type === 'change') {
            (mql as any).removeListener(listener);
          }
        };
      }
      return mql;
    };
  }

  // 1.15 Safe stubs for ResizeObserver & IntersectionObserver to avoid crashes on legacy devices
  if (typeof (window as any).ResizeObserver === 'undefined') {
    (window as any).ResizeObserver = class SafeResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  /* -------------------------------------------------------------
   * 2. CSS Feature Detection & Adaptive Root Class Flagging
   * ------------------------------------------------------------- */
  try {
    const root = document.documentElement;

    // 2.1 Flexbox Gap Support Detection
    const flexTest = document.createElement('div');
    flexTest.style.cssText = 'display:flex;flex-direction:row;gap:1px;position:absolute;top:-9999px;opacity:0;';
    flexTest.appendChild(document.createElement('div'));
    flexTest.appendChild(document.createElement('div'));
    document.body ? document.body.appendChild(flexTest) : root.appendChild(flexTest);
    const isFlexGapSupported = flexTest.scrollHeight === 1 || flexTest.scrollWidth === 1 || flexTest.children[1].getBoundingClientRect().left - flexTest.children[0].getBoundingClientRect().right === 1;
    flexTest.remove();

    if (!isFlexGapSupported) {
      root.classList.add('no-flex-gap');
    }

    // 2.2 Backdrop Filter Support Detection
    const isBackdropFilterSupported =
      (window.CSS && CSS.supports && (
        CSS.supports('backdrop-filter', 'blur(10px)') ||
        CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
      )) || false;

    if (!isBackdropFilterSupported) {
      root.classList.add('no-backdrop-filter');
    }

    // 2.3 dvh Units Support Detection
    const isDvhSupported =
      (window.CSS && CSS.supports && CSS.supports('min-height', '100dvh')) || false;

    if (!isDvhSupported) {
      root.classList.add('no-dvh');
    }

    // 2.4 Aspect Ratio Support Detection
    const isAspectRatioSupported =
      (window.CSS && CSS.supports && CSS.supports('aspect-ratio', '1 / 1')) || false;

    if (!isAspectRatioSupported) {
      root.classList.add('no-aspect-ratio');
    }

    // 2.5 Dynamic App Viewport Height Polyfill (--app-height and --vh)
    const updateViewportVars = () => {
      const vh = window.innerHeight * 0.01;
      root.style.setProperty('--vh', `${vh}px`);
      root.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    updateViewportVars();
    window.addEventListener('resize', updateViewportVars, { passive: true });
    window.addEventListener('orientationchange', updateViewportVars, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportVars, { passive: true });
    }
  } catch (err) {
    console.warn('CSS detection notice:', err);
  }
}
