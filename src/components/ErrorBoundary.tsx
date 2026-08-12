import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              لقد واجه التطبيق مشكلة تقنية حالت دون استكمال العملية. نعتذر عن هذا الخلل.
            </p>
            
            {this.state.error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl text-xs text-left mb-6 overflow-x-auto" dir="ltr">
                <code className="block mb-2 font-bold">{this.state.error.message}</code>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white font-bold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={18} />
              <span>إعادة تحميل الصفحة</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
