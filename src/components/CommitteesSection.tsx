import React, { useState, useEffect } from 'react';
import { User, Users, ArrowUpRight, X, ZoomIn, Award, FileText, FileDown, Quote } from 'lucide-react';
import { Committee } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface CommitteesSectionProps {
  committees: Committee[];
  onSelectCommitteeForRegister?: (committeeName: string) => void;
}

interface ZoomLeaderPhoto {
  url: string;
  name: string;
  role: string;
  committeeName: string;
}

export const CommitteesSection: React.FC<CommitteesSectionProps> = ({
  committees,
  onSelectCommitteeForRegister,
}) => {
  const { language, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedModalCommittee, setSelectedModalCommittee] = useState<Committee | null>(null);
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<ZoomLeaderPhoto | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedZoomPhoto) {
          setSelectedZoomPhoto(null);
        } else if (selectedModalCommittee) {
          setSelectedModalCommittee(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedZoomPhoto, selectedModalCommittee]);

  const filterOptions = [
    { key: 'all', label: t.committees.filter_all },
    { key: 'es', label: t.committees.filter_es },
    { key: 'en', label: t.committees.filter_en },
    { key: 'bilingual', label: t.committees.filter_bilingual },
  ];

  const filteredCommittees = committees.filter((c) => {
    if (selectedLanguage === 'all') return true;
    if (selectedLanguage === 'es') return c.language.toLowerCase().includes('español');
    if (selectedLanguage === 'en') return c.language.toLowerCase().includes('english') || c.language.toLowerCase().includes('inglés');
    if (selectedLanguage === 'bilingual') return c.language.toLowerCase().includes('bilingüe') || c.language.toLowerCase().includes('es/en');
    return true;
  });

  return (
    <section id="comisiones" className="py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/60">
            {t.committees.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.committees.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t.committees.subtitle}
          </p>

          {/* Language Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedLanguage(opt.key)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedLanguage === opt.key
                    ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Committees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommittees.map((com) => (
            <div
              key={com.id}
              className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg dark:hover:border-slate-700 transition-all duration-300 flex flex-col group"
            >
              {/* Image & Header */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                <img
                  src={com.image_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80'}
                  alt={com.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-600 text-white uppercase tracking-wider shadow-sm">
                    {com.abbreviation}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm text-slate-200 border border-slate-700">
                    {com.language}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {com.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {com.description}
                  </p>
                </div>

                {/* Topics Preview */}
                <div className="space-y-2 border-t border-slate-200/80 dark:border-slate-800 pt-3">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {language === 'en' ? 'Main Agenda (Topic A):' : 'Tema Principal (Topic A):'}
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 italic bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    "{com.topic_a}"
                  </p>
                </div>

                {/* Dais Leadership Preview (President & Co-President) */}
                <div className="space-y-2 border-t border-slate-200/80 dark:border-slate-800 pt-3">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{language === 'en' ? 'Committee Dais' : 'Mesa Directiva'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* President */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
                      {com.president_photo ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedZoomPhoto({
                              url: com.president_photo,
                              name: com.president_name || (language === 'en' ? 'President' : 'Presidente'),
                              role: language === 'en' ? 'President / Chair' : 'Presidente',
                              committeeName: com.name,
                            });
                          }}
                          className="relative w-8 h-8 rounded-full overflow-hidden border border-blue-400/80 dark:border-blue-500/80 shrink-0 group/zoom hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                          title={language === 'en' ? 'Click to enlarge photo' : 'Clic para ampliar fotografía'}
                        >
                          <img
                            src={com.president_photo}
                            alt={com.president_name || 'Presidente'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover/zoom:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-3 h-3 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider leading-none mb-0.5">
                          {language === 'en' ? 'President' : 'Presidente'}
                        </span>
                        <span
                          className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                          title={com.president_name}
                        >
                          {com.president_name || (language === 'en' ? 'To be appointed' : 'Por designar')}
                        </span>
                      </div>
                    </div>

                    {/* Co-President */}
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-xs">
                      {(com.copresident_photo || com.vicepresident_photo) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const photo = com.copresident_photo || com.vicepresident_photo;
                            if (photo) {
                              setSelectedZoomPhoto({
                                url: photo,
                                name: com.copresident_name || com.vicepresident_name || (language === 'en' ? 'Co-President' : 'Copresidente'),
                                role: language === 'en' ? 'Co-President / Vice-Chair' : 'Copresidente',
                                committeeName: com.name,
                              });
                            }
                          }}
                          className="relative w-8 h-8 rounded-full overflow-hidden border border-indigo-400/80 dark:border-indigo-500/80 shrink-0 group/zoom hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer"
                          title={language === 'en' ? 'Click to enlarge photo' : 'Clic para ampliar fotografía'}
                        >
                          <img
                            src={com.copresident_photo || com.vicepresident_photo}
                            alt={com.copresident_name || com.vicepresident_name || 'Copresidente'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover/zoom:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="w-3 h-3 text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider leading-none mb-0.5">
                          {language === 'en' ? 'Co-President' : 'Copresidente'}
                        </span>
                        <span
                          className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                          title={com.copresident_name || com.vicepresident_name}
                        >
                          {com.copresident_name || com.vicepresident_name || (language === 'en' ? 'To be appointed' : 'Por designar')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions (Guide PDF & Ver detalles) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
                  <div>
                    {com.study_guide_url ? (
                      <a
                        href={com.study_guide_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`${com.abbreviation}_Guia_Academica.pdf`}
                        onClick={(e) => e.stopPropagation()}
                        title={language === 'en' ? 'Download Study Guide (PDF)' : 'Descargar Guía de Estudio (PDF)'}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Study Guide' : 'Guía PDF'}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                        {language === 'en' ? 'Guide in preparation' : 'Guía en preparación'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedModalCommittee(com)}
                    className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1 group/btn cursor-pointer py-1"
                  >
                    <span>{t.committees.details_btn}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedModalCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            {/* Modal Header */}
            <div className="relative h-48 sm:h-56 bg-slate-900 overflow-hidden">
              <img
                src={selectedModalCommittee.image_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80'}
                alt={selectedModalCommittee.name}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <button
                onClick={() => setSelectedModalCommittee(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-5 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-600 text-white uppercase tracking-wider shadow-sm">
                    {selectedModalCommittee.abbreviation}
                  </span>
                  <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md text-slate-200 border border-slate-700/80">
                    {selectedModalCommittee.language}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  {selectedModalCommittee.name}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-8">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  {language === 'en' ? 'About this Committee' : 'Acerca de esta Comisión'}
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedModalCommittee.description}
                </p>
              </div>

              {/* Topics A, B, C */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t.committees.modal_topics}
                </h4>
                <div className="space-y-2.5">
                  <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide block mb-1">
                      {language === 'en' ? 'Topic A (Main Agenda)' : 'Topic A (Tema Principal)'}
                    </span>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {selectedModalCommittee.topic_a}
                    </p>
                  </div>

                  {selectedModalCommittee.topic_b && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block mb-1">
                        Topic B
                      </span>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {selectedModalCommittee.topic_b}
                      </p>
                    </div>
                  )}

                  {selectedModalCommittee.topic_c && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block mb-1">
                        Topic C
                      </span>
                      <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {selectedModalCommittee.topic_c}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Leadership / Mesa Directiva (Grand & Prominent Photos) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t.committees.modal_board}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* President Card */}
                  <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-slate-50 dark:from-blue-950/30 dark:via-slate-900/80 dark:to-slate-900 border border-blue-200/70 dark:border-blue-900/50 shadow-sm transition-all hover:shadow-md">
                    <button
                      type="button"
                      onClick={() =>
                        selectedModalCommittee.president_photo &&
                        setSelectedZoomPhoto({
                          url: selectedModalCommittee.president_photo,
                          name: selectedModalCommittee.president_name || 'Presidente',
                          role: language === 'en' ? 'President / Chair' : 'Presidente',
                          committeeName: selectedModalCommittee.name,
                        })
                      }
                      className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-blue-400 dark:border-blue-600 shadow-md bg-slate-200 dark:bg-slate-800 shrink-0 group/photo transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        selectedModalCommittee.president_photo ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                      }`}
                      title={
                        selectedModalCommittee.president_photo
                          ? language === 'en'
                            ? 'Click to enlarge photo'
                            : 'Clic para ampliar fotografía'
                          : undefined
                      }
                    >
                      {selectedModalCommittee.president_photo ? (
                        <>
                          <img
                            src={selectedModalCommittee.president_photo}
                            alt={selectedModalCommittee.president_name}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/photo:scale-110"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-7 h-7 drop-shadow-md" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <span className="inline-block text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-100/70 dark:bg-blue-950/70 px-2.5 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                        {language === 'en' ? 'President / Chair' : 'Presidente'}
                      </span>
                      <h5 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {selectedModalCommittee.president_name || (language === 'en' ? 'To be appointed' : 'Por designar')}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedModalCommittee.abbreviation} • {language === 'en' ? 'Dais Leadership' : 'Mesa Directiva'}
                      </p>
                    </div>
                  </div>

                  {/* Co-President Card */}
                  <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800/40 dark:via-slate-900/80 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                    <button
                      type="button"
                      onClick={() => {
                        const photoUrl = selectedModalCommittee.copresident_photo || selectedModalCommittee.vicepresident_photo;
                        if (photoUrl) {
                          setSelectedZoomPhoto({
                            url: photoUrl,
                            name: selectedModalCommittee.copresident_name || selectedModalCommittee.vicepresident_name || (language === 'en' ? 'Co-President' : 'Copresidente'),
                            role: language === 'en' ? 'Co-President' : 'Copresidente',
                            committeeName: selectedModalCommittee.name,
                          });
                        }
                      }}
                      className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-md bg-slate-200 dark:bg-slate-800 shrink-0 group/photo transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 ${
                        (selectedModalCommittee.copresident_photo || selectedModalCommittee.vicepresident_photo)
                          ? 'cursor-pointer hover:scale-105'
                          : 'cursor-default'
                      }`}
                      title={
                        (selectedModalCommittee.copresident_photo || selectedModalCommittee.vicepresident_photo)
                          ? language === 'en'
                            ? 'Click to enlarge photo'
                            : 'Clic para ampliar fotografía'
                          : undefined
                      }
                    >
                      {(selectedModalCommittee.copresident_photo || selectedModalCommittee.vicepresident_photo) ? (
                        <>
                          <img
                            src={selectedModalCommittee.copresident_photo || selectedModalCommittee.vicepresident_photo}
                            alt={selectedModalCommittee.copresident_name || selectedModalCommittee.vicepresident_name}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/photo:scale-110"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-7 h-7 drop-shadow-md" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <span className="inline-block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        {language === 'en' ? 'Co-President / Co-Chair' : 'Copresidente'}
                      </span>
                      <h5 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {selectedModalCommittee.copresident_name ||
                          selectedModalCommittee.vicepresident_name ||
                          (language === 'en' ? 'To be appointed' : 'Por designar')}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedModalCommittee.abbreviation} • {language === 'en' ? 'Dais Leadership' : 'Mesa Directiva'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guía de Estudio del Comité (Study Guide Card) */}
              {selectedModalCommittee.study_guide_url && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-blue-900/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border border-blue-200 dark:border-blue-900/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {language === 'en' ? 'Official Document' : 'Documento Oficial'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">PDF</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {language === 'en' ? 'Committee Study Guide' : 'Guía de Estudio del Comité'}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {language === 'en'
                          ? 'Academic topics, background, debate dynamics, and guiding research questions.'
                          : 'Temario académico, antecedentes, dinámica de debate y preguntas orientadoras para delegados.'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={selectedModalCommittee.study_guide_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`${selectedModalCommittee.abbreviation}_Guia_Academica_BIMUN.pdf`}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>{language === 'en' ? 'Download Study Guide' : 'Descargar Guía de Estudio (PDF)'}</span>
                  </a>
                </div>
              )}

              {/* Dais Welcome Speeches (Discursos de Bienvenida) */}
              {(selectedModalCommittee.president_welcome || selectedModalCommittee.copresident_welcome) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Quote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {language === 'en' ? 'Dais Welcome Addresses' : 'Discursos de Bienvenida de la Mesa Directiva'}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* President Welcome */}
                    {selectedModalCommittee.president_welcome && (
                      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 relative space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          {selectedModalCommittee.president_photo ? (
                            <img
                              src={selectedModalCommittee.president_photo}
                              alt={selectedModalCommittee.president_name}
                              className="w-10 h-10 rounded-full object-cover border border-blue-400/50 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                              {language === 'en' ? 'Address by the President' : 'Discurso del Presidente'}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {selectedModalCommittee.president_name || (language === 'en' ? 'President' : 'Presidente')}
                            </h5>
                          </div>
                        </div>
                        <div className="pl-3 border-l-2 border-blue-500/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed italic">
                          {selectedModalCommittee.president_welcome}
                        </div>
                      </div>
                    )}

                    {/* Copresident Welcome */}
                    {selectedModalCommittee.copresident_welcome && (
                      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 relative space-y-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          {(selectedModalCommittee.copresident_photo || selectedModalCommittee.vicepresident_photo) ? (
                            <img
                              src={selectedModalCommittee.copresident_photo || selectedModalCommittee.vicepresident_photo}
                              alt={selectedModalCommittee.copresident_name || selectedModalCommittee.vicepresident_name}
                              className="w-10 h-10 rounded-full object-cover border border-indigo-400/50 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                              {language === 'en' ? 'Address by the Co-President' : 'Discurso del Copresidente'}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {selectedModalCommittee.copresident_name ||
                                selectedModalCommittee.vicepresident_name ||
                                (language === 'en' ? 'Co-President' : 'Copresidente')}
                            </h5>
                          </div>
                        </div>
                        <div className="pl-3 border-l-2 border-indigo-500/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed italic">
                          {selectedModalCommittee.copresident_welcome}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3">
                {selectedModalCommittee.study_guide_url && (
                  <a
                    href={selectedModalCommittee.study_guide_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`${selectedModalCommittee.abbreviation}_Guia_Academica_BIMUN.pdf`}
                    className="px-4 py-2.5 rounded-xl border border-blue-600/40 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Study Guide (PDF)' : 'Guía de Estudio (PDF)'}</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedModalCommittee(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  {t.committees.modal_close}
                </button>
                <a
                  href="#inscripciones"
                  onClick={() => {
                    if (onSelectCommitteeForRegister) {
                      onSelectCommitteeForRegister(selectedModalCommittee.name);
                    }
                    setSelectedModalCommittee(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20"
                >
                  {t.committees.register_committee_btn}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR COMMITTEE LEADER PHOTO */}
      {selectedZoomPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          onClick={() => setSelectedZoomPhoto(null)}
        >
          <div
            className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-7 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedZoomPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={language === 'en' ? 'Close' : 'Cerrar'}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Enlarged Photo */}
            <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950 mb-5 relative group">
              <img
                src={selectedZoomPhoto.url}
                alt={selectedZoomPhoto.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Leader Details */}
            <div className="space-y-2 max-w-sm">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-300 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800/60">
                {selectedZoomPhoto.role}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                {selectedZoomPhoto.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {selectedZoomPhoto.committeeName}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
