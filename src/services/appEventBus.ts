/**
 * Centralized Typed Event Bus for Anis Muslim App
 * Eliminates custom DOM event spaghetti, provides strict TypeScript typing,
 * and guarantees clean subscription/unsubscription lifecycle.
 */

import { useEffect, useRef } from 'react';

export type AppEventPayloads = {
  APP_PERMISSIONS_UPDATED: void;
  STOP_APP_AUDIO: { source: 'adhan' | 'dhikr' | 'quran' | 'ui' };
  DHIKR_STORAGE_UPDATED: { reciterId: string; downloaded?: boolean; deleted?: boolean };
  ADHAN_STORAGE_UPDATED: { muezzinId: string; size?: number; deleted?: boolean };
  NAVIGATE_BACK_MODAL_DETAIL: { modal: 'miracles' | 'prophets' };
  ONLINE_STATUS_CHANGED: { isOnline: boolean };
};

export type AppEventName = keyof AppEventPayloads;
export type AppEventHandler<T extends AppEventName> = (payload: AppEventPayloads[T]) => void;

class AppEventBus {
  private listeners: Map<AppEventName, Set<AppEventHandler<any>>> = new Map();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  public on<T extends AppEventName>(event: T, handler: AppEventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const set = this.listeners.get(event)!;
    set.add(handler);

    return () => {
      set.delete(handler);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event for a single invocation only.
   */
  public once<T extends AppEventName>(event: T, handler: AppEventHandler<T>): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  /**
   * Emit an event with typed payload.
   */
  public emit<T extends AppEventName>(
    event: T,
    ...args: AppEventPayloads[T] extends void ? [] : [AppEventPayloads[T]]
  ): void {
    const payload = args[0] as AppEventPayloads[T];
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`[AppEventBus] Error in listener for ${event}:`, e);
        }
      });
    }

    // Also dispatch to window for external/legacy compatibility if needed
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent(event, { detail: payload }));
      } catch {}
    }
  }

  /**
   * Clears all listeners for debugging / testing.
   */
  public clearAll(): void {
    this.listeners.clear();
  }
}

export const appEventBus = new AppEventBus();

/**
 * React Hook for clean, automatic event subscription and unsubscription on unmount.
 */
export function useAppEvent<T extends AppEventName>(
  event: T,
  handler: AppEventHandler<T>,
  deps: any[] = []
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const callback: AppEventHandler<T> = (payload) => {
      handlerRef.current(payload);
    };

    const unsubscribe = appEventBus.on(event, callback);
    return () => {
      unsubscribe();
    };
  }, [event, ...deps]);
}
