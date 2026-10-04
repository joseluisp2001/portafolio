import { cn } from './cn';

export interface ButtonStyleProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'quiet';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function buttonStyles({ variant = 'primary', size = 'md', className }: ButtonStyleProps = {}) {
  return cn(
    'inline-flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
    {
      'bg-cyan-500 text-white hover:bg-cyan-600 rounded-xl font-semibold': variant === 'primary',
      'bg-slate-800 text-white hover:bg-slate-700 rounded-xl font-semibold': variant === 'secondary',
      'border-2 border-cyan-500 text-cyan-700 hover:bg-cyan-50 rounded-xl font-semibold': variant === 'outline',
      'text-cyan-700 hover:text-cyan-800 underline-offset-4 hover:underline rounded-md': variant === 'quiet',
      
      'px-4 py-2 text-sm': size === 'sm',
      'px-6 py-3 text-base': size === 'md',
      'px-8 py-4 text-lg': size === 'lg',
    },
    className
  );
}
