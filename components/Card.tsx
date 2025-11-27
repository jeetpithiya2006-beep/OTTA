import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, subtitle, action }) => {
  return (
    <div className={twMerge(
      "bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800/50 rounded-xl p-6 shadow-lg dark:shadow-xl transition-all duration-300", 
      className
    )}>
      {(title || action) && (
        <div className="flex justify-between items-start mb-6">
          <div>
            {title && <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>}
            {subtitle && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};