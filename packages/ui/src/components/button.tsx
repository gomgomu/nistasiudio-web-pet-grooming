import * as React from 'react';
import { cn } from '../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'danger' | 'apple-pill';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      default:
        'bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-sm shadow-blue-600/20 active:bg-[#005bb5]',
      outline:
        'border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm',
      secondary:
        'bg-[#f0f7ff] text-[#0071e3] hover:bg-[#e0effe] dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/70',
      ghost:
        'bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300',
      danger:
        'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20',
      'apple-pill':
        'rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] shadow-md shadow-blue-500/25',
    };

    const sizes = {
      sm: 'h-8 px-3.5 text-xs font-medium',
      md: 'h-10 px-4 text-sm font-medium',
      lg: 'h-11 px-6 text-base font-semibold',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
