import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight, BookOpen, FileText } from 'lucide-react';
import { BIMUNSettings } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface HeroProps {
  settings: BIMUNSettings;
  committeesCount: number;
  countriesCount: number;
}

export const Hero: React.FC<HeroProps> = ({ settings, committeesCount, countriesCount }) => {
  const { language, t } = useLanguage();

  // Target countdown calculation
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  useEffect(() => {
    let startDateStr = settings.start_date;
    if (!startDateStr && settings.event_dates_iso) {
      try {
        const iso = typeof settings.event_dates_iso === 'string' ? JSON.parse(settings.event_dates_iso) : settings.event_dates_iso;
        if (iso?.start) startDateStr = iso.start;
      } catch {}
    }
    if (!startDateStr) startDateStr = '2026-10-23';

    const timeStr = settings.inauguration_time || '08:30';
    const [year, month, day] = startDateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    let targetDate = new Date(year, (month || 1) - 1, day || 1, hours || 8, minutes || 30, 0);
    if (isNaN(targetDate.getTime())) {
      targetDate = new Date(2026, 9, 23, 8, 30, 0);
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setHasStarted(false);
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setHasStarted(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings.start_date, settings.inauguration_time, settings.event_dates_iso]);

  const slogan = language === 'en'
    ? 'Diplomacy, leadership, and critical thinking to transform the world'
    : (settings.slogan || 'Diplomacia, liderazgo y pensamiento crítico para transformar el mundo');

  const heroSubtext = language === 'en'
    ? 'Welcome to the Model United Nations of Colegio Bilingüe de Valledupar. A platform for rigorous academic debate, persuasive public speaking, and the forging of global leaders in the Colombian Caribbean.'
    : (settings.hero_subtext || 'Bienvenidos al Modelo de Naciones Unidas del Colegio Bilingüe de Valledupar. Un espacio de debate académico riguroso, oratoria persuasiva y forja de líderes globales en el Caribe colombiano.');

  const dateDisplay = language === 'en'
    ? 'October 23 to 25, 2026'
    : (settings.event_date_display || '23 al 25 de Octubre de 2026');

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try {
          window.history.pushState(null, '', href);
        } catch {}
      } else {
        window.location.hash = href;
      }
    }
  };

  const primaryLink = settings.cta_primary_link || '#inscripciones';
  const secondaryLink = settings.cta_secondary_link || '#comisiones';
  const tertiaryLink = settings.cta_tertiary_link || '#documentos';

  // Calculate diplomatic days
  let diplomaticDays = 3;
  if (settings.start_date && settings.end_date) {
    const start = new Date(settings.start_date);
    const end = new Date(settings.end_date);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      // Add 1 to include both start and end days
      diplomaticDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
  }

  const traditionYears = settings.tradition_years || '27';

  return (
    <section id="inicio" className="relative min-h-[92vh] flex flex-col justify-between pt-32 sm:pt-36 pb-8 overflow-hidden bg-slate-950 text-white">
      {/* Background Image / Video with Cinematic Dynamic Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {settings.hero_video_url ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-50 saturate-110 contrast-105 scale-105"
            src={settings.hero_video_url}
          />
        ) : (
          <img
            src={settings.hero_bg_image || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=2000&q=85'}
            alt="BIMUN Hero"
            className="w-full h-full object-cover opacity-45 sm:opacity-55 saturate-115 contrast-105 scale-105 transition-transform duration-10000"
          />
        )}

        {/* Directional Cinematic Overlays (Keeps left text readable while opening up the right & top lighting) */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
        
        {/* Atmospheric Blue & Indigo Aura Glows */}
        <div className="absolute -top-32 left-1/4 w-[600px] h-[500px] bg-blue-600/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-indigo-500/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[350px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Subtle Geometric Overlay Texture */}
        <div 
          className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" 
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-auto w-full py-6">
        <div className="max-w-3xl space-y-6">
          {/* Title and Edition */}
          <div className="space-y-3">
            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              {settings.bimun_name || 'BIMUN XXVII'}
            </h1>
            <p className="font-serif-sub italic text-xl sm:text-2xl lg:text-3xl text-amber-300 font-light drop-shadow-md leading-snug">
              "{slogan}"
            </p>
          </div>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-slate-200 font-normal leading-relaxed max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            {heroSubtext}
          </p>

          {/* Event Metadata Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-100 backdrop-blur-md shadow-md shadow-black/40">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold tracking-wide">{dateDisplay}</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-100 backdrop-blur-md shadow-md shadow-black/40">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold tracking-wide">
                {settings.venue || 'Campus Principal - Colegio Bilingüe'}, {settings.venue_city || 'Valledupar, Cesar'}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <a
              href={primaryLink}
              onClick={(e) => handleScrollTo(e, primaryLink)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-blue-600/40 hover:shadow-blue-500/60 hover:-translate-y-0.5 flex items-center gap-2.5 group"
            >
              <span>{t.hero.cta_register}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href={secondaryLink}
              onClick={(e) => handleScrollTo(e, secondaryLink)}
              className="px-5 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/95 text-slate-100 hover:text-white font-semibold text-sm border border-slate-600/70 hover:border-blue-500/50 backdrop-blur-md transition-all shadow-md shadow-black/30 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>{t.hero.cta_committees}</span>
            </a>

            <a
              href={tertiaryLink}
              onClick={(e) => handleScrollTo(e, tertiaryLink)}
              className="px-5 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 hover:text-white font-medium text-sm transition-all flex items-center gap-2 border border-slate-700/60 backdrop-blur-md hover:-translate-y-0.5 shadow-sm"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{t.hero.cta_documents}</span>
            </a>
          </div>

          {/* Countdown Clock or Live Badge */}
          <div className="pt-4 sm:pt-6">
            {hasStarted ? (
              <div className="inline-flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-slate-900/80 border border-emerald-500/50 backdrop-blur-md shadow-xl shadow-emerald-950/50 text-white">
                <span className="relative flex h-3.5 w-3.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div>
                  <p className="font-bold text-sm text-emerald-300 tracking-wide uppercase flex items-center gap-2">
                    {language === 'en' ? 'Conference In Session' : '¡Sesión Inaugural en Desarrollo!'}
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">
                    {language === 'en' 
                      ? 'The conference has officially begun. Welcome delegates!'
                      : 'La conferencia ha iniciado formalmente en el Colegio Bilingüe. ¡Bienvenidos delegados!'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-300 mb-2.5 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400" />
                  {t.hero.countdown_title}
                </div>
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3 max-w-md">
                  <div className="bg-slate-900/80 border border-slate-700/80 hover:border-blue-500/50 rounded-xl p-3 text-center backdrop-blur-md shadow-lg shadow-black/40 transition-colors">
                    <span className="block text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">{timeLeft.days}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">{t.hero.days}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700/80 hover:border-blue-500/50 rounded-xl p-3 text-center backdrop-blur-md shadow-lg shadow-black/40 transition-colors">
                    <span className="block text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">{timeLeft.hours}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">{t.hero.hours}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700/80 hover:border-blue-500/50 rounded-xl p-3 text-center backdrop-blur-md shadow-lg shadow-black/40 transition-colors">
                    <span className="block text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">{timeLeft.minutes}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">{t.hero.minutes}</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700/80 hover:border-amber-500/50 rounded-xl p-3 text-center backdrop-blur-md shadow-lg shadow-black/40 transition-colors">
                    <span className="block text-2xl sm:text-3xl font-extrabold font-mono text-amber-300 tracking-tight drop-shadow-sm">{timeLeft.seconds}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">{t.hero.seconds}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar at bottom of hero */}
      <div className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl mt-8 py-5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
            <div className="pt-2 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-blue-400 font-display drop-shadow-sm">{committeesCount || 0}</p>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold mt-1">{t.hero.stat_committees}</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-amber-300 font-display drop-shadow-sm">{countriesCount || 0}+</p>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold mt-1">{t.hero.stat_delegations}</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-display drop-shadow-sm">{diplomaticDays} {language === 'en' ? 'Days' : 'Días'}</p>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold mt-1">{t.hero.stat_days}</p>
            </div>
            <div className="pt-2 md:pt-0">
              <p className="text-3xl sm:text-4xl font-black text-indigo-400 font-display drop-shadow-sm">{traditionYears} {language === 'en' ? 'Years' : 'Años'}</p>
              <p className="text-xs uppercase tracking-wider text-slate-300 font-semibold mt-1">{t.hero.stat_tradition}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
