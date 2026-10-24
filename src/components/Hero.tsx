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
    <div id="inicio" className="relative w-full pt-16">
      {/* Top Ambient Glow Line (Matches Reference) */}
      <div className="w-full h-1 bg-gradient-to-r from-[#000d23] via-[#4cc1ff] to-[#00658e]" />

      {/* =========================================================================
          1. HERO PRINCIPAL: CINEMÁTICO E INMERSIVO
          ========================================================================= */}
      <section 
        className="relative w-full h-[65vh] sm:h-[75vh] min-h-[460px] flex flex-col justify-end overflow-hidden bg-[#000d23]"
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

          {/* Gradiente óptico ultra-suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000d23] via-transparent to-[#000d23]/40" />
        </div>

        {/* Indicador refinado de scroll hacia la sección de bienvenida */}
        <div className="relative z-10 w-full pb-8 flex flex-col items-center justify-center">
          <a
            href="#bienvenida"
            onClick={(e) => handleScrollTo(e, '#bienvenida')}
            className="group inline-flex flex-col items-center gap-2 text-white/90 hover:text-white transition-all duration-300"
            aria-label={language === 'en' ? 'Explore BIMUN Conference' : 'Explorar Conferencia BIMUN'}
          >
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-slate-200 group-hover:text-[#4cc1ff] transition-colors drop-shadow-md">
              {language === 'en' ? 'Explore Conference' : 'Explorar Conferencia'}
            </span>
            <div className="w-9 h-9 rounded-full bg-[#000d23]/60 hover:bg-[#000d23]/90 border border-white/25 hover:border-[#4cc1ff] backdrop-blur-md flex items-center justify-center transition-all shadow-lg group-hover:translate-y-1">
              <ChevronDown className="w-4 h-4 text-white group-hover:text-[#4cc1ff] animate-bounce" />
            </div>
          </a>
        </div>
      </section>

      {/* =========================================================================
          2. DIPLOMATIC SUMMIT HERO CONTENT & EDITORIAL BRIEFING
          ========================================================================= */}
      <section 
        id="bienvenida" 
        className="relative w-full bg-[#eff4ff] dark:bg-[#081426] border-b border-slate-200/90 dark:border-slate-800 transition-colors py-12 sm:py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Upper Superbadge & Academic Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-[#000d23] text-white px-3.5 py-1.5 rounded-full shadow-xs text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#4cc1ff] shrink-0" />
              <span className="truncate max-w-[240px] sm:max-w-none">{institution}</span>
              <span className="text-slate-500">•</span>
              <span className="font-bold text-[#83cfff]">{bimunTitle}</span>
            </div>

            <div className="flex items-center gap-2 text-[#00658e] dark:text-[#83cfff] text-xs font-semibold bg-[#c7e7ff]/60 dark:bg-[#00658e]/20 px-3.5 py-1.5 rounded-full border border-[#00658e]/20">
              <Award className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Registered Model United Nations • 2001 - 2026' : 'Modelo Registrado de Naciones Unidas • 2001 - 2026'}</span>
            </div>
          </div>

          {/* Hero Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Textual Authority */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00658e] dark:text-[#009edb] block">
                  {language === 'en' ? 'Official Slogan:' : 'Lema Oficial:'} {slogan}
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#000d23] dark:text-white leading-[1.12] tracking-tight font-bold">
                  {bimunTitle}: Forjando el liderazgo global y la <span className="text-[#00658e] dark:text-[#009edb] italic font-serif">diplomacia</span> del futuro.
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                {settings.about_summary || 'El modelo de Naciones Unidas escolar más prestigioso del Caribe colombiano. Más de 650 delegados, 12 comités especializados en español e inglés, debatiendo los desafíos más apremiantes de la geopolítica contemporánea en el marco de nuestro vigésimo séptimo aniversario.'}
              </p>

              {/* CTAs Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={primaryLink}
                  onClick={(e) => handleScrollTo(e, primaryLink)}
                  className="min-h-[46px] px-6 py-3 rounded-lg bg-[#000d23] hover:bg-[#0d2342] text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>{t.hero.cta_register}</span>
                  <ArrowRight className="w-4 h-4 text-[#83cfff] group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href={secondaryLink}
                  onClick={(e) => handleScrollTo(e, secondaryLink)}
                  className="min-h-[46px] px-5 py-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-[#000d23] dark:text-white font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#00658e] dark:text-[#009edb]" />
                  <span>{t.hero.cta_committees}</span>
                </a>

                <a
                  href={tertiaryLink}
                  onClick={(e) => handleScrollTo(e, tertiaryLink)}
                  className="inline-flex items-center gap-1.5 text-[#00658e] dark:text-[#009edb] hover:text-[#004c6c] dark:hover:text-white font-bold text-xs sm:text-sm underline underline-offset-4 py-2 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.hero.cta_documents}</span>
                </a>
              </div>

              {/* Fast Live Indicator */}
              <div className="flex items-center gap-2.5 pt-1 text-slate-600 dark:text-slate-300 text-xs font-medium">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cc1ff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00658e]"></span>
                </span>
                <span>{language === 'en' ? 'Country allocations active. Early bird registrations in progress.' : 'Convocatoria de asignación por países activa. Asignaciones tempranas en curso.'}</span>
              </div>
            </div>

            {/* Right: Photographic Montage & Emblems */}
            <div className="lg:col-span-5 space-y-4 relative">
              <div className="relative bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-200/90 dark:border-slate-700 overflow-hidden">
                <img
                  src={settings.hero_bg_image || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80'}
                  alt="Asamblea Plenaria de BIMUN"
                  className="w-full h-60 object-cover rounded-lg"
                />
                <div className="absolute bottom-4 left-4 right-4 bg-[#000d23]/90 backdrop-blur-md p-3 rounded-lg text-white flex items-center justify-between border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#83cfff]">{settings.venue || 'Auditorio Principal FCBV'}</span>
                    <span className="text-sm font-bold">{bimunTitle} • Sesión Plenaria</span>
                  </div>
                  <Sparkles className="w-5 h-5 text-[#83cfff]" />
                </div>
              </div>

              {/* Overlapping Secondary Card */}
              <div className="grid grid-cols-12 gap-3 items-stretch">
                <div className="col-span-7 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-md border border-slate-200/80 dark:border-slate-700 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=600&q=80"
                    alt="Delegados en debate"
                    className="w-full h-28 object-cover rounded-lg"
                  />
                </div>
                <div className="col-span-5 bg-gradient-to-br from-[#0d2342] to-[#000d23] text-white p-4 rounded-xl shadow-md flex flex-col justify-center border border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#83cfff]">Tradición</span>
                  <span className="font-serif text-3xl font-bold leading-none mt-1">{traditionYears}°</span>
                  <span className="text-xs text-slate-300 mt-1">Aniversario Ininterrumpido</span>
                </div>
              </div>
            </div>

          </div>

          {/* Stats Bar (Monolithic Data Row matching reference) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl sm:text-4xl text-[#000d23] dark:text-white font-bold leading-none">650+</span>
                <span className="w-8 h-8 rounded-lg bg-[#00658e]/10 text-[#00658e] dark:text-[#009edb] flex items-center justify-center font-bold">👥</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.hero.stat_delegations}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{language === 'en' ? 'Schools from the Caribbean & nationwide' : 'Colegios del Caribe, Bogotá e internacionales'}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl sm:text-4xl text-[#00658e] dark:text-[#009edb] font-bold leading-none">{committeesCount || 12}</span>
                <span className="w-8 h-8 rounded-lg bg-[#00658e]/10 text-[#00658e] dark:text-[#009edb] flex items-center justify-center font-bold">🏛️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.hero.stat_committees}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{language === 'en' ? 'Bilingual structure in English and Spanish' : 'Estructura bilingüe en inglés y español'}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl sm:text-4xl text-[#000d23] dark:text-white font-bold leading-none">{traditionYears}</span>
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">🎖️</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.hero.stat_tradition}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{language === 'en' ? 'Academic & diplomatic benchmark of Cesar' : 'Referente pedagógico y diplomático del Cesar'}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl sm:text-4xl text-[#00658e] dark:text-[#009edb] font-bold leading-none">{diplomaticDays}</span>
                <span className="w-8 h-8 rounded-lg bg-[#00658e]/10 text-[#00658e] dark:text-[#009edb] flex items-center justify-center font-bold">📅</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.hero.stat_days}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{language === 'en' ? 'Plenary sessions, crisis room and official gala' : 'Sesiones plenarias, crisis room y gala oficial'}</p>
              </div>
            </div>
          </div>

          {/* Bloque de Coordenadas Oficiales & Cuenta Regresiva */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Columna Izquierda: Coordenadas Oficiales */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#00658e] dark:text-[#009edb]">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'en' ? 'Official Conference Coordinates' : 'Coordenadas Oficiales de la Conferencia'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fechas */}
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/70 shadow-xs">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
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
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/70 shadow-xs">
                  <div className="p-2.5 rounded-lg bg-[#00658e]/10 text-[#00658e] dark:text-[#009edb] shrink-0">
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

            {/* Columna Derecha: Reloj Oficial / Cuenta Regresiva */}
            <div className="lg:col-span-5 lg:border-l lg:border-slate-200 dark:lg:border-slate-800 lg:pl-8">
              {hasStarted ? (
                <div className="flex items-center gap-3.5 p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-100">
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
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {t.hero.countdown_title}
                    </span>
                    <span className="text-[10px] text-[#00658e] dark:text-[#009edb] font-mono font-medium">BIMUN OFFICIAL CLOCK</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 shadow-xs">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {timeLeft.days}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                        {t.hero.days}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 shadow-xs">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {timeLeft.hours}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                        {t.hero.hours}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 shadow-xs">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                        {timeLeft.minutes}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                        {t.hero.minutes}
                      </span>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/60 rounded-lg p-2.5 shadow-xs">
                      <span className="block text-xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                        {timeLeft.seconds}
                      </span>
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold block mt-0.5">
                        {t.hero.seconds}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>
    </div>
  );
};
