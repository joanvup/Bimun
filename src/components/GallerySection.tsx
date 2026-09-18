import React, { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';
import { GalleryItem } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface GallerySectionProps {
  gallery: GalleryItem[];
  configuredCategories?: string[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery, configuredCategories }) => {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  const existingCats = Array.from(new Set(gallery.map((g) => g.category).filter(Boolean)));
  const orderedCategories =
    configuredCategories && configuredCategories.length > 0
      ? [
          ...configuredCategories.filter((c) => existingCats.includes(c)),
          ...existingCats.filter((c) => !configuredCategories.includes(c)),
        ]
      : existingCats;

  const categories = ['all', ...orderedCategories];

  const filtered = gallery.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  if (!gallery || gallery.length === 0) return null;

  return (
    <section id="galeria" className="py-24 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/60">
            {t.gallery.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.gallery.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t.gallery.subtitle}
          </p>

          {/* Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat === 'all' ? t.gallery.filter_all : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative h-72 rounded-2xl overflow-hidden bg-slate-900 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            >
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

              {/* Tag */}
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600/90 text-white backdrop-blur-sm shadow-sm">
                  {photo.category}
                </span>
              </div>

              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-slate-900/70 text-white">
                <Maximize2 className="w-4 h-4" />
              </div>

              {/* Content bottom */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                  {photo.edition}
                </span>
                <h3 className="font-display text-base font-bold leading-snug">{photo.title}</h3>
                {photo.caption && (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{photo.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[75vh] w-full flex items-center justify-center bg-black">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="p-6 bg-slate-900 text-white space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded bg-blue-600 text-white">
                  {selectedPhoto.category}
                </span>
                <span className="text-xs text-amber-400 font-semibold">{selectedPhoto.edition}</span>
              </div>
              <h3 className="font-display text-xl font-bold">{selectedPhoto.title}</h3>
              {selectedPhoto.caption && <p className="text-sm text-slate-300">{selectedPhoto.caption}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
