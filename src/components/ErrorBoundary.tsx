import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Wrench } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);

    // Dynamic import / chunk error detection during app update
    const errorMessage = error?.message || '';
    const isChunkError =
      errorMessage.includes('dynamically imported module') ||
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('importing a module script') ||
      errorMessage.includes('Failed to fetch');

    if (isChunkError) {
      const pageHasBeenRefreshed = sessionStorage.getItem('anis_error_boundary_refreshed');
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem('anis_error_boundary_refreshed', 'true');
        if (typeof caches !== 'undefined') {
          caches.keys().then((keys) => {
            Promise.all(keys.map((k) => caches.delete(k))).then(() => {
              window.location.reload();
            });
          }).catch(() => {
            window.location.reload();
          });
        } else {
          window.location.reload();
        }
      }
    }
  }

  private handleHardRefresh = async () => {
    sessionStorage.removeItem('anis_error_boundary_refreshed');
    sessionStorage.removeItem('anis_chunk_retry_refreshed');
    if (typeof caches !== 'undefined') {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      } catch (e) {}
    }
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      } catch (e) {}
    }
    window.location.reload();
  };

  private handleResetCache = async () => {
    try {
      localStorage.removeItem('anis_active_chat');
      localStorage.removeItem('anis_active_session_id');
      sessionStorage.clear();
    } catch (e) {}
    await this.handleHardRefresh();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] bg-emerald-950/20 rounded-2xl my-4 border border-emerald-900/40">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">عذراً، حدث استثناء غير متوقع</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300 mb-6 max-w-md leading-relaxed">
            حدث هذا الأمر عادة عند تحديث التطبيق أو تعثر تحميل أحد الأجزاء. يمكنك الاستمرار بسهولة عن طريق تحديث التطبيق وإعادة التحميل.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleHardRefresh}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-colors text-sm font-medium shadow-md cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              تحديث وحل الملاحظة
            </button>
            <button
              onClick={this.handleResetCache}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-full transition-colors text-xs font-medium shadow-sm cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              إصلاح السجل والبدء من جديد
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
