import React from 'react';

/**
Helper to handle React.lazy dynamic imports with auto-retry and cache-busting on app updates.
When an app update occurs on the server, old component chunks no longer exist.
This utility catches dynamic import failures, clears stale SW caches, and performs a single clean page refresh.
*/
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
  exportName?: string
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem('anis_chunk_retry_refreshed');

    try {
      const module = await factory();
      // Reset retry flag on successful import
      sessionStorage.removeItem('anis_chunk_retry_refreshed');

      if (exportName && module && module[exportName]) {
        return { default: module[exportName] };
      }
      return module.default ? module : { default: module };
    } catch (error) {
      console.warn('Dynamic import chunk load error detected during app update:', error);

      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem('anis_chunk_retry_refreshed', 'true');
        // Clear caches so the browser gets fresh index.html with new chunk filenames
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          } catch (e) {
            console.error('Error clearing caches on chunk load retry:', e);
          }
        }
        window.location.reload();
      }

      throw error;
    }
  });
}
