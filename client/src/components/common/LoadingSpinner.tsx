import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeMap[size]} text-brand-500 animate-spin`} />
        <div className="absolute inset-0 blur-lg bg-brand-500/20 rounded-full animate-pulse" />
      </div>
      {text && (
        <span className="text-sm font-medium text-slate-400 animate-pulse tracking-wide">
          {text}
        </span>
      )}
    </div>
  );
};
