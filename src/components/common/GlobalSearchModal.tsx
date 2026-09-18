import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  Landmark,
  Newspaper,
  Calendar,
  Users,
  Flag,
  Download,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CornerDownLeft,
  Sparkles,
  Layers,
  Clock,
  MapPin,
  BookOpen,
} from 'lucide-react';
import {
  PublicDataResponse,
  Committee,
  DocumentItem,
  NewsItem,
  ScheduleItem,
  TeamMember,
  Country,
} from '../../types.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PublicDataResponse | null;
  onSelectCommitteeForRegister?: (committeeName: string) => void;
}

type SearchCategory = 'all' | 'committees' | 'documents' | 'news' | 'schedule' | 'team' | 'countries';

interface SearchResultItem {
  id: string;
  type: 'committee' | 'document' | 'news' | 'schedule' | 'team' | 'country';
  title: string;
  subtitle?: string;
  category?: string;
  description?: string;
  extraMeta?: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  actionLabel: string;
  targetHref: string;
  rawItem: any;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  data,
  onSelectCommitteeForRegister,
}) => {
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedNewsArticle, setSelectedNewsArticle] = useState<NewsItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      setSelectedNewsArticle(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle search on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger handled outside if listening globally
        }
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedNewsArticle) {
          setSelectedNewsArticle(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedNewsArticle]);

  // Prepare & index all searchable items
  const allResults = useMemo<SearchResultItem[]>(() => {
    if (!data) return [];
    const results: SearchResultItem[] = [];

    // 1. Committees
    (data.committees || []).forEach((c) => {
      results.push({
        id: `com_${c.id}`,
        type: 'committee',
        title: `${c.name} (${c.abbreviation})`,
        subtitle: `Idioma: ${c.language || 'Español'} • Presidencia: ${c.president_name || 'Mesa Directiva'}`,
        category: 'Comité Académico',
        description: [c.description, c.topic_a ? `Tema A: ${c.topic_a}` : '', c.topic_b ? `Tema B: ${c.topic_b}` : '']
          .filter(Boolean)
          .join(' | '),
        extraMeta: c.language,
        badge: c.abbreviation || 'Comisión',
        badgeColor: 'bg-blue-600/20 text-blue-300 border-blue-500/30',
        icon: <Landmark className="w-4 h-4 text-blue-400" />,
        actionLabel: language === 'en' ? 'View Committee' : 'Ver Comisión',
        targetHref: '#comisiones',
        rawItem: c,
      });
    });

    // 2. Documents
    (data.documents || []).forEach((d) => {
      results.push({
        id: `doc_${d.id}`,
        type: 'document',
        title: d.title,
        subtitle: `${d.category} • ${d.file_size || 'PDF Oficial'}`,
        category: d.category,
        description: d.description,
        extraMeta: d.file_size,
        badge: d.category || 'Documento',
        badgeColor: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30',
        icon: <FileText className="w-4 h-4 text-emerald-400" />,
        actionLabel: language === 'en' ? 'Download / View' : 'Descargar / Abrir',
        targetHref: '#documentos',
        rawItem: d,
      });
    });

    // 3. News
    (data.news || []).forEach((n) => {
      results.push({
        id: `news_${n.id}`,
        type: 'news',
        title: n.title,
        subtitle: `${n.category} • ${n.publish_date}`,
        category: n.category,
        description: `${n.excerpt || ''} ${n.content || ''}`,
        extraMeta: n.publish_date,
        badge: n.category || 'Noticia',
        badgeColor: 'bg-purple-600/20 text-purple-300 border-purple-500/30',
        icon: <Newspaper className="w-4 h-4 text-purple-400" />,
        actionLabel: language === 'en' ? 'Read Article' : 'Leer Noticia',
        targetHref: '#noticias',
        rawItem: n,
      });
    });

    // 4. Schedule
    (data.schedule || []).forEach((s) => {
      results.push({
        id: `sch_${s.id}`,
        type: 'schedule',
        title: s.activity,
        subtitle: `${s.day_label} • ${s.time_start} - ${s.time_end} • ${s.location || 'Sede Principal'}`,
        category: s.day_label,
        description: `${s.description || ''} ${s.audience ? `Dirigido a: ${s.audience}` : ''}`,
        extraMeta: `${s.time_start} - ${s.time_end}`,
        badge: s.day_label || 'Agenda',
        badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-500/30',
        icon: <Calendar className="w-4 h-4 text-amber-400" />,
        actionLabel: language === 'en' ? 'View Schedule' : 'Ver Cronograma',
        targetHref: '#cronograma',
        rawItem: s,
      });
    });

    // 5. Team
    (data.team || []).forEach((t) => {
      results.push({
        id: `team_${t.id}`,
        type: 'team',
        title: t.name,
        subtitle: `${t.role} • ${t.category}`,
        category: t.category,
        description: `${t.bio || ''} ${t.email ? `Contacto: ${t.email}` : ''}`,
        extraMeta: t.role,
        badge: t.role || 'Secretaría',
        badgeColor: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30',
        icon: <Users className="w-4 h-4 text-cyan-400" />,
        actionLabel: language === 'en' ? 'View Profile' : 'Ver Perfil',
        targetHref: '#comite',
        rawItem: t,
      });
    });

    // 6. Countries / Delegations
    (data.countries || []).forEach((co) => {
      results.push({
        id: `country_${co.id}`,
        type: 'country',
        title: `${co.flag_emoji || '🌐'} ${co.name}`,
        subtitle: co.official_name ? `${co.official_name} (${co.code})` : `Código: ${co.code}`,
        category: 'Matriz de Países',
        description: co.additional_info || 'País disponible para asignación y postulación diplomática.',
        extraMeta: co.code,
        badge: co.code || 'País',
        badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-500/30',
        icon: <Flag className="w-4 h-4 text-rose-400" />,
        actionLabel: language === 'en' ? 'View Matrix' : 'Ver Matriz',
        targetHref: '#delegaciones',
        rawItem: co,
      });
    });

    return results;
  }, [data, language]);

  // Filter results according to query and category
  const filteredResults = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return allResults.filter((item) => {
      // Category filter
      if (activeCategory === 'committees' && item.type !== 'committee') return false;
      if (activeCategory === 'documents' && item.type !== 'document') return false;
      if (activeCategory === 'news' && item.type !== 'news') return false;
      if (activeCategory === 'schedule' && item.type !== 'schedule') return false;
      if (activeCategory === 'team' && item.type !== 'team') return false;
      if (activeCategory === 'countries' && item.type !== 'country') return false;

      if (!cleanQuery) return true;

      const haystack = `${item.title} ${item.subtitle || ''} ${item.description || ''} ${item.category || ''} ${item.extraMeta || ''}`.toLowerCase();
      
      // Multi-word matching
      const words = cleanQuery.split(/\s+/).filter(Boolean);
      return words.every((word) => haystack.includes(word));
    });
  }, [allResults, query, activeCategory]);

  // Handle keyboard navigation inside the list
  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectItem = (item: SearchResultItem) => {
    if (item.type === 'document') {
      const doc = item.rawItem as DocumentItem;
      if (doc.file_url && doc.file_url !== '#') {
        window.open(doc.file_url, '_blank');
      } else {
        // Trigger download simulation or jump to documents
        const element = document.getElementById('documentos');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
      onClose();
      return;
    }

    if (item.type === 'news') {
      setSelectedNewsArticle(item.rawItem as NewsItem);
      return;
    }

    // Default: smooth scroll to target section
    const targetId = item.targetHref.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      try {
        window.history.pushState(null, '', item.targetHref);
      } catch {}
    }
    onClose();
  };

  const handleCategoryTab = (cat: SearchCategory) => {
    setActiveCategory(cat);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  // Popular quick searches
  const suggestedQueries = [
    { label: 'DISEC', cat: 'committees' as SearchCategory },
    { label: 'Guía Académica', cat: 'documents' as SearchCategory },
    { label: 'Reglamento', cat: 'documents' as SearchCategory },
    { label: 'Inauguración', cat: 'schedule' as SearchCategory },
    { label: 'Secretaría General', cat: 'team' as SearchCategory },
    { label: 'Crisis', cat: 'committees' as SearchCategory },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Background Click to Dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Spotlight Container */}
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-blue-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInput}
            placeholder={
              language === 'en'
                ? 'Search committees, documents, news, schedule, team...'
                : 'Buscar comisiones, documentos, noticias, cronograma, delegaciones...'
            }
            className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base font-medium outline-none"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mr-2"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-400 border border-slate-700">
            <span>ESC</span>
          </div>

          <button
            onClick={onClose}
            className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] mr-1 shrink-0">
            {language === 'en' ? 'Filter:' : 'Filtro:'}
          </span>

          {[
            { id: 'all', label: language === 'en' ? 'All' : 'Todo', count: allResults.length },
            { id: 'committees', label: language === 'en' ? 'Committees' : 'Comisiones', count: (data?.committees || []).length },
            { id: 'documents', label: language === 'en' ? 'Documents' : 'Documentos', count: (data?.documents || []).length },
            { id: 'news', label: language === 'en' ? 'News' : 'Noticias', count: (data?.news || []).length },
            { id: 'schedule', label: language === 'en' ? 'Schedule' : 'Cronograma', count: (data?.schedule || []).length },
            { id: 'team', label: language === 'en' ? 'Team' : 'Equipo', count: (data?.team || []).length },
            { id: 'countries', label: language === 'en' ? 'Countries' : 'Países', count: (data?.countries || []).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleCategoryTab(tab.id as SearchCategory)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-900 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40 max-h-[50vh] sm:max-h-[55vh]">
          
          {/* If no query and in "all" view, show quick helpful suggestions */}
          {!query && (
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'en' ? 'Suggested Searches' : 'Búsquedas Frecuentes'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQueries.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuery(s.label);
                        setActiveCategory(s.cat);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/60 text-xs text-slate-200 hover:text-white transition-all flex items-center gap-1.5 group cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div
                  onClick={() => handleCategoryTab('committees')}
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1 text-blue-400 font-semibold text-xs">
                    <Landmark className="w-4 h-4" />
                    <span>{language === 'en' ? 'Committees' : 'Comisiones'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
                    {(data?.committees || []).length} {language === 'en' ? 'academic committees' : 'comisiones activas'}
                  </p>
                </div>

                <div
                  onClick={() => handleCategoryTab('documents')}
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1 text-emerald-400 font-semibold text-xs">
                    <FileText className="w-4 h-4" />
                    <span>{language === 'en' ? 'Guides & Docs' : 'Guías y Docs'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
                    {(data?.documents || []).length} {language === 'en' ? 'official files' : 'documentos oficiales'}
                  </p>
                </div>

                <div
                  onClick={() => handleCategoryTab('schedule')}
                  className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1 text-amber-400 font-semibold text-xs">
                    <Calendar className="w-4 h-4" />
                    <span>{language === 'en' ? 'Schedule' : 'Cronograma'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 group-hover:text-slate-300">
                    {(data?.schedule || []).length} {language === 'en' ? 'agenda items' : 'actividades agendadas'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {filteredResults.length > 0 ? (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                    isSelected
                      ? 'bg-blue-600/15 border border-blue-500/40 shadow-sm'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/60 shrink-0 mt-0.5 group-hover:border-slate-500 transition-colors">
                      {item.icon}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>

                      {item.subtitle && (
                        <p className="text-xs text-slate-400 truncate font-medium">
                          {item.subtitle}
                        </p>
                      )}

                      {item.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center pl-2">
                    <button
                      type="button"
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                      }`}
                    >
                      <span className="hidden sm:inline">{item.actionLabel}</span>
                      {item.type === 'document' ? (
                        <Download className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                {language === 'en' ? 'No results found' : 'No se encontraron resultados'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'en'
                  ? `We couldn't find anything matching "${query}". Try searching with different keywords.`
                  : `No encontramos coincidencias para "${query}". Intenta con el nombre de una comisión, documento o tema.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">↓</kbd>
              <span>{language === 'en' ? 'to navigate' : 'navegar'}</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">↵</kbd>
              <span>{language === 'en' ? 'to select' : 'seleccionar'}</span>
            </span>
          </div>

          <div className="font-semibold text-slate-300 text-[11px]">
            {filteredResults.length} {language === 'en' ? 'results' : 'coincidencias'}
          </div>
        </div>

      </div>

      {/* Article Detail Sub-Modal if a news article was clicked */}
      {selectedNewsArticle && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedNewsArticle(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedNewsArticle(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedNewsArticle.image_url && (
              <img
                src={selectedNewsArticle.image_url}
                alt={selectedNewsArticle.title}
                className="w-full h-56 object-cover rounded-2xl"
              />
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-blue-100 text-blue-800">
                  {selectedNewsArticle.category}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedNewsArticle.publish_date}
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900">
                {selectedNewsArticle.title}
              </h2>
            </div>

            <div className="text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line border-t border-slate-100 pt-4">
              {selectedNewsArticle.content || selectedNewsArticle.excerpt}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedNewsArticle(null);
                  onClose();
                  const el = document.getElementById('noticias');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider"
              >
                {language === 'en' ? 'Close & View All News' : 'Cerrar y Ver Todas las Noticias'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
