import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, UserCheck, Globe } from 'lucide-react';
import { Delegation, Committee } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

interface DelegationsMatrixProps {
  delegations: Delegation[];
  committees: Committee[];
  onSelectDelegationForRegister?: (committeeName: string, countryName: string) => void;
}

export const DelegationsMatrix: React.FC<DelegationsMatrixProps> = ({
  delegations,
  committees,
  onSelectDelegationForRegister,
}) => {
  const { language, t } = useLanguage();
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = useMemo(() => {
    return delegations.filter((d) => {
      if (selectedCommitteeId !== 'all' && d.committee_id !== selectedCommitteeId) {
        return false;
      }
      if (statusFilter !== 'all' && d.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const countryMatch = d.country_name?.toLowerCase().includes(q) || d.country_code?.toLowerCase().includes(q);
        const committeeMatch = d.committee_name?.toLowerCase().includes(q) || d.committee_abbr?.toLowerCase().includes(q);
        const delegateMatch = d.delegate_name?.toLowerCase().includes(q) || d.delegate_school?.toLowerCase().includes(q);
        return countryMatch || committeeMatch || delegateMatch;
      }
      return true;
    });
  }, [delegations, selectedCommitteeId, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = delegations.length;
    const available = delegations.filter((d) => d.status === 'available').length;
    const assigned = delegations.filter((d) => d.status === 'assigned').length;
    return { total, available, assigned };
  }, [delegations]);

  return (
    <section id="delegaciones" className="py-24 bg-slate-100/60 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-3.5 py-1 rounded-full border border-blue-200 dark:border-blue-800/60">
            {t.delegations.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.delegations.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
            {t.delegations.subtitle}
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'en' ? 'Total delegations configured:' : 'Total cupos configurados:'}</span>
            <strong className="text-slate-900 dark:text-white font-bold">{stats.total}</strong>
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{language === 'en' ? 'Available seats:' : 'Cupos disponibles:'}</span>
            <strong className="font-bold">{stats.available}</strong>
          </div>
          <div className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs font-semibold flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{language === 'en' ? 'Assigned delegations:' : 'Delegaciones asignadas:'}</span>
            <strong className="font-bold">{stats.assigned}</strong>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t.delegations.search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Committee Select */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCommitteeId}
              onChange={(e) => setSelectedCommitteeId(e.target.value)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">{t.delegations.filter_all_committees}</option>
              {committees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.abbreviation} - {c.name.substring(0, 35)}...
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2.5 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">{t.delegations.filter_status_all}</option>
              <option value="available">🟢 {t.delegations.filter_status_free}</option>
              <option value="assigned">🔵 {t.delegations.filter_status_assigned}</option>
            </select>
          </div>
        </div>

        {/* Delegations Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 uppercase text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">{t.delegations.col_country}</th>
                  <th className="py-3.5 px-4">{t.delegations.col_committee}</th>
                  <th className="py-3.5 px-4">{t.delegations.col_status}</th>
                  <th className="py-3.5 px-4">{t.delegations.col_delegate}</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">{t.delegations.col_action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {language === 'en'
                        ? 'No delegations found matching the selected filters.'
                        : 'No se encontraron delegaciones que coincidan con los filtros.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((del) => {
                    const isAvailable = del.status === 'available';
                    return (
                      <tr key={del.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Country */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <span className="text-xl leading-none">{del.flag_emoji || '🏳️'}</span>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{del.country_name}</p>
                              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 dark:text-slate-500">
                                {del.country_code}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Committee */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-100 dark:border-blue-800/60">
                            {del.committee_abbr || del.committee_name}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isAvailable ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {t.delegations.status_free}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              {t.delegations.status_assigned}
                            </span>
                          )}
                        </td>

                        {/* Delegate */}
                        <td className="py-3.5 px-4">
                          {isAvailable ? (
                            <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                              {language === 'en' ? 'Unassigned' : 'Sin asignar todavía'}
                            </span>
                          ) : (
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {del.delegate_name || (language === 'en' ? 'Reserved delegate' : 'Delegado reservado')}
                              </p>
                              {del.delegate_school && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">{del.delegate_school}</p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          {isAvailable ? (
                            <a
                              href="#inscripciones"
                              onClick={() => {
                                if (onSelectDelegationForRegister && del.committee_name && del.country_name) {
                                  onSelectDelegationForRegister(del.committee_name, del.country_name);
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                            >
                              {t.delegations.apply_btn}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {language === 'en' ? 'Occupied' : 'Ocupada'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
