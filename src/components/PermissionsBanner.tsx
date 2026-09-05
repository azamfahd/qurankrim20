import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Settings } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAppEvent } from '../services/appEventBus';

interface PermissionsBannerProps {
  onOpenSettings: () => void;
}

export const PermissionsBanner: React.FC<PermissionsBannerProps> = ({ onOpenSettings }) => {
  const [isVisible, setIsVisible] = useState(false);

  const checkPermissions = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } catch (error) {
      console.warn('Failed to check permissions', error);
    }
  }, []);

  useEffect(() => {
    // Check on mount
    checkPermissions();

    // Re-check when window gains focus
    window.addEventListener('focus', checkPermissions);
    return () => {
      window.removeEventListener('focus', checkPermissions);
    };
  }, [checkPermissions]);

  // Clean typed event bus listener
  useAppEvent('APP_PERMISSIONS_UPDATED', () => {
    checkPermissions();
  }, [checkPermissions]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 z-50 bg-red-50 border-l-4 border-red-500 rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900 font-readex">
              تنبيه: الإشعارات والأذان معطل!
            </h3>
            <p className="text-xs text-red-700 mt-1 font-amiri leading-relaxed">
              يحتاج التطبيق إلى صلاحية الإشعارات والعمل في الخلفية لضمان تنبيهك بأوقات الصلاة والأذكار في وقتها الصحيح.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsVisible(false);
            onOpenSettings();
          }}
          className="shrink-0 w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 font-readex"
        >
          <Settings size={14} />
          <span>إصلاح المشكلة</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
