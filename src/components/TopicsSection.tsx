import React from 'react';
import { BookMarked, FileText } from 'lucide-react';
import { Committee } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TopicsSectionProps {
  committees: Committee[];
}

export const TopicsSection: React.FC<TopicsSectionProps> = ({ committees }) => {
  const { language, t } = useLanguage();

  return (
    <section id="temas" className="py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
            {t.topics.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.topics.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            {t.topics.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {committees.map((com) => (
            <div
              key={com.id}
              className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-500/60 transition-all space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-900 dark:bg-blue-950 text-amber-300 border border-blue-800/50">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                      {com.abbreviation} • {com.language}
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">{com.name}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Topic A */}
                <div className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                      {t.topics.topic_a} ({language === 'en' ? 'Main' : 'Principal'})
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                    {com.topic_a}
                  </p>
                </div>

                {/* Topic B */}
                {com.topic_b && (
                  <div className="bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
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
                  <div className="bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      {t.topics.topic_c}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {com.topic_c}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {language === 'en' ? 'Chair Dais: ' : 'Presidencia: '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {com.president_name || (language === 'en' ? 'Appointed' : 'Designada')}
                  </strong>
                </span>
                <a
                  href="#documentos"
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.topics.download_guide}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
