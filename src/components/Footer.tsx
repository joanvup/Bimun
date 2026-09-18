import React from 'react';
import { Globe, Lock, ShieldCheck, Sparkles, Sun, Moon } from 'lucide-react';
import { BIMUNSettings } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';

interface FooterProps {
  settings: BIMUNSettings;
  onOpenCMS: () => void;
  isAdminLoggedIn: boolean;
  onGoToCMS: () => void;
  onReplayIntro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenCMS,
  isAdminLoggedIn,
  onGoToCMS,
  onReplayIntro,
}) => {
  const { language, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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
        window.location.hash = href;
      }
    }
  };

  return (
    <div className="dark">
      <footer className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 p-0.5 shadow-md shadow-blue-600/30 flex items-center justify-center overflow-hidden shrink-0">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt={settings.bimun_name || 'BIMUN Logo'}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              </div>
              <span className="font-display text-lg font-bold text-slate-900 dark:text-white tracking-wider">
                {settings.bimun_name || 'BIMUN XXVII'}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-w-md">
              {settings.institution_name || 'Fundación Colegio Bilingüe de Valledupar'}.{' '}
              {t.footer.tagline}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {settings.venue_city || 'Valledupar, Cesar, Colombia'} • {settings.event_date_display || 'October 2026'}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 text-xs">
              {t.footer.quick_links}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#inicio" onClick={(e) => handleScrollTo(e, '#inicio')} className="hover:text-blue-600 dark:hover:text-white transition-colors">{t.nav.home}</a></li>
              <li><a href="#comisiones" onClick={(e) => handleScrollTo(e, '#comisiones')} className="hover:text-blue-600 dark:hover:text-white transition-colors">{t.nav.committees}</a></li>
              <li><a href="#delegaciones" onClick={(e) => handleScrollTo(e, '#delegaciones')} className="hover:text-blue-600 dark:hover:text-white transition-colors">{t.nav.delegations}</a></li>
              <li><a href="#cronograma" onClick={(e) => handleScrollTo(e, '#cronograma')} className="hover:text-blue-600 dark:hover:text-white transition-colors">{t.nav.schedule}</a></li>
              <li><a href="#documentos" onClick={(e) => handleScrollTo(e, '#documentos')} className="hover:text-blue-600 dark:hover:text-white transition-colors">{t.nav.documents}</a></li>
              <li><a href="#inscripciones" onClick={(e) => handleScrollTo(e, '#inscripciones')} className="hover:text-blue-600 dark:hover:text-white transition-colors">{t.nav.register}</a></li>
            </ul>
          </div>

          {/* Institutional & Admin */}
          <div className="space-y-2">
            <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 text-xs">
              {t.footer.admin_title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.footer.admin_desc}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              {isAdminLoggedIn ? (
                <button
                  onClick={onGoToCMS}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-emerald-600/30 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {language === 'en' ? 'Go to CMS Panel' : 'Ir al Panel CMS'}
                </button>
              ) : (
                <button
                  onClick={onOpenCMS}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Admin Access / CMS' : 'Acceso Administrativo / CMS'}
                </button>
              )}

              {onReplayIntro && (
                <button
                  onClick={onReplayIntro}
                  title="Reproducir animación de bienvenida"
                  className="px-3 py-2 rounded-lg bg-white hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-blue-600 dark:text-slate-400 dark:hover:text-cyan-300 border border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-cyan-500/40 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>{language === 'en' ? 'Play Intro' : 'Ver Intro'}</span>
                </button>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={isDark ? (language === 'en' ? 'Switch to Light Mode' : 'Cambiar a Modo Claro') : (language === 'en' ? 'Switch to Dark Mode' : 'Cambiar a Modo Oscuro')}
                className="px-3 py-2 rounded-lg bg-white hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-300 border border-slate-300 dark:border-slate-800 hover:border-amber-400/50 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'en' ? 'Light Theme' : 'Tema Claro'}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{language === 'en' ? 'Dark Theme' : 'Tema Oscuro'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            © {new Date().getFullYear()} {settings.institution_name || 'Fundación Colegio Bilingüe de Valledupar'}.{' '}
            {t.footer.rights}
          </span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            {language === 'en'
              ? 'BIMUN Institutional Platform • Built for Academic Excellence'
              : 'Plataforma Institucional BIMUN • Diseñado para la excelencia académica'}
          </span>
        </div>
      </div>
    </footer>
    </div>
  );
};
