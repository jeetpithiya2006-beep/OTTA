import React, { useEffect } from 'react';
import { CheckCircle2, LogOut, Info, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export type ToastType = 'check-in' | 'check-out' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'check-in': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'check-out': return <LogOut className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'check-in': return "border-l-4 border-l-emerald-500";
      case 'check-out': return "border-l-4 border-l-amber-500";
      default: return "border-l-4 border-l-blue-500";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-full duration-300">
      <div className={twMerge(
        "flex items-center gap-3 p-4 pr-12 min-w-[300px] rounded-lg shadow-2xl backdrop-blur-xl transition-all",
        "bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800",
        getStyles()
      )}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {type === 'check-in' ? 'Check In' : type === 'check-out' ? 'Check Out' : 'Notification'}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
