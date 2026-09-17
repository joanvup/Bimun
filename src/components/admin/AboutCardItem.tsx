import React, { useState, useEffect } from 'react';
import {
  Globe, Target, BookOpen, Award, Clock, Compass, Shield, Sparkles,
  Save, Trash2, Eye, EyeOff, Edit3, Check, RefreshCw
} from 'lucide-react';
import { AboutSection } from '../../types.ts';

interface AboutCardItemProps {
  section: AboutSection;
  canEdit: boolean;
  isSaving: boolean;
  onSave: (updated: Partial<AboutSection>) => Promise<void>;
  onEditModal: () => void;
  onDelete: () => void;
}

export const AboutCardItem: React.FC<AboutCardItemProps> = ({
  section,
  canEdit,
  isSaving,
  onSave,
  onEditModal,
  onDelete,
}) => {
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle || '');
  const [content, setContent] = useState(section.content);
  const [icon, setIcon] = useState(section.icon || 'Globe');
  const [sortOrder, setSortOrder] = useState(section.sort_order || 0);
  const [isActive, setIsActive] = useState(Boolean(section.is_active));
  const [showPreview, setShowPreview] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Sync state if prop changes
  useEffect(() => {
    setTitle(section.title);
    setSubtitle(section.subtitle || '');
    setContent(section.content);
    setIcon(section.icon || 'Globe');
    setSortOrder(section.sort_order || 0);
    setIsActive(Boolean(section.is_active));
  }, [section]);

  const isDirty =
    title !== section.title ||
    subtitle !== (section.subtitle || '') ||
    content !== section.content ||
    icon !== (section.icon || 'Globe') ||
    sortOrder !== (section.sort_order || 0) ||
    isActive !== Boolean(section.is_active);

  const getSectionIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'target':
        return <Target className="w-5 h-5 text-emerald-400" />;
      case 'bookopen':
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
      case 'award':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'clock':
        return <Clock className="w-5 h-5 text-purple-400" />;
      case 'compass':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-rose-400" />;
      default:
        return <Globe className="w-5 h-5 text-blue-400" />;
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    await onSave({
      id: section.id,
      title: title.trim(),
      subtitle: subtitle.trim(),
      content: content.trim(),
      icon,
      sort_order: Number(sortOrder),
      is_active: isActive ? 1 : 0,
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        isDirty
          ? 'bg-slate-900/90 border-blue-500/50 shadow-lg shadow-blue-500/5'
          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
      } p-5 space-y-4`}
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            {getSectionIcon(icon)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                {section.section_key}
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {isActive ? 'Publicado' : 'Oculto'}
              </span>
            </div>
            <h3 className="font-display text-base font-bold text-white mt-1">{section.title}</h3>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400">Orden:</span>
            <input
              type="number"
              disabled={!canEdit}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-12 text-center text-xs font-mono font-bold bg-slate-950 border border-slate-700 rounded-lg text-white py-0.5"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isActive
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
            >
              {isActive ? 'Visible' : 'Oculto'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-xl text-xs font-medium border transition ${
              showPreview
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title="Alternar vista previa"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={onEditModal}
              className="p-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Configuración avanzada"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-rose-950/40 text-rose-400 border border-slate-800 hover:border-rose-800/50 transition"
              title="Eliminar sección"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editable Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Título de la Sección
          </label>
          <input
            type="text"
            disabled={!canEdit}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-white placeholder-slate-500"
            placeholder="Título oficial"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Subtítulo / Bajada Descriptiva
          </label>
          <input
            type="text"
            disabled={!canEdit}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-white placeholder-slate-500"
            placeholder="Subtítulo complementario"
          />
        </div>
      </div>

      {/* Content Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Contenido Oficial (Párrafos o listas numeradas 1., 2.)
          </label>
          <span className="text-[10px] text-slate-500">{content.length} caracteres</span>
        </div>
        <textarea
          rows={5}
          disabled={!canEdit}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe aquí el texto oficial..."
          className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 text-xs text-slate-200 leading-relaxed font-sans"
        />
      </div>

      {/* Live Preview Toggle View */}
      {showPreview && (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold text-[11px]">
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            Vista previa aproximada para los delegados:
          </div>
          <div className="p-4 rounded-xl bg-white text-slate-900 space-y-2 shadow-sm">
            <h4 className="font-bold text-sm text-slate-900">{title || 'Sin título'}</h4>
            {subtitle && <p className="text-xs text-blue-700 font-medium">{subtitle}</p>}
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-2">
              {content || 'Sin contenido aún...'}
            </div>
          </div>
        </div>
      )}

      {/* Footer / Action Bar */}
      {canEdit && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Hay cambios sin guardar
              </span>
            )}
            {justSaved && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> ¡Guardado exitosamente!
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
