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
    <section id="nosotros" className="py-24 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/60">
            {t.about.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.about.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t.about.subtitle}
          </p>
        </div>

        {/* Interactive Tabs and Content Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Column */}
          <div className="lg:col-span-4 flex flex-col gap-2">
            {aboutItems.map((item) => {
              const isActive = (currentItem?.id === item.id) || (activeTab === item.id);
              const title = getLocalizedTitle(item);
              const subtitle = getLocalizedSubtitle(item);

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`text-left p-4 rounded-xl transition-all flex items-center justify-between border cursor-pointer ${
                    isActive
                      ? 'bg-blue-900 dark:bg-blue-600 text-white border-blue-900 dark:border-blue-500 shadow-md shadow-blue-900/20'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isActive ? 'bg-blue-800 dark:bg-blue-700 text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {getIcon(item.icon)}
                    </div>
                    <div>
                      <p className="text-sm font-bold tracking-tight leading-tight">{title}</p>
                      {subtitle && (
                        <p
                          className={`text-xs mt-0.5 line-clamp-1 ${
                            isActive ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-amber-300 translate-x-1' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Active Detail Display */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 shadow-sm relative overflow-hidden">
            {currentItem && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800">
                    {getIcon(currentItem.icon)}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                      {getLocalizedTitle(currentItem)}
                    </h3>
                    {currentItem.subtitle && (
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mt-0.5">
                        {getLocalizedSubtitle(currentItem)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-base space-y-4">
                  {currentItem.content.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.includes('1.') || paragraph.includes('2.')) {
                      const lines = paragraph.split('\n');
                      return (
                        <ul key={pIdx} className="space-y-2.5 my-3 pl-0 list-none">
                          {lines.map((line, lIdx) => (
                            <li key={lIdx} className="flex items-start gap-3 text-slate-700 dark:text-slate-200">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
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

                {/* Institutional Endorsement */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/60 -mx-8 -mb-8 p-6 rounded-b-2xl">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Fundación Colegio Bilingüe de Valledupar
                  </span>
                  <span className="italic">
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
