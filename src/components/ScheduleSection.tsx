import React, { useState, useMemo } from 'react';
import { Clock, MapPin, Users2 } from 'lucide-react';
import { ScheduleItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ScheduleSectionProps {
  schedule: ScheduleItem[];
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ schedule }) => {
  const { language, t } = useLanguage();

  // Extract unique days
  const uniqueDays = useMemo(() => {
    const days: string[] = [];
    for (const item of schedule) {
      if (!days.includes(item.day_label)) {
        days.push(item.day_label);
      }
    }
    return days;
  }, [schedule]);

  const [activeDay, setActiveDay] = useState<string>(uniqueDays[0] || '');

  // Keep activeDay updated if schedule changes
  const currentDay = activeDay && uniqueDays.includes(activeDay) ? activeDay : uniqueDays[0] || '';

  const dayEvents = useMemo(() => {
    return schedule.filter((s) => s.day_label === currentDay);
  }, [schedule, currentDay]);

  if (!schedule || schedule.length === 0) return null;

  const getLocalizedDay = (dayLabel: string) => {
    if (language === 'es') return dayLabel;
    return dayLabel.replace(/Día/gi, 'Day');
  };

  return (
    <section id="cronograma" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3.5 py-1 rounded-full border border-amber-400/20">
            {t.schedule.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t.schedule.title}
          </h2>
          <p className="text-base text-slate-300 font-normal leading-relaxed">
            {t.schedule.subtitle}
          </p>

          {/* Days Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {uniqueDays.map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  currentDay === day
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                }`}
              >
                {getLocalizedDay(day)}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Events List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {dayEvents.map((evt, idx) => (
            <div
              key={evt.id || idx}
              className="p-5 sm:p-6 rounded-2xl bg-slate-800/60 border border-slate-700/80 backdrop-blur-sm hover:border-slate-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {/* Time badge */}
                <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-center shrink-0 min-w-[110px]">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{evt.time_start}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    {language === 'en' ? `to ${evt.time_end}` : `hasta ${evt.time_end}`}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h3 className="font-display text-base sm:text-lg font-bold text-white">{evt.activity}</h3>
                  {evt.description && (
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                      {evt.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                    {evt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>{evt.location}</span>
                      </span>
                    )}
                    {evt.audience && (
                      <span className="flex items-center gap-1">
                        <Users2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{evt.audience}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
