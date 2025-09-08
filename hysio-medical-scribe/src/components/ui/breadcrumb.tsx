import * as React from 'react';
import { cn } from '@/utils';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLNavElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  homeHref?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight size={14} className="text-hysio-deep-green-900/50" />,
  showHome = true,
  homeHref = '/',
  className,
  ...props
}) => {
  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {showHome && (
          <>
            <li>
              <a
                href={homeHref}
                className="flex items-center text-hysio-deep-green-900/70 hover:text-hysio-deep-green transition-colors"
                aria-label="Home"
              >
                <Home size={16} />
              </a>
            </li>
            {items.length > 0 && (
              <li className="flex items-center">{separator}</li>
            )}
          </>
        )}
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              {item.current || !item.href ? (
                <span
                  className={cn(
                    'font-medium',
                    item.current
                      ? 'text-hysio-deep-green'
                      : 'text-hysio-deep-green-900/70'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="text-hysio-deep-green-900/70 hover:text-hysio-deep-green transition-colors"
                >
                  {item.label}
                </a>
              )}
            </li>
            
            {index < items.length - 1 && (
              <li className="flex items-center">{separator}</li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

export { Breadcrumb };