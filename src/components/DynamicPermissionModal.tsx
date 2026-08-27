import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, BellRing, MapPin, Activity, X } from 'lucide-react';
import { PermissionService, PermissionRequestOptions, PermissionType } from '../services/permissionService';

export const DynamicPermissionModal: React.FC = () => {
  const [request, setRequest] = useState<PermissionRequestOptions | null>(null);

  useEffect(() => {
    PermissionService.setModalListener((options) => {
      setRequest(options);
    });
  }, []);

  if (!request) return null;

  const handleGrant = () => {
    if (request.onGrant) request.onGrant();
    setRequest(null);
  };

  const handleDeny = () => {
    if (request.onDeny) request.onDeny();
    setRequest(null);
  };

  const getIcon = (type: PermissionType) => {
    switch (type) {
      case 'notifications': return <BellRing size={36} className="text-[var(--color-gold)]" />;
      case 'location': return <MapPin size={36} className="text-[var(--color-gold)]" />;
      case 'audio': return <Activity size={36} className="text-[var(--color-gold)]" />;
      case 'background': return <ShieldAlert size={36} className="text-[var(--color-gold)]" />;
      default: return <ShieldAlert size={36} className="text-[var(--color-gold)]" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={handleDeny}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center border border-slate-100 dark:border-slate-800"
          dir="rtl"
        >
          <button
            onClick={handleDeny}
            className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="mx-auto w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            {getIcon(request.type)}
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {request.title || 'صلاحية مطلوبة'}
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {request.description || 'يحتاج التطبيق إلى هذه الصلاحية لتقديم أفضل تجربة لك.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGrant}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              السماح الآن
            </button>
            <button
              onClick={handleDeny}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium py-3.5 rounded-2xl transition-colors active:scale-95"
            >
              ليس الآن
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
