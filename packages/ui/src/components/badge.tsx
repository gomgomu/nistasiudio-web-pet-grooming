import * as React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'blue' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none focus:ring-2';

  const variants = {
    default: 'bg-blue-50 text-[#0071e3] border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/50',
    blue: 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20',
    secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40',
    outline: 'border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300',
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
