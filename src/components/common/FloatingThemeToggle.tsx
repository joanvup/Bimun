import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

interface FloatingThemeToggleProps {
  className?: string;
  position?: 'bottom-left' | 'bottom-right';
}

export const FloatingThemeToggle: React.FC<FloatingThemeToggleProps> = ({
  className = '',
  position = 'bottom-left',
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { language } = useLanguage();

  const label = isDark
    ? language === 'en'
      ? 'Switch to Light Mode'
      : 'Cambiar a Modo Claro'
    : language === 'en'
      ? 'Switch to Dark Mode'
      : 'Cambiar a Modo Oscuro';

  const positionClasses =
    position === 'bottom-left'
      ? 'fixed bottom-6 left-6 z-40'
      : 'fixed bottom-20 right-6 z-40';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`${positionClasses} group ${className}`}
    >
      <button
        id="floating-theme-toggle-btn"
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        title={label}
        className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-amber-300 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500/60 dark:hover:border-amber-400/60 hover:scale-105 active:scale-95 transition-all duration-300 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-amber-400/50 cursor-pointer overflow-hidden"
      >
        {/* Subtle Ambient Ring Glow on Hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-blue-500/10 to-indigo-500/10 dark:from-amber-400/15 dark:via-cyan-400/10 dark:to-blue-600/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Animated Sun / Moon Icon with smooth rotation */}
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="dark-icon"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center justify-center text-amber-400"
            >
              <Sun className="w-5 h-5 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            </motion.div>
          ) : (
            <motion.div
              key="light-icon"
              initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center justify-center text-indigo-600"
            >
              <Moon className="w-5 h-5 drop-shadow-[0_0_6px_rgba(79,70,229,0.3)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip on Desktop */}
        <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] font-medium tracking-wide whitespace-nowrap shadow-xl border border-slate-700/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {isDark ? '☀️' : '🌙'}
          </span>
        </span>
      </button>
    </motion.div>
  );
};
