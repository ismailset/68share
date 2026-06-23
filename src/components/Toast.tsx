import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, duration };
    
    setToasts((prev) => {
      // Limit to max 3 toasts to avoid screen clutter
      const next = [...prev, newToast];
      if (next.length > 3) {
        return next.slice(next.length - 3);
      }
      return next;
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Helper styles based on type
  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-emerald-500/20 bg-emerald-50/95 text-emerald-900',
          iconColor: 'text-emerald-500',
          icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
        };
      case 'error':
        return {
          border: 'border-rose-500/20 bg-rose-50/95 text-rose-900',
          iconColor: 'text-rose-500',
          icon: <ShieldAlert className="w-5 h-5 shrink-0" />,
        };
      case 'warning':
        return {
          border: 'border-amber-500/20 bg-amber-50/95 text-amber-900',
          iconColor: 'text-amber-500',
          icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
        };
      case 'info':
      default:
        return {
          border: 'border-blue-500/20 bg-blue-50/95 text-blue-900',
          iconColor: 'text-blue-500',
          icon: <Info className="w-5 h-5 shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      
      {/* Toast container floating at top-right */}
      <div id="toast-container" className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((item) => {
            const style = getToastStyle(item.type);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 bg-white/95 border shadow-lg rounded-2xl ${style.border} select-none`}
              >
                {style.icon}
                <div className="flex-grow min-w-0 pr-1">
                  <p className="text-xs sm:text-sm font-sans font-medium leading-relaxed break-words">
                    {item.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(item.id)}
                  className="shrink-0 p-1 rounded-lg hover:bg-black/5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
