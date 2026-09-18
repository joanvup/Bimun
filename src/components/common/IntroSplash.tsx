import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Sparkles, ChevronRight, Shield, Award } from 'lucide-react';
import { BIMUNSettings } from '../../types.ts';

interface IntroSplashProps {
  settings?: BIMUNSettings | null;
  onFinish: () => void;
  isDataReady?: boolean;
}

const LOADING_MESSAGES = [
  'Iniciando protocolos diplomáticos...',
  'Sincronizando comisiones y delegaciones...',
  'Cargando matrices académicas y resoluciones...',
  'Preparando agenda oficial de asamblea...',
  '¡Bienvenido al Modelo de Naciones Unidas!',
];

export const IntroSplash: React.FC<IntroSplashProps> = ({
  settings,
  onFinish,
  isDataReady = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Smooth progress ticker
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2400; // 2.4 seconds total animation duration

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / duration) * 100));

      setProgress(rawProgress);

      if (rawProgress < 25) {
        setStepIndex(0);
      } else if (rawProgress < 50) {
        setStepIndex(1);
      } else if (rawProgress < 75) {
        setStepIndex(2);
      } else if (rawProgress < 95) {
        setStepIndex(3);
      } else {
        setStepIndex(4);
      }

      if (rawProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(onFinish, 750); // allow exit transition to play
        }, 300);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [onFinish]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(onFinish, 300);
  };

  const editionName = settings?.edition || 'BIMUN XXVII';
  const bimunTitle = settings?.bimun_name || 'BIMUN';
  const slogan = settings?.slogan || 'Forjando Líderes y Ciudadanos Globales';

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          key="bimun-intro-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden select-none"
        >
          {/* Ambient Glows and Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(30,58,138,0.35),rgba(2,6,23,0.95)_70%)]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Background Micro-Stars / Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: Math.random() * 0.4 + 0.2,
                  y: Math.random() * 100 + '%',
                  x: Math.random() * 100 + '%',
                  scale: Math.random() * 0.6 + 0.4,
                }}
                animate={{
                  y: ['-10%', '110%'],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 8 + (i % 6) * 3,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: (i % 4) * 0.8,
                }}
                className={`absolute w-1 h-1 rounded-full ${
                  i % 3 === 0 ? 'bg-amber-300 shadow-[0_0_8px_#f59e0b]' : 'bg-cyan-300 shadow-[0_0_8px_#06b6d4]'
                }`}
              />
            ))}
          </div>

          {/* Top Skip Button */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute top-6 right-6 z-20"
          >
            <button
              onClick={handleSkip}
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-500 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-lg backdrop-blur-md cursor-pointer"
            >
              <span>Omitir</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* Main Central Presentation */}
          <div className="relative z-10 flex flex-col items-center justify-center max-w-xl px-6 text-center">
            
            {/* Emblem and Orbital Rings System */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-8">
              
              {/* Outer Orbital Ring (Counter-Clockwise) */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-blue-500/25 pointer-events-none"
              />

              {/* Middle Orbital Ring with Golden Accent (Clockwise) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 sm:inset-3 rounded-full border border-cyan-400/20 pointer-events-none flex items-center justify-between p-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
              </motion.div>

              {/* Outer Radiant Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.5, 0.85, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-4 rounded-full bg-gradient-to-tr from-blue-600/30 via-cyan-500/20 to-amber-500/20 blur-xl pointer-events-none"
              />

              {/* Central Shield / Logo Badge */}
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-b from-cyan-400 via-blue-600 to-indigo-900 shadow-[0_0_40px_rgba(37,99,235,0.45)] flex items-center justify-center"
              >
                <div className="w-full h-full bg-slate-950/90 backdrop-blur-xl rounded-[22px] flex items-center justify-center p-3 border border-blue-400/30 overflow-hidden relative group">
                  {/* Internal Sheen Reflection */}
                  <motion.div
                    animate={{ x: ['-120%', '160%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
                  />

                  {settings?.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt={bimunTitle}
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_12px_rgba(59,130,246,0.5)]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-blue-400">
                      <Globe className="w-14 h-14 text-cyan-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Institution Header Tag */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-[11px] font-semibold tracking-wider uppercase mb-3 shadow-inner"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Fundación Colegio Bilingüe de Valledupar</span>
            </motion.div>

            {/* Main Display Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16, letterSpacing: '0.05em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.12em' }}
              transition={{ delay: 0.35, duration: 0.8, ease: 'easeOut' }}
              className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-200 tracking-wider mb-2"
            >
              {editionName}
            </motion.h1>

            {/* Subtitle / Slogan */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="text-xs sm:text-sm text-slate-300 font-serif-sub italic max-w-md mx-auto mb-8 line-clamp-2"
            >
              "{slogan}"
            </motion.p>

            {/* Loading Gauge and Step Message */}
            <div className="w-full max-w-md mx-auto space-y-3">
              
              {/* Progress Bar Container */}
              <div className="relative w-full h-2 bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 shadow-inner p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 to-amber-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              {/* Progress Stats & Current Step */}
              <div className="flex items-center justify-between text-xs px-1">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="text-slate-400 font-medium truncate max-w-[80%] text-left"
                >
                  {LOADING_MESSAGES[stepIndex]}
                </motion.div>
                <div className="font-mono font-bold text-cyan-400 tracking-wider">
                  {progress}%
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Security / Protocol Watermark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="absolute bottom-6 inset-x-0 text-center text-[10px] uppercase tracking-widest text-slate-500 font-medium flex items-center justify-center gap-2"
          >
            <span>Plataforma Oficial de Debate y Registro</span>
            <span>•</span>
            <span>Secretaría General</span>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
