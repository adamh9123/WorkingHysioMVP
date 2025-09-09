import * as React from 'react';
import { cn } from '@/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    hover?: boolean;
    module?: 'scribe' | 'assistant' | 'go' | 'pro';
  }
>(({ className, hover = true, module, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'hysio-card',
      hover && 'hover:shadow-brand-lg hover:-translate-y-1 cursor-pointer',
      module && `border-l-4 border-l-hysio-${module}`,
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 pb-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4;
  }
>(({ className, level = 3, ...props }, ref) => {
  const Tag = `h${level}` as const;
  
  const sizeClasses = {
    1: 'text-h1',
    2: 'text-h2', 
    3: 'text-h3',
    4: 'text-h4'
  };

  return (
    <Tag
      ref={ref}
      className={cn(
        sizeClasses[level],
        'font-semibold leading-tight tracking-tight text-text-secondary',
        className
      )}
      {...props}
    />
  );
});
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-body text-text-primary leading-relaxed', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-6 gap-3', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

const CardBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    module?: 'scribe' | 'assistant' | 'go' | 'pro';
  }
>(({ className, module, children, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'hysio-module-badge',
      module && `hysio-module-${module}`,
      className
    )}
    {...props}
  >
    {children}
  </span>
));
CardBadge.displayName = 'CardBadge';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardBadge 
};