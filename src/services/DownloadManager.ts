type Listener = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, Listener[]> = {};
  on(event: string, listener: Listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  off(event: string, listener: Listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

export interface DownloadTask {
  id: string;
  title: string;
  type: 'adhan' | 'quran-surah' | 'quran-text' | 'adhan-all';
  payload: any;
  progress: number;
  status: 'pending' | 'downloading' | 'paused' | 'error' | 'completed';
  errorMsg?: string;
  totalItems: number;
  completedItems: number;
  abortController?: AbortController;
  execute: (task: DownloadTask, signal: AbortSignal) => Promise<void>;
}

class DownloadManagerService extends EventEmitter {
  private tasks: Map<string, DownloadTask> = new Map();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    super();
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.tasks.forEach(task => {
      if (task.status === 'paused' || task.status === 'error') {
        this.resumeTask(task.id);
      }
    });
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.tasks.forEach(task => {
      if (task.status === 'downloading') {
        this.pauseTask(task.id, 'انقطع الاتصال بالإنترنت');
      }
    });
  };

  getTasks(): DownloadTask[] {
    return Array.from(this.tasks.values());
  }

  addTask(task: Omit<DownloadTask, 'progress' | 'status' | 'completedItems' | 'totalItems' | 'abortController'> & { totalItems?: number }) {
    if (this.tasks.has(task.id)) {
        const existing = this.tasks.get(task.id)!;
        if (existing.status !== 'downloading' && existing.status !== 'completed') {
            this.resumeTask(task.id);
        }
        return;
    }

    const newTask: DownloadTask = {
      ...task,
      progress: 0,
      status: 'pending',
      completedItems: 0,
      totalItems: task.totalItems || 100,
    };
    this.tasks.set(task.id, newTask);
    this.emit('update', this.getTasks());
    
    if (this.isOnline) {
      this.startTaskExecution(task.id);
    } else {
      this.pauseTask(task.id, 'بانتظار توفر الإنترنت...');
    }
  }

  updateProgress(taskId: string, completedItems: number, totalItems: number, percent?: number) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    task.completedItems = completedItems;
    task.totalItems = totalItems;
    task.progress = percent !== undefined ? percent : Math.floor((completedItems / totalItems) * 100);
    this.emit('update', this.getTasks());
  }

  completeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    task.status = 'completed';
    task.progress = 100;
    this.emit('update', this.getTasks());
    
    setTimeout(() => {
        if (this.tasks.get(taskId)?.status === 'completed') {
            this.tasks.delete(taskId);
            this.emit('update', this.getTasks());
        }
    }, 5000);
  }

  errorTask(taskId: string, error: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    task.status = 'error';
    task.errorMsg = error;
    this.emit('update', this.getTasks());
  }

  pauseTask(taskId: string, reason?: string) {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed') return;
    
    if (task.abortController) {
      task.abortController.abort();
      task.abortController = undefined;
    }
    task.status = 'paused';
    if (reason) task.errorMsg = reason;
    this.emit('update', this.getTasks());
  }

  cancelTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    if (task.abortController) {
      task.abortController.abort();
    }
    this.tasks.delete(taskId);
    this.emit('update', this.getTasks());
  }

  resumeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed' || task.status === 'downloading') return;
    
    if (!this.isOnline) {
        this.errorTask(taskId, 'لا يوجد اتصال بالإنترنت');
        return;
    }
    
    this.startTaskExecution(taskId);
  }

  private async startTaskExecution(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'downloading';
    task.errorMsg = undefined;
    const abortController = new AbortController();
    task.abortController = abortController;
    this.emit('update', this.getTasks());

    try {
      await task.execute(task, abortController.signal);
      if (!abortController.signal.aborted) {
        this.completeTask(taskId);
      }
    } catch (e: any) {
      if (e.name === 'AbortError' || abortController.signal.aborted) {
         // It was paused/canceled intentionally
      } else {
         this.errorTask(taskId, e.message || 'فشل التحميل');
      }
    }
  }
}

export const DownloadManager = new DownloadManagerService();
