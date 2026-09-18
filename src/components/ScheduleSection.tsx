import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, MapPin, Users2, Calendar, List, 
  ChevronLeft, ChevronRight, Sparkles, Gavel, 
  PartyPopper, Filter, CalendarDays, Info 
} from 'lucide-react';
import { ScheduleItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface ScheduleSectionProps {
  schedule: ScheduleItem[];
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ schedule }) => {
  const { language, t } = useLanguage();

  // Determine the default month and year from the first scheduled event
  const { initialYear, initialMonth } = useMemo(() => {
    if (schedule && schedule.length > 0) {
      const sortedDates = [...schedule]
        .map(s => s.date)
        .filter(Boolean)
        .sort();
      if (sortedDates.length > 0) {
        const parts = sortedDates[0].split('-');
        if (parts.length === 3) {
          return {
            initialYear: parseInt(parts[0], 10),
            initialMonth: parseInt(parts[1], 10) - 1 // 0-indexed for Date
          };
        }
      }
    }
    return {
      initialYear: new Date().getFullYear(),
      initialMonth: new Date().getMonth()
    };
  }, [schedule]);

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ceremonia' | 'sesión' | 'social'>('all');

  // Helper to categorize events
  const getEventType = (evt: ScheduleItem): 'ceremonia' | 'sesión' | 'social' => {
    const text = `${evt.activity} ${evt.description || ''}`.toLowerCase();
    if (
      text.includes('apertura') || 
      text.includes('clausura') || 
      text.includes('inauguraci') || 
      text.includes('ceremonia') || 
      text.includes('protocol') || 
      text.includes('opening') || 
      text.includes('closing') ||
      text.includes('solemne')
    ) {
      return 'ceremonia';
    }
    if (
      text.includes('social') || 
      text.includes('fiesta') || 
      text.includes('coctel') || 
      text.includes('cóctel') || 
      text.includes('integraci') || 
      text.includes('party') || 
      text.includes('almuerzo') || 
      text.includes('cena') ||
      text.includes('charlas')
    ) {
      return 'social';
    }
    return 'sesión'; // Default type is business session / debate
  };

  // Synchronize dynamic initial dates on load
  useEffect(() => {
    setCurrentYear(initialYear);
    setCurrentMonth(initialMonth);

    // Default select the first event's date
    if (schedule && schedule.length > 0) {
      const sortedDates = [...schedule]
        .map(s => s.date)
        .filter(Boolean)
        .sort();
      if (sortedDates.length > 0) {
        setSelectedDate(sortedDates[0]);
      }
    }
  }, [initialYear, initialMonth, schedule]);

  // Event category metadata
  const categories = useMemo(() => {
    return [
      { id: 'all', label: language === 'es' ? 'Todos' : 'All', color: 'bg-slate-700/80 text-white border-slate-600' },
      { id: 'ceremonia', label: language === 'es' ? 'Ceremonias' : 'Ceremonies', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25', icon: Sparkles },
      { id: 'sesión', label: language === 'es' ? 'Sesiones de Debate' : 'Debate Sessions', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25', icon: Gavel },
      { id: 'social', label: language === 'es' ? 'Eventos Sociales' : 'Social Events', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25', icon: PartyPopper }
    ];
  }, [language]);

  // Compute category counters for active month or all events
  const counters = useMemo(() => {
    const counts = { all: schedule.length, ceremonia: 0, sesión: 0, social: 0 };
    schedule.forEach(evt => {
      const type = getEventType(evt);
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [schedule]);

  // Filter events based on active category filter
  const filteredSchedule = useMemo(() => {
    if (activeFilter === 'all') return schedule;
    return schedule.filter(evt => getEventType(evt) === activeFilter);
  }, [schedule, activeFilter]);

  // Calendar Math and Grid calculations
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return [...blanks, ...days];
  }, [currentYear, currentMonth]);

  // Maps events of the current month
  const eventsByDayInCurrentMonth = useMemo(() => {
    const map: Record<number, ScheduleItem[]> = {};
    filteredSchedule.forEach(evt => {
      if (!evt.date) return;
      const parts = evt.date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (y === currentYear && m === currentMonth) {
          if (!map[d]) map[d] = [];
          map[d].push(evt);
        }
      }
    });
    return map;
  }, [filteredSchedule, currentYear, currentMonth]);

  // Month Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Selected date events list
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredSchedule
      .filter(evt => evt.date === selectedDate)
      .sort((a, b) => a.time_start.localeCompare(b.time_start));
  }, [filteredSchedule, selectedDate]);

  // Select a day cell
  const handleSelectDay = (dayNum: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  // Check if a day cell is currently selected
  const isCellSelected = (dayNum: number) => {
    if (!selectedDate) return false;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  const currentMonthName = language === 'es' ? MONTHS_ES[currentMonth] : MONTHS_EN[currentMonth];
  const weekdays = language === 'es' ? WEEKDAYS_ES : WEEKDAYS_EN;

  if (!schedule || schedule.length === 0) return null;

  return (
    <section id="cronograma" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-950/30 via-slate-900 to-slate-950 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
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
        </div>

        {/* View Mode & Filtering Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? cat.id === 'ceremonia' ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20'
                        : cat.id === 'sesión' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                        : cat.id === 'social' ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-slate-200 border-white text-slate-950'
                      : `bg-slate-950/40 border-slate-800 text-slate-300 ${cat.id === 'ceremonia' ? 'hover:text-amber-400 hover:border-amber-500/40' : cat.id === 'sesión' ? 'hover:text-blue-400 hover:border-blue-500/40' : cat.id === 'social' ? 'hover:text-purple-400 hover:border-purple-500/40' : 'hover:text-white hover:border-slate-700'}`
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />}
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                    {counters[cat.id]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle View Mode Button */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl self-start md:self-auto shadow-inner">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Calendario' : 'Calendar'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{language === 'es' ? 'Agenda/Lista' : 'Agenda/List'}</span>
            </button>
          </div>

        </div>

        {/* Dynamic Presentation Window */}
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Interactive Monthly Calendar */}
              <div className="lg:col-span-7 bg-slate-950/50 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-6">
                
                {/* Month Name & Navigation */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <span>{currentMonthName} {currentYear}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {language === 'es' ? 'Selecciona un día para visualizar los eventos' : 'Select a day to view scheduled events'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-all"
                      title={language === 'es' ? 'Mes Anterior' : 'Previous Month'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-all"
                      title={language === 'es' ? 'Siguiente Mes' : 'Next Month'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Labels Header */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  {weekdays.map((dayLabel, index) => (
                    <div key={dayLabel} className={index === 0 || index === 6 ? 'text-slate-500' : 'text-slate-400'}>
                      {dayLabel}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarCells.map((dayNum, idx) => {
                    if (dayNum === null) {
                      return <div key={`blank-${idx}`} className="aspect-square bg-slate-950/25 rounded-xl border border-transparent" />;
                    }

                    const dayEvents = eventsByDayInCurrentMonth[dayNum] || [];
                    const hasEvents = dayEvents.length > 0;
                    const isSelected = isCellSelected(dayNum);

                    // Map categories for dot indicators
                    const categoriesInDay = Array.from(new Set(dayEvents.map(getEventType)));

                    return (
                      <button
                        key={`day-${dayNum}`}
                        onClick={() => handleSelectDay(dayNum)}
                        className={`aspect-square rounded-2xl p-1.5 flex flex-col justify-between items-center relative transition-all border group cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-500/20'
                            : hasEvents
                              ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500 hover:bg-slate-850 text-white'
                              : 'bg-slate-950/30 border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-800/60'
                        }`}
                      >
                        <span className={`text-xs font-bold sm:text-sm mt-0.5 ${isSelected ? 'scale-110' : ''}`}>
                          {dayNum}
                        </span>

                        {/* Dot category indicators at cell bottom */}
                        <div className="flex items-center gap-1 justify-center h-2 mb-0.5">
                          {categoriesInDay.map(cat => (
                            <span 
                              key={cat}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white shadow-[0_0_4px_white]' :
                                cat === 'ceremonia' ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]' :
                                cat === 'sesión' ? 'bg-blue-400 shadow-[0_0_4px_#60a5fa]' :
                                'bg-purple-400 shadow-[0_0_4px_#c084fc]'
                              }`}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Color Legend */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap gap-4 items-center justify-center text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                    <span>{language === 'es' ? 'Ceremonia' : 'Ceremony'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]" />
                    <span>{language === 'es' ? 'Sesión de Debate' : 'Debate Session'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.5)]" />
                    <span>{language === 'es' ? 'Evento Social' : 'Social Event'}</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Day Timeline Detail Feed */}
              <div className="lg:col-span-5 bg-slate-950/50 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between min-h-[460px]">
                
                <div className="space-y-4">
                  {/* Selected date header label */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                        {selectedDate || (language === 'es' ? 'Sin fecha seleccionada' : 'No date selected')}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {selectedDateEvents.length} {language === 'es' ? 'Actividades' : 'Activities'}
                    </span>
                  </div>

                  {/* Schedule items feed for the day */}
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    <AnimatePresence mode="popLayout">
                      {selectedDateEvents.length > 0 ? (
                        selectedDateEvents.map((evt, idx) => {
                          const type = getEventType(evt);
                          const isCeremony = type === 'ceremonia';
                          const isSocial = type === 'social';
                          const CategoryIcon = isCeremony ? Sparkles : isSocial ? PartyPopper : Gavel;

                          return (
                            <motion.div
                              key={evt.id || idx}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.25 }}
                              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 bg-slate-900/60 ${
                                isCeremony ? 'border-amber-500/20 hover:border-amber-500/40' :
                                isSocial ? 'border-purple-500/20 hover:border-purple-500/40' :
                                'border-blue-500/20 hover:border-blue-500/40'
                              }`}
                            >
                              {/* Left Icon Badge */}
                              <div className={`p-2 rounded-xl border shrink-0 ${
                                isCeremony ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                isSocial ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                                <CategoryIcon className="w-4 h-4" />
                              </div>

                              {/* Event Body */}
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-1">
                                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                                    {isCeremony ? (language === 'es' ? 'Ceremonia' : 'Ceremony') :
                                     isSocial ? (language === 'es' ? 'Social' : 'Social Event') :
                                     (language === 'es' ? 'Sesión de Debate' : 'Debate Session')}
                                  </h4>
                                  <div className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    <Clock className="w-3 h-3" />
                                    <span>{evt.time_start} - {evt.time_end}</span>
                                  </div>
                                </div>

                                <h3 className="text-sm font-bold text-white leading-tight">{evt.activity}</h3>
                                
                                {evt.description && (
                                  <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                                    {evt.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2.5 pt-2 text-[10px] text-slate-400">
                                  {evt.location && (
                                    <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                                      <MapPin className="w-3 h-3 text-blue-400" />
                                      <span>{evt.location}</span>
                                    </span>
                                  )}
                                  {evt.audience && (
                                    <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                                      <Users2 className="w-3 h-3 text-emerald-400" />
                                      <span>{evt.audience}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="py-12 px-4 text-center space-y-3 bg-slate-900/30 rounded-2xl border border-slate-800/60 border-dashed">
                          <Info className="w-8 h-8 text-slate-500 mx-auto" />
                          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                            {language === 'es' 
                              ? 'No se encontraron actividades de esta categoría registradas para este día.' 
                              : 'No activities registered for this category on this day.'}
                          </p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Suggestion panel at very bottom */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>
                    {language === 'es' 
                      ? 'Los horarios están expresados en hora local de Colombia (GMT-5).' 
                      : 'Schedules are expressed in Colombia local time (GMT-5).'}
                  </span>
                </div>

              </div>
            </motion.div>
          ) : (
            /* Agenda Timeline (Consecutive List Layout) */
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Group events by date */}
              {Array.from(new Set(filteredSchedule.map(s => s.date).filter(Boolean).sort())).map((dateStr) => {
                const dayEvents = filteredSchedule
                  .filter(evt => evt.date === dateStr)
                  .sort((a, b) => a.time_start.localeCompare(b.time_start));

                if (dayEvents.length === 0) return null;

                // Format friendly title (e.g. "Día 1 - 23 Oct" or localized)
                const firstEvt = dayEvents[0];
                const dayLabel = firstEvt.day_label || dateStr;

                return (
                  <div key={dateStr} className="space-y-4">
                    {/* Day Group Sticky Header */}
                    <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850/60 backdrop-blur">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{dayLabel}</h3>
                        <p className="text-[10px] font-mono text-slate-400">{dateStr}</p>
                      </div>
                    </div>

                    {/* Timeline items container */}
                    <div className="space-y-3 pl-4 border-l-2 border-slate-800/80">
                      {dayEvents.map((evt, idx) => {
                        const type = getEventType(evt);
                        const isCeremony = type === 'ceremonia';
                        const isSocial = type === 'social';
                        const CategoryIcon = isCeremony ? Sparkles : isSocial ? PartyPopper : Gavel;

                        return (
                          <div
                            key={evt.id || idx}
                            className={`p-4 sm:p-5 rounded-2xl bg-slate-800/40 border hover:bg-slate-800/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative ${
                              isCeremony ? 'border-amber-500/15 hover:border-amber-500/30' :
                              isSocial ? 'border-purple-500/15 hover:border-purple-500/30' :
                              'border-blue-500/15 hover:border-blue-500/30'
                            }`}
                          >
                            {/* Decorative left connector bar */}
                            <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r ${
                              isCeremony ? 'bg-amber-500' : isSocial ? 'bg-purple-500' : 'bg-blue-500'
                            }`} />

                            <div className="flex items-start gap-4">
                              {/* Left Category Icon */}
                              <div className={`p-2.5 rounded-xl border shrink-0 ${
                                isCeremony ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                isSocial ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                                <CategoryIcon className="w-5 h-5" />
                              </div>

                              {/* Info Content */}
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                                    isCeremony ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    isSocial ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  }`}>
                                    {isCeremony ? (language === 'es' ? 'Ceremonia' : 'Ceremony') :
                                     isSocial ? (language === 'es' ? 'Social' : 'Social Event') :
                                     (language === 'es' ? 'Sesión de Debate' : 'Sesión')}
                                  </span>
                                </div>
                                <h4 className="font-display text-base font-bold text-white">{evt.activity}</h4>
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

                            {/* Right side Time badge */}
                            <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center shrink-0 min-w-[130px] self-start md:self-auto shadow-inner">
                              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{evt.time_start}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                                {language === 'en' ? `to ${evt.time_end}` : `hasta ${evt.time_end}`}
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredSchedule.length === 0 && (
                <div className="py-16 px-4 text-center space-y-3 bg-slate-950/40 border border-slate-800 rounded-3xl max-w-md mx-auto">
                  <CalendarDays className="w-12 h-12 text-slate-500 mx-auto animate-pulse" />
                  <h3 className="text-sm font-bold text-white">{language === 'es' ? 'Sin actividades' : 'No activities found'}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'es' 
                      ? 'No hay eventos programados en esta categoría para mostrar en la agenda.' 
                      : 'There are no scheduled events in this category to show in the itinerary.'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};
