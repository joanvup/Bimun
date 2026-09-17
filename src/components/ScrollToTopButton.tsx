import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

export const ScrollToTopButton: React.FC = () => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      // Calculate scroll progress percentage (0 - 100)
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        setScrollProgress(progress);
      }

      // Show button after scrolling past 320px
      if (scrollY > 320) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const labelText = language === 'en' ? 'Scroll to top' : 'Volver al inicio';

  // Circle stroke calculation
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 z-40 group"
        >
          <button
            id="scroll-to-top-btn"
            type="button"
            onClick={scrollToTop}
            aria-label={labelText}
            title={labelText}
            className="relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-950/90 text-white shadow-xl shadow-slate-950/40 border border-slate-700/80 hover:border-blue-500 hover:bg-slate-900 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer"
          >
            {/* Circular SVG Scroll Progress Indicator */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              {/* Background ring */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                className="text-slate-800"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
              />
              {/* Progress ring with brand gradient/color */}
              <circle
                cx="24"
                cy="24"
                r={radius}
                className="text-blue-500 transition-all duration-150 ease-out"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
              />
            </svg>

            {/* Icon */}
            <ArrowUp className="w-5 h-5 text-slate-200 group-hover:text-blue-400 group-hover:-translate-y-0.5 transition-all duration-200" />

            {/* Hover Tooltip on Desktop */}
            <span className="pointer-events-none absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900/95 text-white text-[11px] font-semibold tracking-wide whitespace-nowrap shadow-lg border border-slate-700/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
              {labelText}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
