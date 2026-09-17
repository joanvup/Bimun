import React, { useState } from 'react';
import { User, ArrowUpRight, X } from 'lucide-react';
import { Committee } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface CommitteesSectionProps {
  committees: Committee[];
  onSelectCommitteeForRegister?: (committeeName: string) => void;
}

export const CommitteesSection: React.FC<CommitteesSectionProps> = ({
  committees,
  onSelectCommitteeForRegister,
}) => {
  const { language, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedModalCommittee, setSelectedModalCommittee] = useState<Committee | null>(null);

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
    <section id="comisiones" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            {t.committees.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t.committees.title}
          </h2>
          <p className="text-base text-slate-600 font-normal leading-relaxed">
            {t.committees.subtitle}
          </p>

          {/* Language Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedLanguage(opt.key)}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  selectedLanguage === opt.key
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
              className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
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
                  <h3 className="font-display text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {com.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {com.description}
                  </p>
                </div>

                {/* Topics Preview */}
                <div className="space-y-2 border-t border-slate-200/80 pt-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'en' ? 'Main Agenda (Topic A):' : 'Tema Principal (Topic A):'}
                  </div>
                  <p className="text-xs font-medium text-slate-800 line-clamp-2 italic bg-white p-2.5 rounded-lg border border-slate-200/60">
                    "{com.topic_a}"
                  </p>
                </div>

                {/* Presidents Preview */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    {com.president_photo ? (
                      <img
                        src={com.president_photo}
                        alt={com.president_name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-300"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    )}
                    <span className="font-medium truncate max-w-[150px]">
                      {com.president_name || (language === 'en' ? 'Chair Dais' : 'Presidencia')}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedModalCommittee(com)}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 group/btn"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative">
            {/* Modal Header */}
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              <img
                src={selectedModalCommittee.image_url || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80'}
                alt={selectedModalCommittee.name}
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <button
                onClick={() => setSelectedModalCommittee(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider">
                    {selectedModalCommittee.abbreviation}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800/90 text-slate-200 border border-slate-700">
                    {selectedModalCommittee.language}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
                  {selectedModalCommittee.name}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {language === 'en' ? 'About this Committee' : 'Acerca de esta Comisión'}
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedModalCommittee.description}
                </p>
              </div>

              {/* Topics A, B, C */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t.committees.modal_topics}
                </h4>
                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wide block mb-1">
                      {language === 'en' ? 'Topic A (Main Agenda)' : 'Topic A (Tema Principal)'}
                    </span>
                    <p className="text-sm text-slate-800 font-medium">
                      {selectedModalCommittee.topic_a}
                    </p>
                  </div>

                  {selectedModalCommittee.topic_b && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
                        Topic B
                      </span>
                      <p className="text-sm text-slate-800 font-medium">
                        {selectedModalCommittee.topic_b}
                      </p>
                    </div>
                  )}

                  {selectedModalCommittee.topic_c && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-1">
                        Topic C
                      </span>
                      <p className="text-sm text-slate-800 font-medium">
                        {selectedModalCommittee.topic_c}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Leadership / Mesa Directiva */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {t.committees.modal_board}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* President */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    {selectedModalCommittee.president_photo ? (
                      <img
                        src={selectedModalCommittee.president_photo}
                        alt={selectedModalCommittee.president_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                        {language === 'en' ? 'President / Chair' : 'Presidente'}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedModalCommittee.president_name || (language === 'en' ? 'To be appointed' : 'Por designar')}
                      </p>
                    </div>
                  </div>

                  {/* Vicepresident */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    {selectedModalCommittee.vicepresident_photo ? (
                      <img
                        src={selectedModalCommittee.vicepresident_photo}
                        alt={selectedModalCommittee.vicepresident_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        {language === 'en' ? 'Vice-President' : 'Vicepresidente'}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedModalCommittee.vicepresident_name || (language === 'en' ? 'To be appointed' : 'Por designar')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedModalCommittee(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold"
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  {t.committees.register_committee_btn}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
