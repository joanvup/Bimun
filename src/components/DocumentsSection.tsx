import React, { useState } from 'react';
import { FileText, Download, Sparkles } from 'lucide-react';
import { DocumentItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface DocumentsSectionProps {
  documents: DocumentItem[];
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({ documents }) => {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(documents.map((d) => d.category)))];

  const filtered = documents.filter((d) => {
    if (activeCategory === 'all') return true;
    return d.category === activeCategory;
  });

  const handleDownload = (doc: DocumentItem) => {
    if (doc.file_url && doc.file_url !== '#') {
      window.open(doc.file_url, '_blank');
    } else {
      const blob = new Blob(
        [
          `BIMUN XXVII - Fundación Colegio Bilingüe de Valledupar\n\nOfficial Document: ${doc.title}\nCategory: ${doc.category}\nDescription: ${doc.description}\n\nFor sealed physical copies or inquiries, contact the Secretariat at: bimun@colegiobilingue.edu.co`
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <section id="documentos" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            {t.documents.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t.documents.title}
          </h2>
          <p className="text-base text-slate-600 font-normal leading-relaxed">
            {t.documents.subtitle}
          </p>

          {/* Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? t.documents.category_all : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                doc.is_featured
                  ? 'bg-blue-50/40 border-blue-200 shadow-sm hover:border-blue-300'
                  : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-md bg-white border border-slate-200 text-blue-800">
                    {doc.category}
                  </span>
                  {doc.is_featured ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {language === 'en' ? 'Featured' : 'Destacado'}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">{doc.file_size}</span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-blue-100/70 text-blue-700 shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {language === 'en' ? 'Official PDF' : 'PDF Oficial'}
                </span>
                <button
                  onClick={() => handleDownload(doc)}
                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.documents.download_btn}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
