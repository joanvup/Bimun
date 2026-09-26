import React, { useState, useEffect } from 'react';
import { Mail, ShieldCheck, User, ZoomIn, X } from 'lucide-react';
import { TeamMember } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TeamSectionProps {
  team: TeamMember[];
}

export const TeamSection: React.FC<TeamSectionProps> = ({ team }) => {
  const { language, t } = useLanguage();
  const [selectedPhotoMember, setSelectedPhotoMember] = useState<TeamMember | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhotoMember(null);
      }
    };
    if (selectedPhotoMember) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPhotoMember]);

  if (!team || team.length === 0) return null;

  return (
    <section id="comite" className="py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/60">
            {t.team.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
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

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                  {member.role}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white pt-1">{member.name}</h3>
                {/* Note: Redundant 'Secretaría' category removed as cargo is already shown */}
              </div>

              {member.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs">{member.bio}</p>
              )}

              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{member.email}</span>
                </a>
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
    </section>
  );
};
