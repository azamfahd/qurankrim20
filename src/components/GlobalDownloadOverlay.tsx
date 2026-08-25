import React, { useEffect, useState } from 'react';
import { DownloadManager, DownloadTask } from '../services/DownloadManager';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, AlertCircle, CheckCircle2, Download } from 'lucide-react';

export const GlobalDownloadOverlay: React.FC = () => {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleUpdate = (updatedTasks: DownloadTask[]) => {
      setTasks([...updatedTasks]);
    };
    
    DownloadManager.on('update', handleUpdate);
    setTasks(DownloadManager.getTasks());
    
    return () => {
      DownloadManager.off('update', handleUpdate);
    };
  }, []);

  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-80 max-w-[calc(100vw-2rem)] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {!isMinimized && tasks.map(task => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 pointer-events-auto"
            dir="rtl"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  task.status === 'error' ? 'bg-red-100 text-red-600' :
                  task.status === 'paused' ? 'bg-amber-100 text-amber-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {task.status === 'completed' ? <CheckCircle2 size={16} /> :
                   task.status === 'error' ? <AlertCircle size={16} /> :
                   <Download size={16} className={task.status === 'downloading' ? 'animate-bounce' : ''} />}
                </div>
                <div className="truncate flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {task.status === 'downloading' ? `جاري التحميل... ${task.progress}%` :
                     task.status === 'paused' ? 'متوقف مؤقتاً' :
                     task.status === 'error' ? (task.errorMsg || 'حدث خطأ') :
                     'اكتمل التحميل'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                {task.status === 'downloading' && (
                  <button onClick={() => DownloadManager.pauseTask(task.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600">
                    <Pause size={14} />
                  </button>
                )}
                {(task.status === 'paused' || task.status === 'error') && (
                  <button onClick={() => DownloadManager.resumeTask(task.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600">
                    <Play size={14} />
                  </button>
                )}
                <button onClick={() => DownloadManager.cancelTask(task.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-red-500">
                  <X size={14} />
                </button>
              </div>
            </div>
            
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full relative">
              <motion.div 
                className={`absolute top-0 bottom-0 left-0 right-0 origin-right ${
                  task.status === 'error' ? 'bg-red-500' :
                  task.status === 'paused' ? 'bg-amber-500' :
                  task.status === 'completed' ? 'bg-emerald-500' :
                  'bg-blue-500'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: task.progress / 100 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
