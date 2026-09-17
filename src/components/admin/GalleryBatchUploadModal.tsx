import React, { useState, useRef } from 'react';
import {
  Upload,
  Images,
  X,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  CheckCheck,
  AlertCircle,
  Sparkles,
  Layers,
  Link as LinkIcon,
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor.ts';

export interface PendingPhoto {
  tempId: string;
  file?: File;
  dataUrl: string;
  name: string;
  sizeKb: number;
  title: string;
  caption: string;
  category: string;
  edition: string;
  sort_order: number;
}

interface GalleryBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  currentEdition: string;
  authFetch: (url: string, options?: any) => Promise<any>;
  showStatus: (msg: string) => void;
  onUploadCompleted: () => void;
}

export const GalleryBatchUploadModal: React.FC<GalleryBatchUploadModalProps> = ({
  isOpen,
  onClose,
  categories,
  currentEdition,
  authFetch,
  showStatus,
  onUploadCompleted,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState({ current: 0, total: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'urls'>('files');
  const [urlInput, setUrlInput] = useState('');

  // Common batch settings
  const [commonCategory, setCommonCategory] = useState<string>(categories[0] || 'Debate');
  const [commonEdition, setCommonEdition] = useState<string>(currentEdition || 'BIMUN XXVII');
  const [commonBaseTitle, setCommonBaseTitle] = useState<string>('');
  const [commonCaption, setCommonCaption] = useState<string>('');
  const [newInlineCat, setNewInlineCat] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(false);

  if (!isOpen) return null;

  const handleProcessFiles = async (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Por favor selecciona archivos de imagen válidos (PNG, JPG, WEBP, etc.).');
      return;
    }

    setError(null);
    setIsCompressing(true);
    setCompressProgress({ current: 0, total: validFiles.length });

    const newPending: PendingPhoto[] = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setCompressProgress({ current: i + 1, total: validFiles.length });
      try {
        const compressed = await compressImage(file, 1600, 1200, 0.85);
        // Clean title from file name without extension
        const rawName = file.name.replace(/\.[^/.]+$/, '');
        const cleanName = rawName.replace(/[-_]/g, ' ');

        newPending.push({
          tempId: `pending_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          file,
          dataUrl: compressed.dataUrl,
          name: file.name,
          sizeKb: compressed.sizeKb,
          title: cleanName || `Fotografía BIMUN ${pendingPhotos.length + i + 1}`,
          caption: commonCaption || '',
          category: commonCategory || categories[0] || 'Debate',
          edition: commonEdition || currentEdition || 'BIMUN XXVII',
          sort_order: pendingPhotos.length + i + 1,
        });
      } catch (err: any) {
        console.warn(`Error optimizando ${file.name}:`, err.message);
      }
    }

    setPendingPhotos((prev) => [...prev, ...newPending]);
    setIsCompressing(false);
  };

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrls = () => {
    const urls = urlInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://'));

    if (urls.length === 0) {
      setError('Ingresa una o más URLs de imagen válidas (inician con http:// o https://).');
      return;
    }

    const newPending: PendingPhoto[] = urls.map((url, i) => ({
      tempId: `url_${Date.now()}_${i}`,
      dataUrl: url,
      name: `Imagen web ${pendingPhotos.length + i + 1}`,
      sizeKb: 0,
      title: commonBaseTitle ? `${commonBaseTitle} #${pendingPhotos.length + i + 1}` : `Fotografía BIMUN ${pendingPhotos.length + i + 1}`,
      caption: commonCaption || '',
      category: commonCategory || categories[0] || 'Debate',
      edition: commonEdition || currentEdition || 'BIMUN XXVII',
      sort_order: pendingPhotos.length + i + 1,
    }));

    setPendingPhotos((prev) => [...prev, ...newPending]);
    setUrlInput('');
    setError(null);
  };

  const handleRemovePhoto = (tempId: string) => {
    setPendingPhotos((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  const handleUpdatePhoto = (tempId: string, field: keyof PendingPhoto, value: any) => {
    setPendingPhotos((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p))
    );
  };

  // Batch application tools
  const applyCommonCategoryToAll = () => {
    setPendingPhotos((prev) => prev.map((p) => ({ ...p, category: commonCategory })));
    showStatus(`Categoría "${commonCategory}" aplicada a todas las fotos.`);
  };

  const applyCommonEditionToAll = () => {
    setPendingPhotos((prev) => prev.map((p) => ({ ...p, edition: commonEdition })));
    showStatus(`Edición "${commonEdition}" aplicada a todas.`);
  };

  const applyBaseTitleToAll = () => {
    if (!commonBaseTitle.trim()) return;
    setPendingPhotos((prev) =>
      prev.map((p, idx) => ({
        ...p,
        title: `${commonBaseTitle.trim()} #${idx + 1}`,
      }))
    );
    showStatus('Títulos numerados aplicados.');
  };

  const applyCommonCaptionToAll = () => {
    setPendingPhotos((prev) => prev.map((p) => ({ ...p, caption: commonCaption })));
    showStatus('Pie de foto aplicado a todas.');
  };

  const handleCreateInlineCategory = async () => {
    const trimmed = newInlineCat.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setCommonCategory(trimmed);
      setShowNewCatInput(false);
      setNewInlineCat('');
      return;
    }

    try {
      const updated = [...categories, trimmed];
      await authFetch('/api/admin/gallery/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updated }),
      });
      setCommonCategory(trimmed);
      setShowNewCatInput(false);
      setNewInlineCat('');
      showStatus(`Nueva categoría "${trimmed}" creada.`);
    } catch {
      setCommonCategory(trimmed);
      setShowNewCatInput(false);
    }
  };

  const handleSubmitBatch = async () => {
    if (pendingPhotos.length === 0) {
      setError('Agrega al menos una fotografía antes de guardar.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const photosPayload = pendingPhotos.map((p, idx) => ({
        title: p.title || `Fotografía BIMUN ${idx + 1}`,
        caption: p.caption || '',
        image_url: p.dataUrl,
        category: p.category || 'Debate',
        edition: p.edition || currentEdition || 'BIMUN XXVII',
        sort_order: p.sort_order || idx + 1,
      }));

      const res = await authFetch('/api/admin/gallery/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: photosPayload }),
      });

      if (res && typeof res.json === 'function') {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Error al subir las fotografías en lote.');
        }
      } else if (res && res.error) {
        throw new Error(res.error);
      }

      showStatus(`¡Éxito! Se publicaron ${photosPayload.length} fotos en la galería.`);
      onUploadCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al subir las fotografías en lote.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                Subir Múltiples Fotografías a la Galería
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-300 font-normal">
                  Carga en Lote
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona varios archivos o pega URLs para procesarlos y publicarlos todos al tiempo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'files' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Desde mi equipo (Archivos múltiples)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('urls')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'urls' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Pegar lista de URLs</span>
            </button>
          </div>

          {/* Upload Input Area */}
          {activeTab === 'files' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFilesSelect}
              />
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Haz clic para seleccionar múltiples fotos o arrástralas aquí
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Puedes seleccionar decenas de imágenes simultáneamente. Serán optimizadas automáticamente en formato WebP.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-xs font-semibold text-slate-300">
                Pega URLs de imágenes (una por línea)
              </label>
              <textarea
                rows={3}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://ejemplo.com/foto1.jpg&#10;https://ejemplo.com/foto2.jpg"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddUrls}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar URLs a la lista</span>
              </button>
            </div>
          )}

          {/* Compressing indicator */}
          {isCompressing && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Optimizando imágenes para la web ({compressProgress.current} de {compressProgress.total})...</span>
              </div>
              <span className="font-mono font-bold">
                {Math.round((compressProgress.current / compressProgress.total) * 100)}%
              </span>
            </div>
          )}

          {/* Global Batch Controls Bar */}
          {pendingPhotos.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Ajustes Rápidos para Todas las Fotos ({pendingPhotos.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPendingPhotos([])}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpiar todas</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category Apply */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400">Categoría Masiva</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      + Nueva
                    </button>
                  </div>
                  {showNewCatInput ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newInlineCat}
                        onChange={(e) => setNewInlineCat(e.target.value)}
                        placeholder="Nombre..."
                        className="flex-1 px-2 py-1 rounded-lg bg-slate-900 border border-blue-500 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreateInlineCategory}
                        className="px-2 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <select
                        value={commonCategory}
                        onChange={(e) => setCommonCategory(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={applyCommonCategoryToAll}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 shrink-0"
                        title="Aplicar esta categoría a todas las fotos"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>

                {/* Edition Apply */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Edición BIMUN</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={commonEdition}
                      onChange={(e) => setCommonEdition(e.target.value)}
                      placeholder="BIMUN XXVII"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={applyCommonEditionToAll}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 shrink-0"
                      title="Aplicar esta edición a todas"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Base title Apply */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Título Base (Auto-numerado)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={commonBaseTitle}
                      onChange={(e) => setCommonBaseTitle(e.target.value)}
                      placeholder="Ej: Plenaria General"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={applyBaseTitleToAll}
                      disabled={!commonBaseTitle.trim()}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-200 shrink-0"
                      title="Asignar #1, #2... a cada foto"
                    >
                      Aplicar #
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pending Photos Grid */}
          {pendingPhotos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold">
                  Fotos listas para publicar ({pendingPhotos.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Puedes personalizar el título y categoría de cada una de manera individual
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {pendingPhotos.map((photo, index) => (
                  <div
                    key={photo.tempId}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2 relative group hover:border-slate-700 transition-colors"
                  >
                    <div className="relative h-28 rounded-lg overflow-hidden bg-black">
                      <img
                        src={photo.dataUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-300 font-mono">
                        {photo.sizeKb > 0 ? `${photo.sizeKb} KB` : 'Web'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.tempId)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-rose-400 hover:bg-rose-900 transition-colors"
                        title="Quitar foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-bold">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[10px] text-slate-400">Título de la Foto</label>
                        <input
                          type="text"
                          value={photo.title}
                          onChange={(e) => handleUpdatePhoto(photo.tempId, 'title', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                          placeholder="Título descriptivo"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[10px] text-slate-400">Categoría</label>
                          <select
                            value={photo.category}
                            onChange={(e) => handleUpdatePhoto(photo.tempId, 'category', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">Edición</label>
                          <input
                            type="text"
                            value={photo.edition}
                            onChange={(e) => handleUpdatePhoto(photo.tempId, 'edition', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {pendingPhotos.length > 0 ? (
              <span className="text-emerald-400 font-semibold">
                ✓ {pendingPhotos.length} {pendingPhotos.length === 1 ? 'foto lista' : 'fotos listas'} para ser guardadas
              </span>
            ) : (
              <span>Selecciona o arrastra imágenes para comenzar</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmitBatch}
              disabled={isUploading || pendingPhotos.length === 0}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publicando {pendingPhotos.length} fotos...</span>
                </>
              ) : (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>Publicar {pendingPhotos.length} Fotografías</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
