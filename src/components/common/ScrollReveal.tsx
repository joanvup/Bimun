import React from 'react';
import { motion, Variants } from 'motion/react';

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

export const defaultTransition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeInUpVariants: Variants = {
  hidden: (custom = {}) => ({
    opacity: 0,
    y: custom.yOffset ?? 32,
    x: custom.xOffset ?? 0,
  }),
  visible: (custom = {}) => ({
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      duration: custom.duration ?? 0.65,
      delay: custom.delay ?? 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/**
 * ScrollReveal renders a container that animates with fade-in and slide-up
 * as it enters the viewport when the user scrolls.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  id,
  delay = 0,
  duration = 0.65,
  yOffset = 32,
  xOffset = 0,
  once = true,
  amount = 0.15,
}) => {
  return (
    <motion.div
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={fadeInUpVariants}
      custom={{ delay, duration, yOffset, xOffset }}
      className={className}
    >
      {children}
    </motion.div>
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

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: ({ staggerDelay = 0.1, delayChildren = 0 } = {}) => ({
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  }),
};

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 28,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/**
 * ScrollStaggerContainer animates its child ScrollStaggerItem elements sequentially
 * with a graceful fade-in and slide-up effect upon entering the viewport.
 */
export const ScrollStaggerContainer: React.FC<ScrollStaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = 0.08,
  delayChildren = 0.05,
  once = true,
  amount = 0.1,
}) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={staggerContainerVariants}
      custom={{ staggerDelay, delayChildren }}
      className={className}
    >
      {children}
    </motion.div>
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
    <motion.div variants={staggerItemVariants} className={className} onClick={onClick}>
      {children}
    </motion.div>
  );
};
