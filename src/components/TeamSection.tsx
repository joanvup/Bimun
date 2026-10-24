import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, User, ZoomIn, X, Quote } from 'lucide-react';
import { TeamMember } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TeamSectionProps {
  team: TeamMember[];
}

export const TeamSection: React.FC<TeamSectionProps> = ({ team }) => {
  const { language, t } = useLanguage();
  const [selectedPhotoMember, setSelectedPhotoMember] = useState<TeamMember | null>(null);
  const [selectedWelcomeMember, setSelectedWelcomeMember] = useState<TeamMember | null>(null);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhotoMember(null);
        setSelectedWelcomeMember(null);
      }
    };
    if (selectedPhotoMember || selectedWelcomeMember) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPhotoMember, selectedWelcomeMember]);

  if (!team || team.length === 0) return null;

  return (
    <section id="comite" className="py-20 sm:py-24 bg-[#eff4ff] dark:bg-[#081426] border-b border-slate-200/90 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00658e] dark:text-[#83cfff] bg-[#c7e7ff]/60 dark:bg-[#00658e]/20 px-3.5 py-1 rounded-full border border-[#00658e]/20">
            {t.team.badge}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#000d23] dark:text-white tracking-tight">
            {t.team.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t.team.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member) => (
            <div
              key={member.id}
              className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center space-y-4 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => member.photo_url && setSelectedPhotoMember(member)}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-md bg-slate-200 dark:bg-slate-800 relative transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                    member.photo_url ? 'cursor-pointer hover:scale-105 group/photo' : 'cursor-default'
                  }`}
                  title={member.photo_url ? (language === 'en' ? 'Click to enlarge photo' : 'Clic para ampliar fotografía') : undefined}
                >
                  {member.photo_url ? (
                    <>
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* Zoom overlay badge */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ZoomIn className="w-6 h-6 drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </button>
                <div className="absolute -bottom-1 right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-sm pointer-events-none">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1 w-full">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                  {member.role}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white pt-1">{member.name}</h3>
              </div>

              {member.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs">{member.bio}</p>
              )}

              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="pt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{member.email}</span>
                </a>
              )}

              {/* Welcome Speech Button if available */}
              {member.welcome_speech && (
                <button
                  type="button"
                  onClick={() => setSelectedWelcomeMember(member)}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Quote className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{language === 'en' ? 'Welcome Address' : 'Discurso de Bienvenida'}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX MODAL FOR COMMITTEE MEMBER PHOTO */}
      {selectedPhotoMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          onClick={() => setSelectedPhotoMember(null)}
        >
          <div
            className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-7 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhotoMember(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={language === 'en' ? 'Close' : 'Cerrar'}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Enlarged Photo Container */}
            <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 mb-5 relative group">
              {selectedPhotoMember.photo_url ? (
                <img
                  src={selectedPhotoMember.photo_url}
                  alt={selectedPhotoMember.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-950/40 text-blue-400">
                  <User className="w-20 h-20" />
                </div>
              )}
            </div>

            {/* Member Details */}
            <div className="space-y-2 max-w-sm">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800/60">
                {selectedPhotoMember.role}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                {selectedPhotoMember.name}
              </h3>
              {selectedPhotoMember.bio && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                  {selectedPhotoMember.bio}
                </p>
              )}
              {selectedPhotoMember.email && (
                <div className="pt-2 flex justify-center">
                  <a
                    href={`mailto:${selectedPhotoMember.email}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedPhotoMember.email}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WELCOME SPEECH MODAL */}
      {selectedWelcomeMember && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedWelcomeMember(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col space-y-6 animate-in zoom-in-95 duration-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/50 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-md">
                  {selectedWelcomeMember.photo_url ? (
                    <img
                      src={selectedWelcomeMember.photo_url}
                      alt={selectedWelcomeMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <User className="w-7 h-7" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
                    {selectedWelcomeMember.role}
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {selectedWelcomeMember.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedWelcomeMember(null)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title={language === 'en' ? 'Close' : 'Cerrar'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Speech Body */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Official Welcome Address' : 'Discurso Oficial de Bienvenida'}
                </h4>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed italic shadow-inner">
                {selectedWelcomeMember.welcome_speech}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedWelcomeMember(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {language === 'en' ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
