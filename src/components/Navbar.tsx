import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  ChevronDown,
  Menu,
  X,
  UserCheck,
  Shield,
  Lock,
  Landmark,
  BookOpen,
  Calendar,
  Image,
  Users,
  Newspaper,
  FileText,
  MapPin,
  Check,
  Search,
} from 'lucide-react';
import { BIMUNSettings } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface NavbarProps {
  settings: BIMUNSettings;
  onOpenCMS: () => void;
  isAdminLoggedIn: boolean;
  onGoToCMS: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenCMS,
  isAdminLoggedIn,
  onGoToCMS,
  onOpenSearch,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Desktop dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile accordion state
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<string | null>(null);

  // Dynamic logo dimension calculation with safe constraints (range: 36px to 96px, default: 56px)
  const rawLogoSize = Number(settings.logo_size);
  const logoDimension = !isNaN(rawLogoSize) && rawLogoSize >= 36 && rawLogoSize <= 96 ? rawLogoSize : 56;
  const mobileLogoDimension = Math.round(logoDimension * 0.85); // proportional downscale on mobile screen widths
  const iconSize = Math.max(20, Math.round(logoDimension * 0.55));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSectionActive = (esKey: string, enKey?: string): boolean => {
    if (!settings || !settings.active_sections) return true;
    const act = settings.active_sections as Record<string, any>;
    if (act[esKey] !== undefined) return Boolean(act[esKey]);
    if (enKey && act[enKey] !== undefined) return Boolean(act[enKey]);
    return true;
  };

  // Groupings for submenus
  const institutionalItems = [
    {
      label: t.nav.about,
      desc: t.nav.about_desc,
      href: '#nosotros',
      icon: <Landmark className="w-4 h-4 text-blue-400" />,
      show: isSectionActive('nosotros', 'about'),
    },
    {
      label: t.nav.team,
      desc: t.nav.team_desc,
      href: '#comite',
      icon: <Users className="w-4 h-4 text-indigo-400" />,
      show: isSectionActive('comite', 'team'),
    },
    {
      label: t.nav.gallery,
      desc: t.nav.gallery_desc,
      href: '#galeria',
      icon: <Image className="w-4 h-4 text-amber-400" />,
      show: isSectionActive('galeria', 'gallery'),
    },
    {
      label: t.nav.news,
      desc: t.nav.news_desc,
      href: '#noticias',
      icon: <Newspaper className="w-4 h-4 text-emerald-400" />,
      show: isSectionActive('noticias', 'news'),
    },
  ].filter((item) => item.show);

  const academicItems = [
    {
      label: t.nav.committees,
      desc: t.nav.committees_desc,
      href: '#comisiones',
      icon: <BookOpen className="w-4 h-4 text-blue-400" />,
      show: isSectionActive('comisiones', 'committees'),
    },
    {
      label: t.nav.delegations,
      desc: t.nav.delegations_desc,
      href: '#delegaciones',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      show: isSectionActive('delegaciones', 'delegations'),
    },
    {
      label: t.nav.topics,
      desc: t.nav.topics_desc,
      href: '#temas',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      show: isSectionActive('temas', 'topics'),
    },
    {
      label: t.nav.documents,
      desc: t.nav.documents_desc,
      href: '#documentos',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      show: isSectionActive('documentos', 'documents'),
    },
  ].filter((item) => item.show);

  const eventItems = [
    {
      label: t.nav.schedule,
      desc: t.nav.schedule_desc,
      href: '#cronograma',
      icon: <Calendar className="w-4 h-4 text-amber-400" />,
      show: isSectionActive('cronograma', 'schedule'),
    },
    {
      label: t.nav.contact,
      desc: t.nav.contact_desc,
      href: '#contacto',
      icon: <MapPin className="w-4 h-4 text-rose-400" />,
      show: isSectionActive('contacto', 'contact'),
    },
  ].filter((item) => item.show);

  const handleMouseEnter = (menuKey: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(menuKey);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const toggleMobileGroup = (groupKey: string) => {
    setExpandedMobileGroup(expandedMobileGroup === groupKey ? null : groupKey);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);

    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.substring(1);

      if (targetId === 'inicio') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
          window.history.pushState(null, '', '#inicio');
        } catch {}
        return;
      }

      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        try {
          window.history.pushState(null, '', href);
        } catch {}
      } else {
        const found = document.querySelector(href);
        if (found) {
          found.scrollIntoView({ behavior: 'smooth', block: 'start' });
          try {
            window.history.pushState(null, '', href);
          } catch {}
        } else {
          window.location.hash = href;
        }
      }
    }
  };

  return (
    <header
      ref={navRef}
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/95 backdrop-blur-md shadow-xl py-2.5 border-b border-slate-800/90'
          : 'bg-gradient-to-b from-slate-950/95 via-slate-950/75 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <a
          href="#inicio"
          onClick={(e) => handleNavClick(e, '#inicio')}
          className="flex items-center gap-3.5 group shrink-0 py-0.5"
        >
          <div
            style={{
              width: `var(--nav-logo-w, ${logoDimension}px)`,
              height: `var(--nav-logo-h, ${logoDimension}px)`,
            }}
            className="rounded-full aspect-square bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 p-0.5 shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden shrink-0"
          >
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.bimun_name || 'BIMUN Logo'}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Globe
                  style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                  }}
                  className="text-blue-400 transition-all"
                />
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-display tracking-wider text-xl sm:text-2xl font-bold text-white group-hover:text-blue-200 transition-colors leading-tight">
              {settings.bimun_name || 'BIMUN XXVII'}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-tight truncate max-w-[200px] sm:max-w-sm mt-0.5">
              {settings.institution_name || 'Fundación Colegio Bilingüe de Valledupar'}
            </span>
          </div>
        </a>

        {/* Grouped Desktop Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Direct link: Home */}
          <a
            href="#inicio"
            onClick={(e) => handleNavClick(e, '#inicio')}
            className="text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white px-3.5 py-2 rounded-lg hover:bg-slate-800/70 transition-colors"
          >
            {t.nav.home}
          </a>

          {/* Submenu 1: Institucional */}
          {institutionalItems.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('institutional')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'institutional' ? null : 'institutional')
                }
                className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeDropdown === 'institutional'
                    ? 'text-white bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
                aria-expanded={activeDropdown === 'institutional'}
              >
                <span>{t.nav.institutional}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'institutional' ? 'rotate-180 text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {activeDropdown === 'institutional' && (
                <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-400 border-b border-slate-800/80 mb-1">
                    {t.nav.institutional_desc}
                  </div>
                  {institutionalItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/90 text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-blue-600/20 group-hover:text-blue-300 transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400 group-hover:text-slate-300 font-normal leading-tight mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submenu 2: Académico */}
          {academicItems.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('academic')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'academic' ? null : 'academic')
                }
                className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeDropdown === 'academic'
                    ? 'text-white bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
                aria-expanded={activeDropdown === 'academic'}
              >
                <span>{t.nav.academic}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'academic' ? 'rotate-180 text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {activeDropdown === 'academic' && (
                <div className="absolute top-full left-0 mt-1.5 w-76 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-400 border-b border-slate-800/80 mb-1">
                    {t.nav.academic_desc}
                  </div>
                  {academicItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/90 text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-blue-600/20 group-hover:text-blue-300 transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400 group-hover:text-slate-300 font-normal leading-tight mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submenu 3: Evento */}
          {eventItems.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('event')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'event' ? null : 'event')
                }
                className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeDropdown === 'event'
                    ? 'text-white bg-slate-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
                aria-expanded={activeDropdown === 'event'}
              >
                <span>{t.nav.event}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'event' ? 'rotate-180 text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {activeDropdown === 'event' && (
                <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-400 border-b border-slate-800/80 mb-1">
                    {t.nav.event_desc}
                  </div>
                  {eventItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/90 text-slate-200 hover:text-white transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-blue-600/20 group-hover:text-blue-300 transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400 group-hover:text-slate-300 font-normal leading-tight mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Action Controls: Language Selector + Registration Button + CMS */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Intelligent Quick Search Trigger Button (Desktop & Tablet) */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-slate-400 hover:text-slate-200 transition-all shadow-inner text-xs group cursor-pointer"
              title={language === 'en' ? 'Search (Ctrl+K / ⌘K)' : 'Buscar comisiones, documentos, noticias... (Ctrl+K / ⌘K)'}
            >
              <Search className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="hidden lg:inline text-slate-300 font-medium">
                {language === 'en' ? 'Quick Search...' : 'Buscar...'}
              </span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Mobile Quick Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-colors"
              title={language === 'en' ? 'Search' : 'Buscar'}
              aria-label="Buscar en la plataforma"
            >
              <Search className="w-4 h-4 text-blue-400" />
            </button>
          )}

          {/* Functional Language Switcher (Español / English) */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 shadow-inner">
            <button
              onClick={() => setLanguage('es')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                language === 'es'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cambiar a Español"
            >
              <span className="text-xs">🇪🇸</span>
              <span className="tracking-wider font-mono">ES</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Switch to English"
            >
              <span className="text-xs">🇬🇧</span>
              <span className="tracking-wider font-mono">EN</span>
            </button>
          </div>

          {/* Registration Button */}
          {isSectionActive('inscripciones', 'registrations') && (
            <a
              href="#inscripciones"
              onClick={(e) => handleNavClick(e, '#inscripciones')}
              className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all hover:shadow-blue-600/50 items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t.nav.register}</span>
            </a>
          )}

          {/* CMS Admin Portal */}
          {isAdminLoggedIn ? (
            <button
              onClick={onGoToCMS}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors"
              title="Ir al Panel Administrativo"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{t.nav.cms_panel}</span>
            </button>
          ) : (
            <button
              onClick={onOpenCMS}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Acceso Administrativo Secretaría"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t.nav.cms}</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Structured Groups */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/98 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 mt-2 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
          {/* Mobile Language Selector Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{language === 'es' ? 'Idioma / Language:' : 'Language / Idioma:'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage('es')}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${
                  language === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                🇪🇸 Español
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Mobile Search Input Trigger */}
          {onOpenSearch && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSearch();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-medium text-left transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-blue-400" />
                <span>{language === 'en' ? 'Search committees, docs, news...' : 'Buscar comisiones, documentos, noticias...'}</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Direct Home Link */}
          <a
            href="#inicio"
            onClick={(e) => handleNavClick(e, '#inicio')}
            className="block text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800/80"
          >
            {t.nav.home}
          </a>

          {/* Group 1: Institucional Accordion */}
          {institutionalItems.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                onClick={() => toggleMobileGroup('institutional')}
                className="w-full flex items-center justify-between p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-400" />
                  <span>{t.nav.institutional}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${
                    expandedMobileGroup === 'institutional' ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>
              {expandedMobileGroup === 'institutional' && (
                <div className="p-2 pt-0 space-y-1 border-t border-slate-800/50 bg-slate-950/40">
                  {institutionalItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60"
                    >
                      {item.icon}
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-[10px] text-slate-400">{item.desc}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Group 2: Académico Accordion */}
          {academicItems.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                onClick={() => toggleMobileGroup('academic')}
                className="w-full flex items-center justify-between p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>{t.nav.academic}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${
                    expandedMobileGroup === 'academic' ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>
              {expandedMobileGroup === 'academic' && (
                <div className="p-2 pt-0 space-y-1 border-t border-slate-800/50 bg-slate-950/40">
                  {academicItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60"
                    >
                      {item.icon}
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-[10px] text-slate-400">{item.desc}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Group 3: Evento Accordion */}
          {eventItems.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <button
                onClick={() => toggleMobileGroup('event')}
                className="w-full flex items-center justify-between p-3 text-left text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{t.nav.event}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 text-slate-400 ${
                    expandedMobileGroup === 'event' ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>
              {expandedMobileGroup === 'event' && (
                <div className="p-2 pt-0 space-y-1 border-t border-slate-800/50 bg-slate-950/40">
                  {eventItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-center gap-2.5 p-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60"
                    >
                      {item.icon}
                      <div className="flex flex-col">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-[10px] text-slate-400">{item.desc}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile Registration and CMS Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            {isSectionActive('inscripciones', 'registrations') && (
              <a
                href="#inscripciones"
                onClick={(e) => handleNavClick(e, '#inscripciones')}
                className="w-full text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <UserCheck className="w-4 h-4" />
                {t.nav.register}
              </a>
            )}

            {isAdminLoggedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoToCMS();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {t.nav.cms_panel}
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCMS();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {t.nav.cms}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
