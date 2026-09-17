import React, { useState } from 'react';
import { Calendar, ArrowRight, X } from 'lucide-react';
import { NewsItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface NewsSectionProps {
  news: NewsItem[];
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news }) => {
  const { language, t } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  if (!news || news.length === 0) return null;

  return (
    <section id="noticias" className="py-24 bg-slate-100/60 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-100 px-3.5 py-1 rounded-full border border-blue-200">
            {t.news.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t.news.title}
          </h2>
          <p className="text-base text-slate-600 font-normal leading-relaxed">
            {t.news.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-900/90 text-white backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.publish_date}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => setSelectedArticle(item)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>{t.news.read_more}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 relative">
            <div className="relative h-56 bg-slate-900 overflow-hidden">
              <img
                src={selectedArticle.image_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80'}
                alt={selectedArticle.title}
                className="w-full h-full object-cover opacity-75"
              />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-blue-600">
                  {selectedArticle.category}
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold mt-2 leading-tight">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  {language === 'en' ? 'Published on: ' : 'Fecha de publicación: '}
                  {selectedArticle.publish_date}
                </span>
                <span>•</span>
                <span>
                  {language === 'en' ? 'BIMUN Press Secretariat' : 'Secretaría de Prensa BIMUN'}
                </span>
              </div>

              <div className="prose prose-slate text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {selectedArticle.content}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {language === 'en' ? 'Close' : 'Entendido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
