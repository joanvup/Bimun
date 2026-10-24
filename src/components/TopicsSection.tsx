import React, { useState } from 'react';
import { BookMarked, FileDown, FileText, User, Users, X, ZoomIn } from 'lucide-react';
import { Committee } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TopicsSectionProps {
  committees: Committee[];
}

export const TopicsSection: React.FC<TopicsSectionProps> = ({ committees }) => {
  const { language, t } = useLanguage();
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; name: string; role: string; committeeName: string } | null>(null);

  return (
    <section id="temas" className="py-20 sm:py-24 bg-[#eff4ff] dark:bg-[#081426] border-b border-slate-200/90 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00658e] dark:text-[#83cfff] bg-[#c7e7ff]/60 dark:bg-[#00658e]/20 px-3.5 py-1 rounded-full border border-[#00658e]/20">
            {t.topics.badge}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#000d23] dark:text-white tracking-tight">
            {t.topics.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t.topics.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {committees.map((com) => {
            const hasStudyGuide = Boolean(com.study_guide_url && com.study_guide_url.trim() !== '');

            return (
              <div
                key={com.id}
                className="p-6 rounded-3xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-blue-400/80 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between space-y-5"
              >
                {/* Header: Committee Name & Language */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-blue-900 dark:bg-blue-950 text-amber-300 border border-blue-800/50 shrink-0 shadow-sm">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                            {com.abbreviation}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {com.language}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug truncate">
                          {com.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-2.5">
                    {/* Topic A */}
                    <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 tracking-wide">
                          {t.topics.topic_a} ({language === 'en' ? 'Main' : 'Principal'})
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                        {com.topic_a}
                      </p>
                    </div>

                    {/* Topic B */}
                    {com.topic_b && (
                      <div className="bg-white dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
                        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                          {t.topics.topic_b}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
                          {com.topic_b}
                        </p>
                      </div>
                    )}

                    {/* Topic C */}
                    {com.topic_c && (
                      <div className="bg-white dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800/70">
                        <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                          {t.topics.topic_c}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
                          {com.topic_c}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Section: Leadership Dais & PDF Download */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3.5">
                  {/* Dais Leadership (Presidente & Copresidente) */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {language === 'en' ? 'Dais Leadership' : 'Mesa Directiva'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* President Card */}
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        {com.president_photo ? (
                          <button
                            type="button"
                            onClick={() =>
                              setZoomPhoto({
                                url: com.president_photo!,
                                name: com.president_name || 'Presidente',
                                role: language === 'en' ? 'President / Chair' : 'Presidente',
                                committeeName: com.name,
                              })
                            }
                            className="relative w-11 h-11 rounded-xl overflow-hidden border border-blue-300 dark:border-blue-700 shadow-xs shrink-0 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title={language === 'en' ? 'Click to enlarge photo' : 'Clic para ampliar fotografía'}
                          >
                            <img
                              src={com.president_photo}
                              alt={com.president_name || 'Presidente'}
                              className="w-full h-full object-cover object-top transition-transform duration-200 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-3.5 h-3.5 drop-shadow" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/70 dark:border-blue-900/60">
                            <User className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block leading-none mb-1">
                            {language === 'en' ? 'President' : 'Presidente'}
                          </span>
                          <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {com.president_name || (language === 'en' ? 'To be appointed' : 'Por designar')}
                          </h5>
                        </div>
                      </div>

                      {/* Co-President Card */}
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                        {com.copresident_photo ? (
                          <button
                            type="button"
                            onClick={() =>
                              setZoomPhoto({
                                url: com.copresident_photo!,
                                name: com.copresident_name || 'Copresidente',
                                role: language === 'en' ? 'Co-President / Co-Chair' : 'Copresidente',
                                committeeName: com.name,
                              })
                            }
                            className="relative w-11 h-11 rounded-xl overflow-hidden border border-indigo-300 dark:border-indigo-700 shadow-xs shrink-0 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title={language === 'en' ? 'Click to enlarge photo' : 'Clic para ampliar fotografía'}
                          >
                            <img
                              src={com.copresident_photo}
                              alt={com.copresident_name || 'Copresidente'}
                              className="w-full h-full object-cover object-top transition-transform duration-200 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-3.5 h-3.5 drop-shadow" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/70 dark:border-indigo-900/60">
                            <User className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block leading-none mb-1">
                            {language === 'en' ? 'Co-President' : 'Copresidente'}
                          </span>
                          <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {com.copresident_name || (language === 'en' ? 'To be appointed' : 'Por designar')}
                          </h5>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF Study Guide Action */}
                  <div className="pt-1">
                    {hasStudyGuide ? (
                      <a
                        href={com.study_guide_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`${com.abbreviation}_Guia_Academica_BIMUN.pdf`}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        <FileDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                        <span>{language === 'en' ? 'Download Study Guide (PDF)' : 'Descargar Guía de Estudio (PDF)'}</span>
                        <span className="ml-1 px-1.5 py-0.2 bg-blue-700/80 rounded text-[9px] font-mono">
                          PDF
                        </span>
                      </a>
                    ) : (
                      <a
                        href="#documentos"
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 hover:bg-slate-300 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>
                          {language === 'en'
                            ? 'Study guide in preparation • See general documents'
                            : 'Guía de estudio en preparación • Ver documentos'}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomPhoto(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar vista de foto"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative aspect-4/5 bg-slate-900">
              <img
                src={zoomPhoto.url}
                alt={zoomPhoto.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="p-4 text-center space-y-1">
              <span className="inline-block text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-100 dark:bg-blue-950 px-2.5 py-0.5 rounded-full">
                {zoomPhoto.role}
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {zoomPhoto.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {zoomPhoto.committeeName}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
