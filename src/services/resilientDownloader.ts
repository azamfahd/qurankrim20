/**
 * Resilient Downloader Utility
 * Provides robust, retry-enabled, chunk/concurrency-controlled downloads
 * with strict MIME-type & payload verification (protects against SPA 404 HTML caching).
 */

export interface DownloadOptions {
  retries?: number;
  timeoutMs?: number;
  minBytes?: number;
  signal?: AbortSignal;
  retryDelayMs?: number;
}

export interface BatchDownloadOptions<T> {
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (completed: number, total: number, percentage: number) => void;
  onItemSuccess?: (item: T, index: number) => void;
  onItemFailure?: (item: T, index: number, error: any) => void;
}

export class ResilientDownloader {
  /**
   * Validates if a Blob is real audio/binary and not an HTML SPA fallback
   */
  public static async isValidAudioBlob(blob: Blob, minBytes: number = 2000): Promise<boolean> {
    if (!blob || blob.size < minBytes) return false;

    // Check MIME type if available
    const type = (blob.type || '').toLowerCase();
    if (type.includes('text/html') || type.includes('text/plain') || type.includes('application/xhtml+xml')) {
      return false;
    }

    // Inspect first 64 bytes to ensure it does not start with HTML tags like <!DOCTYPE or <html
    try {
      const slice = blob.slice(0, 64);
      const text = await slice.text();
      const trimmed = text.trim().toLowerCase();
      if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<head') || trimmed.startsWith('<?xml')) {
        return false;
      }
    } catch {
      // If text decoding fails on binary, it's likely a real binary audio stream
    }

    return true;
  }

  /**
   * Fetches an audio file with automatic retries, timeout protection, and integrity verification.
   */
  public static async fetchAudioBlob(
    url: string,
    options: DownloadOptions = {}
  ): Promise<Blob | null> {
    const {
      retries = 3,
      timeoutMs = 15000,
      minBytes = 2000,
      signal,
      retryDelayMs = 800
    } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      if (signal?.aborted) {
        throw new Error('Aborted');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const abortHandler = () => controller.abort();
      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        const blob = await response.blob();
        const isValid = await this.isValidAudioBlob(blob, minBytes);
        if (!isValid) {
          throw new Error('Payload failed integrity check (corrupted or HTML response)');
        }

        return blob;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }

        if (err.name === 'AbortError' && signal?.aborted) {
          throw new Error('Aborted');
        }

        console.warn(`[ResilientDownloader] Attempt ${attempt}/${retries} failed for: ${url}`, err?.message || err);

        if (attempt < retries) {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, retryDelayMs * attempt));
        }
      }
    }

    return null;
  }

  /**
   * Executes a batch of downloads with concurrency control and progress tracking.
   */
  public static async runBatch<T>(
    items: T[],
    processFn: (item: T, index: number, signal?: AbortSignal) => Promise<boolean>,
    options: BatchDownloadOptions<T> = {}
  ): Promise<{ succeeded: number; failed: number; total: number }> {
    const {
      concurrency = 3,
      signal,
      onProgress,
      onItemSuccess,
      onItemFailure
    } = options;

    const total = items.length;
    if (total === 0) {
      return { succeeded: 0, failed: 0, total: 0 };
    }

    let completed = 0;
    let succeeded = 0;
    let failed = 0;

    // Report initial progress
    if (onProgress) {
      onProgress(0, total, 0);
    }

    // Queue of indexed items
    const queue = items.map((item, index) => ({ item, index }));

    const worker = async () => {
      while (queue.length > 0) {
        if (signal?.aborted) {
          throw new Error('Aborted');
        }

        const entry = queue.shift();
        if (!entry) break;

        const { item, index } = entry;
        try {
          const success = await processFn(item, index, signal);
          if (success) {
            succeeded++;
            if (onItemSuccess) onItemSuccess(item, index);
          } else {
            failed++;
            if (onItemFailure) onItemFailure(item, index, new Error('Processing returned false'));
          }
        } catch (err: any) {
          if (err?.message === 'Aborted' || signal?.aborted) {
            throw err;
          }
          failed++;
          if (onItemFailure) onItemFailure(item, index, err);
        } finally {
          completed++;
          if (onProgress) {
            const percentage = Math.round((completed / total) * 100);
            onProgress(completed, total, percentage);
          }
        }
      }
    };

    const workerCount = Math.min(concurrency, total);
    const workers = Array.from({ length: workerCount }, () => worker());

    await Promise.all(workers);

    return { succeeded, failed, total };
  }
}
