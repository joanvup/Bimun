import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight, BookOpen, FileText, Clock, Sparkles, ChevronDown, Award } from 'lucide-react';
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
      diplomaticDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    }
  }

  const traditionYears = settings.tradition_years || '27';
  const bimunTitle = settings.bimun_name || 'BIMUN XXVII';
  const institution = settings.institution_name || 'Colegio Bilingüe de Valledupar';

  return (
    <div id="inicio" className="relative w-full">
      {/* =========================================================================
          1. HERO PRINCIPAL: 100% LIMPIO, CINEMÁTICO E INMERSIVO (Estilo HMUN / THIMUN)
          Sin textos pesados, sin cajas ni banners superpuestos.
          Protagonismo absoluto para la fotografía / video oficial.
          ========================================================================= */}
      <section 
        className="relative w-full h-[76vh] sm:h-[88vh] min-h-[500px] sm:min-h-[540px] flex flex-col justify-end overflow-hidden bg-slate-950"
        aria-label="Hero Cinemático BIMUN"
      >
        {/* Visual Media Layer: Fotografía o Video de alta definición */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {settings.hero_video_url ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover saturate-105 contrast-105"
              style={{ opacity: ((settings.hero_bg_opacity !== undefined && settings.hero_bg_opacity !== null) ? Number(settings.hero_bg_opacity) / 100 : 0.95) }}
              src={settings.hero_video_url}
            />
          ) : (
            <img
              src={settings.hero_bg_image || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=2000&q=85'}
              alt="BIMUN Modelo de Naciones Unidas"
              className="w-full h-full object-cover object-center saturate-105 contrast-105 transition-opacity duration-700"
              style={{ opacity: ((settings.hero_bg_opacity !== undefined && settings.hero_bg_opacity !== null) ? Number(settings.hero_bg_opacity) / 100 : 0.95) }}
            />
          )}

          {/* Gradiente óptico ultra-suave: protege la barra de navegación superior y permite una transición fluida al pie */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
        </div>

        {/* Único elemento en el Hero: Indicador discreto y refinado de scroll hacia la sección de bienvenida */}
        <div className="relative z-10 w-full pb-8 sm:pb-10 flex flex-col items-center justify-center">
          <a
            href="#bienvenida"
            onClick={(e) => handleScrollTo(e, '#bienvenida')}
            className="group inline-flex flex-col items-center gap-2 text-white/90 hover:text-white transition-all duration-300"
            aria-label={language === 'en' ? 'Explore BIMUN Conference' : 'Explorar Conferencia BIMUN'}
          >
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-slate-200 group-hover:text-amber-300 transition-colors drop-shadow-md">
              {language === 'en' ? 'Explore Conference' : 'Explorar Conferencia'}
            </span>
            <div className="w-10 h-10 rounded-full bg-slate-950/50 hover:bg-slate-900/80 border border-white/25 hover:border-amber-400/80 backdrop-blur-md flex items-center justify-center transition-all shadow-lg group-hover:translate-y-1">
              <ChevronDown className="w-4 h-4 text-white group-hover:text-amber-300 animate-bounce" />
            </div>
          </a>
        </div>
      </section>

      {/* =========================================================================
          2. SECCIÓN INDEPENDIENTE CON FONDO CLARO: "BIMUN BRIEFING & BIENVENIDA"
          Reubica el título, lema, botones, coordenadas, cronómetro y métricas
          en un espacio limpio, sobrio y altamente legible.
          ========================================================================= */}
      <section 
        id="bienvenida" 
        className="relative w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
          
          {/* Encabezado Principal Institucional */}
          <div className="max-w-3xl">
            {/* Pre-header Insignia */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px] sm:text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-none">{institution}</span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-blue-900 dark:text-blue-200 shrink-0">{bimunTitle}</span>
            </div>

            {/* Título de la Edición */}
            <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] mt-3 sm:mt-4">
              {bimunTitle}
            </h1>

            {/* Lema Oficial */}
            <p className="font-serif italic text-base sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 font-light leading-snug mt-2.5 sm:mt-3">
              "{slogan}"
            </p>

            {/* Botones de Acción Principales: Full-width en móviles (<640px) para ergonomía táctil */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 sm:pt-6">
              <a
                href={primaryLink}
                onClick={(e) => handleScrollTo(e, primaryLink)}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2.5 group cursor-pointer active:scale-[0.98]"
              >
                <span>{t.hero.cta_register}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href={secondaryLink}
                onClick={(e) => handleScrollTo(e, secondaryLink)}
                className="min-h-[44px] px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-semibold text-xs sm:text-sm border border-slate-300 dark:border-slate-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t.hero.cta_committees}</span>
              </a>

              <a
                href={tertiaryLink}
                onClick={(e) => handleScrollTo(e, tertiaryLink)}
                className="min-h-[44px] px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span>{t.hero.cta_documents}</span>
              </a>
            </div>
          </div>

          {/* Bloque de Coordenadas Oficiales & Cuenta Regresiva */}
          <div className="mt-12 sm:mt-16 pt-10 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Columna Izquierda: Coordenadas Oficiales (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-700 dark:text-blue-400">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'en' ? 'Official Conference Coordinates' : 'Coordenadas Oficiales de la Conferencia'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fechas */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/70 shadow-sm">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {language === 'en' ? 'Official Dates' : 'Fechas Oficiales'}
                    </span>
                    <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5 leading-snug">
                      {dateDisplay}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      {diplomaticDays} {language === 'en' ? 'days of academic debate' : 'días de debate académico'}
                    </span>
                  </div>
                </div>

                {/* Sede */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/70 shadow-sm">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      {language === 'en' ? 'Official Venue' : 'Sede Principal'}
                    </span>
                    <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5 leading-snug line-clamp-1">
                      {settings.venue || 'Campus Principal - Colegio Bilingüe'}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      {settings.venue_city || 'Valledupar, Cesar'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Reloj Oficial / Cuenta Regresiva (5 cols) */}
            <div className="lg:col-span-5 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-8">
              {hasStarted ? (
                <div className="flex items-center gap-3.5 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-100">
                  <span className="relative flex h-3.5 w-3.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                      {language === 'en' ? 'Conference In Session' : '¡Sesión Inaugural en Desarrollo!'}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {language === 'en' 
                        ? 'The conference has officially begun. Welcome delegates!'
                        : 'La conferencia ha iniciado formalmente. ¡Bienvenidos delegados!'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {t.hero.countdown_title}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-medium">BIMUN OFFICIAL CLOCK</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 text-center">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 sm:p-3 shadow-sm">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {timeLeft.days}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                        {t.hero.days}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 sm:p-3 shadow-sm">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {timeLeft.hours}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                        {t.hero.hours}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 sm:p-3 shadow-sm">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {timeLeft.minutes}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                        {t.hero.minutes}
                      </span>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 rounded-xl p-2 sm:p-3 shadow-sm">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                        {timeLeft.seconds}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400/90 font-bold block mt-0.5">
                        {t.hero.seconds}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Cifras de Impacto Institucional (Ticker / Grid de Estadísticas) */}
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-2xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 font-display">
                {committeesCount || 0}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mt-1">
                {t.hero.stat_committees}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-2xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 font-display">
                {countriesCount || 0}+
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mt-1">
                {t.hero.stat_delegations}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                {diplomaticDays} {language === 'en' ? 'Days' : 'Días'}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mt-1">
                {t.hero.stat_days}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <p className="text-2xl sm:text-4xl font-black text-indigo-600 dark:text-indigo-400 font-display">
                {traditionYears} {language === 'en' ? 'Years' : 'Años'}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mt-1">
                {t.hero.stat_tradition}
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
