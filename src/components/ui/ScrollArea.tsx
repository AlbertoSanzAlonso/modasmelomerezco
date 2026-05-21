import React from 'react';
import { cn } from '@/lib/cn';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Clases del área scroll (p. ej. flex-1 min-h-0 px-10) */
  className?: string;
  /** Alias de className para el mismo nodo scroll */
  viewportClassName?: string;
  /**
   * Separación vertical del track respecto al borde (px).
   * Evita que la barra invada las esquinas redondeadas del modal.
   * @default 22
   */
  trackInset?: number;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

/**
 * Área de scroll con barra fina, thumb visible y track acortado en modales redondeados.
 *
 * Dentro de un modal: el shell lleva `flex flex-col max-h-[90vh] min-h-0 overflow-hidden`
 * y ScrollArea `className="flex-1 min-h-0"`.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      children,
      className,
      viewportClassName,
      trackInset = 22,
      orientation = 'vertical',
      style,
      ...props
    },
    ref
  ) => {
    const overflowClass =
      orientation === 'horizontal'
        ? 'overflow-x-auto overflow-y-hidden'
        : orientation === 'both'
          ? 'overflow-auto'
          : 'overflow-y-auto overflow-x-hidden';

    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          'scroll-area-viewport min-h-0 min-w-0 overscroll-contain',
          overflowClass,
          className,
          viewportClassName
        )}
        style={{
          ...style,
          ['--scroll-track-inset' as string]: `${trackInset}px`,
        }}
        data-track-inset={trackInset}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
