import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white hover:bg-brand-ink',
        outline: 'border border-line bg-transparent hover:bg-ink/[0.06] text-ink',
        ghost: 'hover:bg-ink/[0.06] text-ink',
        soft: 'bg-ink/[0.09] text-ink hover:bg-ink/[0.14]',
        danger: 'bg-bad text-canvas hover:bg-bad/90',
        lab: 'border border-lab-line bg-lab-raised text-lab-text hover:bg-lab-line',
        signal: 'bg-signal text-lab font-semibold hover:bg-signal/85',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-4',
        lg: 'h-11 px-6 text-[15px]',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
