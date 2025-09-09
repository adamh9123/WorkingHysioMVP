import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'hysio-button hysio-focus-enhanced inline-flex items-center justify-center whitespace-nowrap font-button transition-brand duration-brand',
  {
    variants: {
      variant: {
        primary: 'hysio-button-primary',
        secondary: 'hysio-button-secondary',
        outline: 'bg-transparent border-2 border-border-primary text-text-secondary hover:bg-primary hover:text-primary-foreground rounded-input',
        ghost: 'bg-transparent text-text-secondary hover:bg-border-primary/10 hover:text-text-primary rounded-input',
        destructive: 'bg-hysio-red-flag text-white hover:bg-red-700 rounded-input shadow-brand-sm hover:shadow-brand',
        link: 'text-text-secondary underline-offset-4 hover:underline p-0 h-auto bg-transparent',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-input',
        md: 'h-11 px-6 text-button rounded-input',
        lg: 'h-12 px-8 text-lg rounded-button min-w-[140px]',
        xl: 'h-14 px-10 text-xl rounded-button min-w-[160px]',
        icon: 'h-10 w-10 p-0 rounded-input',
        'icon-sm': 'h-8 w-8 p-0 rounded-input',
        'icon-lg': 'h-12 w-12 p-0 rounded-button',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        data-loading={loading}
        {...props}
      >
        {loading && (
          <Loader2 
            className="h-4 w-4 mr-2 animate-spin" 
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };