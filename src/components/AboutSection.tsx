import React, { useState, useEffect } from 'react';
import { Globe, Target, BookOpen, Award, Clock, Compass, ChevronRight, Check } from 'lucide-react';
import { AboutSection as AboutSectionType } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface AboutSectionProps {
  aboutItems: AboutSectionType[];
}

export const AboutSection: React.FC<AboutSectionProps> = ({ aboutItems }) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>(aboutItems[0]?.id || '');

  useEffect(() => {
    if (aboutItems && aboutItems.length > 0 && (!activeTab || !aboutItems.some((item) => item.id === activeTab))) {
      setActiveTab(aboutItems[0].id);
    }
  }, [aboutItems, activeTab]);

  const currentItem = aboutItems.find((item) => item.id === activeTab) || aboutItems[0];

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'target':
        return <Target className="w-5 h-5" />;
      case 'bookopen':
        return <BookOpen className="w-5 h-5" />;
      case 'award':
        return <Award className="w-5 h-5" />;
      case 'clock':
        return <Clock className="w-5 h-5" />;
      case 'compass':
        return <Compass className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  if (!aboutItems || aboutItems.length === 0) return null;

  // Title localization helper
  const getLocalizedTitle = (item: AboutSectionType) => {
    if (language === 'es') return item.title;
    const lower = item.title.toLowerCase();
    if (lower.includes('qué es') || lower.includes('que es')) return 'What is BIMUN?';
    if (lower.includes('objetivo')) return 'Our Mission & Objectives';
    if (lower.includes('metodolog')) return 'Parliamentary Methodology';
    if (lower.includes('historia')) return 'History & Tradition';
    if (lower.includes('beneficio')) return 'Educational Benefits';
    return item.title;
  };

  const getLocalizedSubtitle = (item: AboutSectionType) => {
    if (language === 'es') return item.subtitle;
    const lower = (item.subtitle || '').toLowerCase();
    if (lower.includes('liderazgo') || lower.includes('diplomac')) return 'Leadership, diplomacy, and debate';
    if (lower.includes('procedimiento') || lower.includes('parlamentar')) return 'Official rules and negotiation';
    if (lower.includes('valledupar') || lower.includes('caribe')) return '27 years of educational excellence in Valledupar';
    return item.subtitle;
  };

  return (
    <section id="nosotros" className="py-20 sm:py-24 bg-white dark:bg-[#060f1e] border-b border-slate-200/90 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#c7e7ff]/60 dark:bg-[#00658e]/20 text-[#00658e] dark:text-[#83cfff] border border-[#00658e]/20 text-xs font-bold uppercase tracking-widest">
            <Globe className="w-3.5 h-3.5" />
            <span>{t.about.badge}</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#000d23] dark:text-white tracking-tight">
            {t.about.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t.about.subtitle}
          </p>
        </div>

        {/* Diplomatic Summit Layout: Secretariat Dispatch Card + Interactive Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (5 cols): Official Dispatch Card & Harvard ROP Badge */}
          <div className="lg:col-span-5 space-y-4">
            {/* Dispatch Box with Gavel */}
            <div className="relative bg-[#eff4ff] dark:bg-[#0c1f38] p-6 sm:p-7 rounded-xl shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#000d23] text-white flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-2xl">⚖️</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#00658e] dark:text-[#83cfff] block">
                    {language === 'en' ? 'Official Dispatch' : 'Despacho Oficial'}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#000d23] dark:text-white">
                    {language === 'en' ? 'BIMUN Secretariat' : 'Secretaría General BIMUN'}
                  </h3>
                </div>
              </div>

              <p className="font-serif italic text-base sm:text-lg text-[#000d23] dark:text-slate-200 font-medium leading-relaxed">
                “La diplomacia no es la ausencia de conflicto, sino la perseverancia inquebrantable de dialogar hasta encontrar caminos de coexistencia pacífica.”
              </p>

              {/* Signatures Row */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#081426] p-3.5 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#000d23] dark:text-white block">Secretaría General</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">BIMUN Secretariat</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#00658e] dark:text-[#83cfff] block">Dirección Académica</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Academic Directorate</span>
                </div>
              </div>
            </div>

            {/* Harvard & UNA-USA Protocol Badge */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/90 dark:border-slate-700 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-[#00658e]/10 text-[#00658e] dark:text-[#009edb] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#000d23] dark:text-white uppercase tracking-wider">
                  {language === 'en' ? 'Harvard & UNA-USA Debate Protocol' : 'Protocolo Harvard & UNA-USA'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {language === 'en'
                    ? 'Parliamentary rules adapted with rigorous academic standards.'
                    : 'Reglamento parlamentario adaptado con estricta rigurosidad académica.'}
                </p>
              </div>
            </div>

            {/* Navigation Tabs (Vertical List) */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 block mb-2">
                {language === 'en' ? 'Institutional Dossier' : 'Dossier Institucional'}
              </span>
              {aboutItems.map((item) => {
                const isActive = (currentItem?.id === item.id) || (activeTab === item.id);
                const title = getLocalizedTitle(item);
                const subtitle = getLocalizedSubtitle(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left p-3.5 rounded-lg transition-all flex items-center justify-between border cursor-pointer ${
                      isActive
                        ? 'bg-[#000d23] text-white border-[#000d23] shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-md shrink-0 ${
                          isActive ? 'bg-white/10 text-[#83cfff]' : 'bg-slate-100 dark:bg-slate-700 text-[#00658e] dark:text-[#83cfff]'
                        }`}
                      >
                        {getIcon(item.icon)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold tracking-tight truncate">{title}</p>
                        {subtitle && (
                          <p
                            className={`text-[10px] mt-0.5 truncate ${
                              isActive ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-[#83cfff] translate-x-1' : 'text-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (7 cols): Editorial Presentation & Active Content */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/90 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
            {currentItem && (
              <div className="space-y-6">
                <div className="flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-700 pb-5">
                  <div className="p-3 bg-[#c7e7ff]/40 dark:bg-[#00658e]/20 text-[#00658e] dark:text-[#83cfff] rounded-lg">
                    {getIcon(currentItem.icon)}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#00658e] dark:text-[#83cfff] tracking-wider block">
                      {language === 'en' ? 'Official Briefing' : 'Documento Oficial'}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#000d23] dark:text-white mt-0.5">
                      {getLocalizedTitle(currentItem)}
                    </h3>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base space-y-4">
                  {currentItem.content.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.includes('1.') || paragraph.includes('2.')) {
                      const lines = paragraph.split('\n');
                      return (
                        <ul key={pIdx} className="space-y-2.5 my-3 pl-0 list-none">
                          {lines.map((line, lIdx) => (
                            <li key={lIdx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-200">
                              <span className="w-5 h-5 rounded-full bg-[#c7e7ff]/70 dark:bg-[#00658e]/40 text-[#00658e] dark:text-[#83cfff] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                <Check className="w-3 h-3" />
                              </span>
                              <span>{line.replace(/^\d+\.\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={pIdx}>{paragraph}</p>;
                  })}
                </div>

                {/* Institutional Endorsement & Footer Bar */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-[#eff4ff]/60 dark:bg-[#081426]/60 -mx-6 -mb-6 p-5 rounded-b-xl">
                  <span className="font-bold text-[#000d23] dark:text-white">
                    Fundación Colegio Bilingüe de Valledupar
                  </span>
                  <span className="italic text-[#00658e] dark:text-[#83cfff]">
                    {language === 'en'
                      ? 'Secretariat & BIMUN Academic Directorate'
                      : 'Secretaría General & Dirección Académica BIMUN'}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
