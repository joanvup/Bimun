import React from 'react';

export interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  xOffset?: number;
  once?: boolean;
  amount?: number | 'some' | 'all';
  as?: 'div' | 'section' | 'article' | 'span';
}

/**
 * ScrollReveal: Renders content immediately without blank screen delays,
 * ensuring zero-latency content availability on all viewports.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  id,
}) => {
  return (
    <div id={id} className={`transition-opacity duration-300 opacity-100 ${className}`}>
      {children}
    </div>
  );
};

export interface ScrollStaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
  once?: boolean;
  amount?: number | 'some' | 'all';
}

export const ScrollStaggerContainer: React.FC<ScrollStaggerContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export interface ScrollStaggerItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const ScrollStaggerItem: React.FC<ScrollStaggerItemProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
};
