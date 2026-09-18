import React from 'react';
import { Hammer, Instagram, Mail, Key, Sparkles, Clock, Compass } from 'lucide-react';
import { BIMUNSettings } from '../../types.ts';

interface MaintenanceViewProps {
  settings: BIMUNSettings | null;
  onOpenCMS: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ settings, onOpenCMS }) => {
  const customMessage = settings?.maintenance_message?.trim();
  const defaultMessage = `Estamos preparando cada detalle para ofrecerte la mejor experiencia académica en la ${settings?.bimun_edition || 'próxima'} edición de BIMUN. En este momento nos encontramos realizando actualizaciones mayores en nuestros sistemas de registro, comisiones y asignaciones.`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Top Accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-600 to-rose-500" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto w-full text-center space-y-8 md:space-y-12">
        
        {/* Animated Badge & Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl w-40 h-40 -translate-y-4" />
          <div className="relative p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400">
              <Hammer className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-md animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Title & Headline */}
        <div className="space-y-3.5 max-w-2xl">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-150 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/30 uppercase tracking-widest inline-flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Mantenimiento Programado
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Plataforma en <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Mantenimiento</span> Temporal
          </h1>
        </div>

        {/* Info Card with Custom Message */}
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100 dark:shadow-none space-y-6">
          <div className="pb-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              {settings?.logo_url ? (
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
                    <img
                      src={settings.logo_url}
                      alt="BIMUN Logo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/30 text-indigo-500 shrink-0">
                  <Compass className="w-6 h-6" />
                </div>
              )}
              <div>
                <h2 className="font-display font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">
                  {settings?.bimun_name || 'BIMUN'} {settings?.bimun_edition}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {settings?.slogan || 'Modelo de Naciones Unidas'}
                </p>
              </div>
            </div>

            {settings?.event_date_display && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                {settings.event_date_display}
              </span>
            )}
          </div>

          <p className="text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
            {customMessage || defaultMessage}
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {settings?.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-500" />
                <span>Contactar Soporte</span>
              </a>
            )}
            {settings?.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
              >
                <Instagram className="w-4 h-4 text-rose-500" />
                <span>Seguir en Instagram</span>
              </a>
            )}
          </div>
        </div>

        {/* Informative Footer & Status */}
        <div className="space-y-1 pt-4 text-xs text-slate-400 dark:text-slate-500">
          <p>Oficina de Sistemas y Tecnología BIMUN</p>
          <p className="text-[11px]">Fundación Colegio Bilingüe de Valledupar — Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Subtle bottom-right admin access button */}
      <div className="p-4 flex justify-end">
        <button
          onClick={onOpenCMS}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer transition-all shadow-sm"
          title="Acceso de Administrador"
        >
          <Key className="w-3 h-3 text-blue-500 dark:text-blue-400" />
          <span>Acceso Directiva</span>
        </button>
      </div>
    </div>
  );
};
