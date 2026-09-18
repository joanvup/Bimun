import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface DocumentCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  onCategoriesUpdated: () => void;
  authFetch: (url: string, options?: any) => Promise<any>;
  showStatus: (msg: string) => void;
}

export const DocumentCategoryManagerModal: React.FC<DocumentCategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  categoryCounts,
  onCategoriesUpdated,
  authFetch,
  showStatus,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sendCategoriesRequest = async (payload: any) => {
    const res = await authFetch('/api/admin/documents/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res && typeof res.json === 'function') {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar solicitud');
      }
      return data;
    }
    if (res && res.error) throw new Error(res.error);
    return res;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setError(`La categoría "${trimmed}" ya existe.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = [...categories, trimmed];
      await sendCategoriesRequest({ categories: updated });
      setNewCatName('');
      showStatus(`Categoría "${trimmed}" añadida exitosamente.`);
      onCategoriesUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al agregar categoría.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (cat: string) => {
    setEditingCat(cat);
    setEditingName(cat);
    setError(null);
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCat(null);
      return;
    }

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
      setError(`Ya existe otra categoría llamada "${trimmed}".`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = categories.map((c) => (c === oldName ? trimmed : c));
      await sendCategoriesRequest({
        categories: updated,
        renameFrom: oldName,
        renameTo: trimmed,
      });
      setEditingCat(null);
      showStatus(`Categoría renombrada a "${trimmed}".`);
      onCategoriesUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al renombrar categoría.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (cat: string) => {
    const availableFallbacks = categories.filter((c) => c !== cat);
    setDeletingCat(cat);
    setReassignTo(availableFallbacks[0] || 'Protocolo');
    setError(null);
  };

  const handleExecuteDelete = async () => {
    if (!deletingCat) return;
    if (categories.length <= 1) {
      setError('Debe existir al menos una categoría en el sistema.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = categories.filter((c) => c !== deletingCat);
      await sendCategoriesRequest({
        categories: updated,
        deleteCategory: deletingCat,
        reassignTo: reassignTo || updated[0],
      });
      setDeletingCat(null);
      showStatus(`Categoría "${deletingCat}" eliminada.`);
      onCategoriesUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar categoría.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    const defaultCats = ['Protocolo', 'Académico', 'Plantillas', 'Inscripción', 'Normativa'];
    setIsSaving(true);
    setError(null);
    try {
      await sendCategoriesRequest({ categories: defaultCats });
      setShowResetConfirm(false);
      showStatus('Categorías restablecidas a las opciones predeterminadas.');
      onCategoriesUpdated();
    } catch (err: any) {
      setError(err.message || 'Error al restablecer categorías.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" id="doc-category-manager-modal">
      <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">Editar Categorías de Documentos</h3>
              <p className="text-[11px] text-slate-400">Crea, edita o elimina las categorías utilizadas para ordenar archivos PDF.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Nueva categoría (ej. Reglamentos, Guías)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              disabled={isSaving}
            />
            <button
              type="submit"
              disabled={isSaving || !newCatName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Categorías Existentes</p>
            <div className="border border-slate-800 rounded-xl divide-y divide-slate-850 overflow-hidden bg-slate-950/40">
              {categories.map((cat) => {
                const docCount = categoryCounts[cat] || 0;
                const isEditing = editingCat === cat;

                return (
                  <div key={cat} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors">
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 bg-slate-950 border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(cat)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                          title="Guardar nombre"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCat(null)}
                          className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-200 truncate">{cat}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800/60">
                            {docCount} {docCount === 1 ? 'archivo' : 'archivos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditing(cat)}
                            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                            title="Renombrar categoría"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(cat)}
                            className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-end pt-2 border-t border-slate-850">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-amber-400">¿Estás seguro? Se perderán las personalizaciones.</span>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  Sí, restablecer
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer predeterminadas
              </button>
            )}
          </div>
        </div>

        {/* Reassignment / Delete Confirmation section */}
        {deletingCat && (
          <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">¿Eliminar la categoría "{deletingCat}"?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Hay <strong className="text-slate-200">{categoryCounts[deletingCat] || 0} documentos</strong> clasificados en esta categoría. Para continuar sin perderlos, por favor seleccione una categoría de destino para reubicarlos:
                </p>
              </div>
            </div>

            {categories.filter((c) => c !== deletingCat).length > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-slate-400 truncate shrink-0">Reasignar a:</div>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {categories
                    .filter((c) => c !== deletingCat)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c} (tiene {categoryCounts[c] || 0} docs)
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-900 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar y Reasignar
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Cerrar Administrador
          </button>
        </div>
      </div>
    </div>
  );
};
