import React, { useState, useEffect } from 'react';
import {
  X, Globe, Target, BookOpen, Award, Clock, Compass, Shield, Sparkles, Check, Info
} from 'lucide-react';
import { AboutSection } from '../../types.ts';

interface AboutEditModalProps {
  section: Partial<AboutSection> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AboutSection>) => Promise<void>;
  isSaving: boolean;
}

const AVAILABLE_ICONS = [
  { value: 'Globe', label: 'Globo / MUN', icon: Globe },
  { value: 'Target', label: 'Diana / Objetivos', icon: Target },
  { value: 'BookOpen', label: 'Libro / Metodología', icon: BookOpen },
  { value: 'Award', label: 'Medalla / Beneficios', icon: Award },
  { value: 'Clock', label: 'Reloj / Historia', icon: Clock },
  { value: 'Compass', label: 'Brújula / Misión & Visión', icon: Compass },
  { value: 'Shield', label: 'Escudo / Seguridad Diplomática', icon: Shield },
  { value: 'Sparkles', label: 'Destello / Innovación', icon: Sparkles },
];

export const AboutEditModal: React.FC<AboutEditModalProps> = ({
  section,
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  if (!isOpen || !section) return null;

  const isEditing = Boolean(section.id);
  const [title, setTitle] = useState(section.title || '');
  const [subtitle, setSubtitle] = useState(section.subtitle || '');
  const [sectionKey, setSectionKey] = useState(section.section_key || '');
  const [content, setContent] = useState(section.content || '');
  const [icon, setIcon] = useState(section.icon || 'Globe');
  const [sortOrder, setSortOrder] = useState(section.sort_order || 1);
  const [isActive, setIsActive] = useState(section.is_active !== undefined ? Boolean(section.is_active) : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (section) {
      setTitle(section.title || '');
      setSubtitle(section.subtitle || '');
      setSectionKey(section.section_key || '');
      setContent(section.content || '');
      setIcon(section.icon || 'Globe');
      setSortOrder(section.sort_order || 1);
      setIsActive(section.is_active !== undefined ? Boolean(section.is_active) : true);
      setError(null);
    }
  }, [section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la sección es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setError('El contenido de la sección no puede estar vacío.');
      return;
    }

    try {
      setError(null);
      await onSave({
        ...(section.id ? { id: section.id } : {}),
        section_key: sectionKey.trim().toLowerCase().replace(/\s+/g, '_') || undefined,
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
        icon,
        sort_order: Number(sortOrder),
        is_active: isActive ? 1 : 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la sección.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              {isEditing ? 'Editar Sección Institucional' : 'Nueva Sección Institucional'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configura los textos formativos y metodológicos mostrados a los delegados.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title and Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Título Oficial <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: ¿Qué es el BIMUN?"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-white placeholder-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Subtítulo o Frase Resumen</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: Simulación académica y diplomática internacional"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Section Key and Sort Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Clave Identificadora (Slug)
              </label>
              <input
                type="text"
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                placeholder="Ej: que_es_mun, objetivos, protocolo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-blue-400 font-mono placeholder-slate-600"
              />
              <p className="text-[10px] text-slate-500">Identificador técnico sin espacios ni tildes.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Orden Numérico</label>
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-white"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Icono Representativo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((ic) => {
                const IconComponent = ic.icon;
                const isSelected = icon.toLowerCase() === ic.value.toLowerCase();
                return (
                  <button
                    key={ic.value}
                    type="button"
                    onClick={() => setIcon(ic.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium border transition text-left ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500 shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{ic.label.split(' / ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200">Publicar en la Página Web</span>
              <p className="text-[11px] text-slate-400">Si está inactiva, solo será visible para el equipo administrativo.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isActive ? 'Publicado (Activo)' : 'Borrador (Oculto)'}
            </button>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Texto Institucional Completo <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">{content.length} caracteres</span>
            </div>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe los párrafos institucionales. Puedes usar enumeraciones (1., 2.) o saltos de línea para estructurar la lectura."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-blue-500 text-xs text-slate-200 leading-relaxed placeholder-slate-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Guardando...' : isEditing ? 'Actualizar Sección' : 'Crear Sección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
