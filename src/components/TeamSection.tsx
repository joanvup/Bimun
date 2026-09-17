import React from 'react';
import { Mail, ShieldCheck, User } from 'lucide-react';
import { TeamMember } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TeamSectionProps {
  team: TeamMember[];
}

export const TeamSection: React.FC<TeamSectionProps> = ({ team }) => {
  const { language, t } = useLanguage();

  if (!team || team.length === 0) return null;

  return (
    <section id="comite" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            {t.team.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t.team.title}
          </h2>
          <p className="text-base text-slate-600 font-normal leading-relaxed">
            {t.team.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member) => (
            <div
              key={member.id}
              className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center space-y-4 hover:shadow-md transition-all group"
            >
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-700">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                  {member.role}
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 pt-1">{member.name}</h3>
                <span className="text-xs text-slate-500 font-medium">{member.category}</span>
              </div>

              {member.bio && (
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs">{member.bio}</p>
              )}

              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="pt-2 text-xs font-semibold text-slate-500 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{member.email}</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
