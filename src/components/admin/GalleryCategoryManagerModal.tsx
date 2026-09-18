import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, AlertCircle, ArrowRight, RotateCcw, FolderPlus } from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal.tsx';

interface GalleryCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  onCategoriesUpdated: () => void;
  authFetch: (url: string, options?: any) => Promise<any>;
  showStatus: (msg: string) => void;
}

export const GalleryCategoryManagerModal: React.FC<GalleryCategoryManagerModalProps> = ({
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
    const res = await authFetch('/api/admin/gallery/categories', {
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
    const count = categoryCounts[cat] || 0;
    const availableFallbacks = categories.filter((c) => c !== cat);
    setDeletingCat(cat);
    setReassignTo(availableFallbacks[0] || 'Debate');
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
    const defaultCats = [
      'Debate',
      'Protocolo',
      'Negociación',
      'Crisis',
      'Premiación',
      'Campus',
      'Social',
      'Inauguración',
      'Clausura',
    ];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">Personalizar Categorías de Galería</h3>
              <p className="text-[11px] text-slate-400">Crea, renombra o reordena las temáticas para clasificar fotografías.</p>
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
              value={newCatName}
              onChange={(e) => {
                setNewCatName(e.target.value);
                setError(null);
              }}
              placeholder="Nueva categoría (ej: Prensa & Medios, Alianzas, Cultural)"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              maxLength={40}
            />
            <button
              type="submit"
              disabled={isSaving || !newCatName.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </form>

          {/* Delete confirmation alert if active */}
          {deletingCat && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2 text-amber-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">¿Eliminar categoría "{deletingCat}"?</p>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Esta categoría tiene <span className="font-bold text-amber-200">{categoryCounts[deletingCat] || 0}</span> fotografía(s) asociada(s). Selecciona a qué categoría reasignarlas:
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Reasignar fotos a:</span>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                >
                  {categories
                    .filter((c) => c !== deletingCat)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  disabled={isSaving}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-[11px] text-white font-bold"
                >
                  Confirmar Eliminación
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Categorías Activas ({categories.length})</span>
              <span className="text-[10px] text-slate-500">Haz clic en editar o eliminar</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isEditingThis = editingCat === cat;

                return (
                  <div
                    key={cat}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    {isEditingThis ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-blue-500 text-xs text-white focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(cat);
                            if (e.key === 'Escape') setEditingCat(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(cat)}
                          className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                          title="Guardar nombre"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCat(null)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">{cat}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400">
                            {count} {count === 1 ? 'foto' : 'fotos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditing(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Renombrar categoría"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(cat)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isSaving}
            className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer predeterminadas</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetDefaults}
        isDeleting={isSaving}
        title="¿Restablecer Categorías Predeterminadas?"
        itemName="Categorías oficiales BIMUN"
        description="Se restablecerán las categorías oficiales por defecto (Debate, Protocolo, Negociación, Crisis, Premiación, Campus, Social, Inauguración, Clausura). Esta acción reorganizará la lista de categorías."
        confirmButtonText="Restablecer Categorías"
      />
    </div>
  );
};
