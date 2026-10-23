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
  Sun,
  Moon,
  FileBadge,
} from 'lucide-react';
import { BIMUNSettings } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

interface NavbarProps {
  settings: BIMUNSettings;
  onOpenCMS: () => void;
  isAdminLoggedIn: boolean;
  onGoToCMS: () => void;
  onOpenSearch?: () => void;
  onOpenDelegatePortal?: () => void;
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: (open?: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenCMS,
  isAdminLoggedIn,
  onGoToCMS,
  onOpenSearch,
  onOpenDelegatePortal,
  mobileMenuOpen: controlledMobileMenuOpen,
  onToggleMobileMenu,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);

  const isMenuControlled = controlledMobileMenuOpen !== undefined;
  const mobileMenuOpen = isMenuControlled ? controlledMobileMenuOpen : internalMobileMenuOpen;

  const setMobileMenuOpen = (open: boolean) => {
    if (onToggleMobileMenu) {
      onToggleMobileMenu(open);
    }
    if (!isMenuControlled) {
      setInternalMobileMenuOpen(open);
    }
  };

  // Desktop dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);


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

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
    <div className="dark">
      <header
        ref={navRef}
        id="main-navbar"
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0c1f38]/98 backdrop-blur-md shadow-xl py-2.5 border-b border-amber-400/25'
            : 'bg-gradient-to-b from-[#0c1f38] via-[#0c1f38]/95 to-[#0c1f38]/90 py-3 sm:py-3.5 border-b border-amber-400/20'
        }`}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <a
          href="#inicio"
          onClick={(e) => handleNavClick(e, '#inicio')}
          className="flex items-center gap-2.5 sm:gap-3.5 group min-w-0 flex-1 py-0.5 mr-2"
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
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="font-serif tracking-normal text-xs sm:text-sm lg:text-base font-bold text-white uppercase leading-tight truncate sm:whitespace-normal sm:line-clamp-2">
              {settings.bimun_name || 'BIMUN XXVII'}
            </span>
            <span className="text-[10px] sm:text-xs text-amber-400 font-serif font-semibold tracking-wider uppercase mt-0.5 truncate">
              {settings.slogan || settings.institution_name || 'Fundación Colegio Bilingüe de Valledupar'}
            </span>
          </div>
        </a>

        {/* Grouped Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Direct link: Home */}
          <a
            href="#inicio"
            onClick={(e) => handleNavClick(e, '#inicio')}
            className="text-xs font-semibold uppercase tracking-wider text-slate-200 hover:text-white px-3.5 py-2 rounded-lg hover:bg-white/10 transition-colors"
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
                className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeDropdown === 'institutional'
                    ? 'text-blue-700 dark:text-white bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
                aria-expanded={activeDropdown === 'institutional'}
              >
                <span>{t.nav.institutional}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'institutional' ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {activeDropdown === 'institutional' && (
                <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    {t.nav.institutional_desc}
                  </div>
                  {institutionalItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 group-hover:bg-blue-50 dark:group-hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-normal leading-tight mt-0.5">
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
                className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeDropdown === 'academic'
                    ? 'text-blue-700 dark:text-white bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
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
                <div className="absolute top-full left-0 mt-1.5 w-76 rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    {t.nav.academic_desc}
                  </div>
                  {academicItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 group-hover:bg-blue-50 dark:group-hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-normal leading-tight mt-0.5">
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
                className={`text-xs font-semibold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeDropdown === 'event'
                    ? 'text-blue-700 dark:text-white bg-slate-100 dark:bg-slate-800'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
                aria-expanded={activeDropdown === 'event'}
              >
                <span>{t.nav.event}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'event' ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {activeDropdown === 'event' && (
                <div className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2.5 space-y-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    {t.nav.event_desc}
                  </div>
                  {eventItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 group-hover:bg-blue-50 dark:group-hover:bg-blue-600/20 text-blue-600 dark:text-blue-300 transition-colors shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-normal leading-tight mt-0.5">
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

        {/* Right Action Controls: Desktop + Mobile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop Search Trigger */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-white transition-all shadow-sm text-xs group cursor-pointer"
              title={language === 'en' ? 'Search (Ctrl+K / ⌘K)' : 'Buscar comisiones, documentos, noticias... (Ctrl+K / ⌘K)'}
            >
              <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-slate-200 font-medium">
                {language === 'en' ? 'Quick Search...' : 'Buscar...'}
              </span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Desktop Dual Language Switcher */}
          <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-700 rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => setLanguage('es')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                language === 'es'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Cambiar a Español"
            >
              <span className="text-xs">🇨🇴</span>
              <span className="tracking-wider font-mono">ES</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                language === 'en'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Switch to English"
            >
              <span className="text-xs">🇺🇸</span>
              <span className="tracking-wider font-mono">EN</span>
            </button>
          </div>

          {/* Desktop Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 transition-all shadow-sm cursor-pointer"
            title={
              isDark
                ? language === 'en'
                  ? 'Switch to Light Mode'
                  : 'Cambiar a Modo Claro'
                : language === 'en'
                  ? 'Switch to Dark Mode'
                  : 'Cambiar a Modo Oscuro'
            }
            aria-label="Cambiar tema claro / oscuro"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400 animate-in spin-in-90 duration-300" />
            )}
          </button>

          {/* Desktop Registration Button */}
          {isSectionActive('inscripciones', 'registrations') && (
            <a
              href="#inscripciones"
              onClick={(e) => handleNavClick(e, '#inscripciones')}
              className="hidden md:inline-flex text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all hover:shadow-blue-600/50 items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{t.nav.register}</span>
            </a>
          )}

          {/* Desktop Delegate Portal & Digital Badge Button */}
          {onOpenDelegatePortal && (
            <button
              onClick={onOpenDelegatePortal}
              className="hidden md:inline-flex text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-500/70 transition-all items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
              title={language === 'en' ? 'Delegate Area / Digital Badge' : 'Área del Delegado / Carnet Digital'}
            >
              <FileBadge className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'en' ? 'My Badge' : 'Mi Carnet'}</span>
            </button>
          )}

          {/* Desktop CMS Admin Portal */}
          {isAdminLoggedIn ? (
            <button
              onClick={onGoToCMS}
              className="hidden md:flex text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 items-center gap-1.5 transition-colors cursor-pointer"
              title="Ir al Panel Administrativo"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.nav.cms_panel}</span>
            </button>
          ) : (
            <button
              onClick={onOpenCMS}
              className="hidden md:flex text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 items-center gap-1.5 transition-colors cursor-pointer"
              title="Acceso Administrativo Secretaría"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.nav.cms}</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button (matches image_7bdc2661.png & image_5a2d4d6d.png) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden shrink-0 min-h-[44px] min-w-[44px] p-2.5 rounded-xl border-2 border-amber-400 bg-[#0e213d] hover:bg-[#152e50] text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white stroke-[2.5]" />
            ) : (
              <Menu className="w-5 h-5 text-white stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Full-Width Accordion Dropdown Panel (matches image_5a2d4d6d.png) */}
      {mobileMenuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 bg-[#0c1f38] text-white shadow-2xl border-t border-amber-400/30 border-b-2 border-amber-400/40 z-50 px-5 sm:px-8 py-6 transition-all duration-300 ease-out animate-in slide-in-from-top-2"
          role="dialog"
          aria-label="Menú desplegable móvil"
        >
          <div className="flex items-start justify-between gap-4 max-w-lg mx-auto">
            {/* Left Column: Vertical Links in classic serif typography */}
            <nav className="flex-1 space-y-1">
              {/* Inicio (Golden / Active highlight) */}
              <a
                href="#inicio"
                onClick={(e) => handleNavClick(e, '#inicio')}
                className="block py-2 text-lg sm:text-xl font-serif font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                {t.nav.home}
              </a>

              {/* Nosotros */}
              {isSectionActive('nosotros', 'about') && (
                <a
                  href="#nosotros"
                  onClick={(e) => handleNavClick(e, '#nosotros')}
                  className="block py-2 text-lg sm:text-xl font-serif font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {t.nav.about}
                </a>
              )}

              {/* Comisiones */}
              {isSectionActive('comisiones', 'committees') && (
                <a
                  href="#comisiones"
                  onClick={(e) => handleNavClick(e, '#comisiones')}
                  className="block py-2 text-lg sm:text-xl font-serif font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {t.nav.committees}
                </a>
              )}

              {/* Delegaciones / Matriz */}
              {isSectionActive('delegaciones', 'delegations') && (
                <a
                  href="#delegaciones"
                  onClick={(e) => handleNavClick(e, '#delegaciones')}
                  className="block py-2 text-lg sm:text-xl font-serif font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {t.nav.delegations}
                </a>
              )}

              {/* Cronograma */}
              {isSectionActive('cronograma', 'schedule') && (
                <a
                  href="#cronograma"
                  onClick={(e) => handleNavClick(e, '#cronograma')}
                  className="block py-2 text-lg sm:text-xl font-serif font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {t.nav.schedule}
                </a>
              )}

              {/* Documentos */}
              {isSectionActive('documentos', 'documents') && (
                <a
                  href="#documentos"
                  onClick={(e) => handleNavClick(e, '#documentos')}
                  className="block py-2 text-lg sm:text-xl font-serif font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {t.nav.documents}
                </a>
              )}

              {/* Inscripciones */}
              {isSectionActive('inscripciones', 'registrations') && (
                <a
                  href="#inscripciones"
                  onClick={(e) => handleNavClick(e, '#inscripciones')}
                  className="block py-2 text-lg sm:text-xl font-serif font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {t.nav.register}
                </a>
              )}

              {/* Contacto */}
              {isSectionActive('contacto', 'contact') && (
                <a
                  href="#contacto"
                  onClick={(e) => handleNavClick(e, '#contacto')}
                  className="block py-2 text-lg sm:text-xl font-serif font-medium text-white hover:text-amber-300 transition-colors"
                >
                  {t.nav.contact}
                </a>
              )}
            </nav>

            {/* Right Column: 3 Circular Portal Shortcut Badges */}
            <div className="w-24 sm:w-28 flex flex-col items-center justify-start space-y-4 pt-1 shrink-0">
              {/* 1. Mi Carnet (Badge Credential) */}
              {onOpenDelegatePortal && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDelegatePortal();
                  }}
                  className="group flex flex-col items-center cursor-pointer"
                  title={language === 'en' ? 'My Official Badge' : 'Mi Carnet Oficial'}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 border-2 border-amber-300 text-white flex items-center justify-center shadow-lg shadow-amber-950/50 group-hover:scale-105 active:scale-95 transition-transform">
                    <FileBadge className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-amber-300 group-hover:text-amber-200 mt-1.5 text-center leading-tight">
                    {language === 'en' ? 'My Badge' : 'Mi Carnet'}
                  </span>
                </button>
              )}

              {/* 2. Guías y Temarios */}
              <a
                href="#documentos"
                onClick={(e) => handleNavClick(e, '#documentos')}
                className="group flex flex-col items-center cursor-pointer"
                title={language === 'en' ? 'Academic Guides' : 'Guías Académicas'}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border-2 border-sky-300 text-white flex items-center justify-center shadow-lg shadow-blue-950/50 group-hover:scale-105 active:scale-95 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-bold text-sky-200 group-hover:text-white mt-1.5 text-center leading-tight">
                  {language === 'en' ? 'Guides' : 'Guías'}
                </span>
              </a>

              {/* 3. Buscador */}
              {onOpenSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSearch();
                  }}
                  className="group flex flex-col items-center cursor-pointer"
                  title={language === 'en' ? 'Quick Search' : 'Buscador'}
                >
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-slate-200 text-slate-800 flex items-center justify-center shadow-lg shadow-slate-950/40 group-hover:scale-105 active:scale-95 transition-transform">
                    <Search className="w-6 h-6 text-blue-950" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-white mt-1.5 text-center leading-tight">
                    {language === 'en' ? 'Search' : 'Buscador'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Bottom utility footer bar inside dropdown */}
          <div className="mt-6 pt-4 border-t border-amber-400/20 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-300 max-w-lg mx-auto">
            {/* Language toggle inside dropdown menu */}
            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <span className="text-sm">{language === 'es' ? '🇺🇸' : '🇨🇴'}</span>
              <span className="font-bold font-mono text-amber-300">{language === 'es' ? 'EN' : 'ES'}</span>
              <span className="text-[11px] text-slate-300">({language === 'es' ? 'English' : 'Español'})</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-300" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>

            {/* Admin CMS Access */}
            {isAdminLoggedIn ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGoToCMS();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.nav.cms_panel}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCMS();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{t.nav.cms}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>

    {/* Backdrop Overlay when mobile menu is open */}
    {mobileMenuOpen && (
      <div
        onClick={() => setMobileMenuOpen(false)}
        className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-30 transition-opacity animate-in fade-in cursor-pointer"
        aria-hidden="true"
      />
    )}

    {/* Mobile Floating Language Switcher: Visible ONLY at the top (scrollY <= 25), mobile only */}
    {!isScrolled && !mobileMenuOpen && (
      <aside
        aria-label="Selector de idioma flotante móvil"
        className="lg:hidden fixed top-20 right-3.5 z-30 transition-all duration-300 animate-in fade-in slide-in-from-top-2"
      >
        <button
          onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c1f38]/95 hover:bg-[#132d54] text-white text-xs font-bold tracking-wider shadow-xl shadow-black/40 border-2 border-amber-400/80 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        >
          <span className="text-sm">{language === 'es' ? '🇺🇸' : '🇨🇴'}</span>
          <span className="font-mono text-amber-300 font-bold">{language === 'es' ? 'EN' : 'ES'}</span>
          <span className="text-[10px] text-slate-300 font-medium">⇄ {language === 'es' ? 'ES' : 'EN'}</span>
        </button>
      </aside>
    )}
    </div>
  );
};

