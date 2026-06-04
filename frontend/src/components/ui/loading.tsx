import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className={`${sizeClasses[size]} text-primary`} />
      </motion.div>
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <motion.div
        className="bg-primary h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

export function ReportCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="px-3 pb-4 space-y-3" aria-label="Loading reports">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl p-4"
          style={{ background: '#0F2040', border: '1px solid rgba(0,212,255,0.08)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded-full skeleton-shimmer" />
              <div className="h-2 w-1/2 rounded-full skeleton-shimmer" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-3 w-full rounded-full skeleton-shimmer" />
            <div className="h-3 w-4/5 rounded-full skeleton-shimmer" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-7 w-24 rounded-full skeleton-shimmer" />
            <div className="h-3 w-16 rounded-full skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
