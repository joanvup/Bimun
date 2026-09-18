import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  Trash2,
  ShieldCheck,
  FileJson,
  Layers,
  Users,
  Image as ImageIcon,
  Video,
  FileText,
  Clock,
  ArrowRight,
  Info,
  RefreshCw,
  FolderArchive,
  Award,
} from 'lucide-react';
import { BIMUNSettings } from '../../types.ts';

interface EditionArchive {
  id: string;
  edition_name: string;
  edition_year: string;
  title: string;
  description?: string;
  total_delegates: number;
  total_committees: number;
  total_photos: number;
  created_by: string;
  created_at: string;
}

interface EditionsAndBackupsSectionProps {
  token: string;
  settings: BIMUNSettings | null;
  onStatusMessage: (text: string, type?: 'success' | 'error') => void;
  onDataUpdated: () => void;
}

export const EditionsAndBackupsSection: React.FC<EditionsAndBackupsSectionProps> = ({
  token,
  settings,
  onStatusMessage,
  onDataUpdated,
}) => {
  const [archives, setArchives] = useState<EditionArchive[]>([]);
  const [loadingArchives, setLoadingArchives] = useState(false);

  // Snapshot modal
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [savingSnapshot, setSavingSnapshot] = useState(false);

  // Restore modal
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreFilePayload, setRestoreFilePayload] = useState<any | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Year Wizard modal
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [newEditionName, setNewEditionName] = useState('');
  const [newEditionYear, setNewEditionYear] = useState('');
  const [newDates, setNewDates] = useState('');
  const [newSlogan, setNewSlogan] = useState('');
  const [archiveCurrent, setArchiveCurrent] = useState(true);
  const [resetRegistrations, setResetRegistrations] = useState(true);
  const [resetDelegations, setResetDelegations] = useState(true);
  const [resetSchedule, setResetSchedule] = useState(true);
  const [retainCommittees, setRetainCommittees] = useState(true);
  const [retainCountries, setRetainCountries] = useState(true);
  const [retainGallery, setRetainGallery] = useState(true);
  const [retainTeam, setRetainTeam] = useState(true);

  // Delete archive modal
  const [deletingArchiveId, setDeletingArchiveId] = useState<string | null>(null);

  // Direct restore archive modal
  const [restoreArchiveTarget, setRestoreArchiveTarget] = useState<EditionArchive | null>(null);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  };

  const loadArchives = async () => {
    try {
      setLoadingArchives(true);
      const res = await authFetch('/api/admin/editions/history');
      if (res.ok) {
        const data = await res.json();
        setArchives(data);
      }
    } catch (err: any) {
      console.error('Error cargando historial de respaldos:', err);
    } finally {
      setLoadingArchives(false);
    }
  };

  useEffect(() => {
    loadArchives();
  }, []);

  // Pre-fill next edition defaults when opening wizard
  const handleOpenWizard = () => {
    const curEdition = settings?.bimun_name || 'BIMUN XXVI';
    const curYear = new Date().getFullYear();
    // Try to guess next roman numeral or number
    let nextName = 'BIMUN XXVII';
    if (curEdition.includes('XXVI')) nextName = 'BIMUN XXVII';
    else if (curEdition.includes('XXVII')) nextName = 'BIMUN XXVIII';
    else if (curEdition.includes('XXVIII')) nextName = 'BIMUN XXIX';
    else nextName = `${curEdition} (Nueva Edición)`;

    setNewEditionName(nextName);
    setNewEditionYear((curYear + 1).toString());
    setNewDates(`24 al 26 de Septiembre, ${curYear + 1}`);
    setNewSlogan(settings?.hero_slogan || 'Liderazgo, Diplomacia y Excelencia Académica');
    setWizardStep(1);
    setWizardOpen(true);
  };

  // Export full backup file download
  const handleDownloadFullBackup = async () => {
    try {
      onStatusMessage('Generando archivo de copia de seguridad integral...');
      const res = await authFetch('/api/admin/backups/export');
      if (!res.ok) throw new Error('Error al generar respaldo en el servidor.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const editionTag = (settings?.bimun_name || 'BIMUN').replace(/\s+/g, '_');
      a.download = `${editionTag}_backup_completo_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      onStatusMessage('¡Copia de seguridad descargada exitosamente!', 'success');
    } catch (err: any) {
      onStatusMessage(err.message || 'Error al descargar respaldo', 'error');
    }
  };

  // Create manual snapshot in server
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotTitle.trim()) return;
    setSavingSnapshot(true);
    try {
      const res = await authFetch('/api/admin/editions/create-snapshot', {
        method: 'POST',
        body: JSON.stringify({
          editionName: settings?.bimun_name || 'BIMUN',
          editionYear: new Date().getFullYear().toString(),
          title: snapshotTitle.trim(),
          description: snapshotDesc.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onStatusMessage('¡Copia de seguridad archivada con éxito en el servidor!', 'success');
        setSnapshotModalOpen(false);
        setSnapshotTitle('');
        setSnapshotDesc('');
        loadArchives();
      } else {
        throw new Error(data.error || 'Error al crear copia');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setSavingSnapshot(false);
    }
  };

  // Handle file select for JSON restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.tables) {
          throw new Error('El archivo no tiene el formato esperado de respaldo BIMUN.');
        }
        setRestoreFilePayload(json);
        setRestoreModalOpen(true);
      } catch (err: any) {
        onStatusMessage(`Archivo inválido: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };

  // Execute restore from file payload
  const handleExecuteRestore = async () => {
    if (!restoreFilePayload) return;
    setRestoreLoading(true);
    try {
      const res = await authFetch('/api/admin/backups/restore', {
        method: 'POST',
        body: JSON.stringify(restoreFilePayload),
      });
      const data = await res.json();
      if (res.ok) {
        onStatusMessage('¡Restauración de datos y contenidos completada con éxito!', 'success');
        setRestoreModalOpen(false);
        setRestoreFilePayload(null);
        onDataUpdated();
        loadArchives();
      } else {
        throw new Error(data.error || 'Error al restaurar respaldo');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setRestoreLoading(false);
    }
  };

  // Execute restore from server archive target
  const handleExecuteRestoreArchive = async () => {
    if (!restoreArchiveTarget) return;
    setRestoreLoading(true);
    try {
      const res = await authFetch(`/api/admin/editions/restore-archive/${restoreArchiveTarget.id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        onStatusMessage(`¡Edición ${restoreArchiveTarget.edition_name} restaurada con éxito!`, 'success');
        setRestoreArchiveTarget(null);
        onDataUpdated();
        loadArchives();
      } else {
        throw new Error(data.error || 'Error al restaurar edición');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setRestoreLoading(false);
    }
  };

  // Delete archive
  const handleDeleteArchive = async () => {
    if (!deletingArchiveId) return;
    try {
      const res = await authFetch(`/api/admin/editions/archive/${deletingArchiveId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onStatusMessage('Respaldo eliminado del historial.', 'success');
        setDeletingArchiveId(null);
        loadArchives();
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    }
  };

  // Download specific archive snapshot JSON
  const handleDownloadArchiveJson = async (archive: EditionArchive) => {
    try {
      const res = await authFetch(`/api/admin/editions/archive-download/${archive.id}`);
      if (!res.ok) throw new Error('Error al descargar archivo histórico.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${archive.edition_name.replace(/\s+/g, '_')}_${archive.edition_year}_backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    }
  };

  // Submit New Year Transition
  const handleStartNewYear = async () => {
    if (!newEditionName.trim() || !newEditionYear.trim()) {
      onStatusMessage('Por favor completa el nombre y el año del nuevo modelo.', 'error');
      return;
    }
    setWizardLoading(true);
    try {
      const res = await authFetch('/api/admin/editions/start-new', {
        method: 'POST',
        body: JSON.stringify({
          newEditionName: newEditionName.trim(),
          newEditionYear: newEditionYear.trim(),
          newDates: newDates.trim(),
          newSlogan: newSlogan.trim(),
          archiveCurrentEdition: archiveCurrent,
          archiveTitle: `Memoria Histórica de ${settings?.bimun_name || 'BIMUN Anterior'}`,
          archiveDescription: `Respaldo automático generado antes de iniciar ${newEditionName.trim()} (${newEditionYear.trim()}).`,
          resetRegistrations,
          resetDelegationStatus: resetDelegations,
          resetSchedule,
          retainCommittees,
          retainCountries,
          retainGalleryHistory: retainGallery,
          retainTeam,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onStatusMessage(`¡Bienvenido a ${newEditionName}! La transición anual se completó satisfactoriamente.`, 'success');
        setWizardOpen(false);
        onDataUpdated();
        loadArchives();
      } else {
        throw new Error(data.error || 'Error en la transición anual');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setWizardLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-800/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Ciclo Anual de Modelos & Respaldos
              </span>
              <span className="text-xs text-slate-400">Plataforma BIMUN</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <span>Edición Activa:</span>
              <span className="text-blue-400 font-extrabold">{settings?.bimun_name || 'BIMUN XXVI'}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Guarda copias de seguridad de todo el contenido del sitio (incluyendo fotografías, videos catalogados, comisiones, países, inscripciones y configuraciones) o inicia un nuevo modelo MUN para el siguiente año preservando el archivo histórico.
            </p>
          </div>

          <button
            onClick={handleOpenWizard}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 self-start md:self-auto shrink-0 transition-all hover:scale-102 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Iniciar Nuevo Modelo MUN (Siguiente Año)</span>
          </button>
        </div>

        {/* Quick stats row */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Fechas del Evento</div>
              <div className="text-slate-200 font-medium truncate">{settings?.event_dates || 'Sin definir'}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Archivos Multimedia</div>
              <div className="text-slate-200 font-medium">Fotos, Videos & Docs</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <History className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Respaldos en Servidor</div>
              <div className="text-slate-200 font-medium">{archives.length} guardados</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Integridad</div>
              <div className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sistema Listo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions Grid: 2 Columns (Backup Export / Restore) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backup & Export */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Descargar Copia de Seguridad</h3>
                <p className="text-[11px] text-slate-400">Exporta la totalidad de la plataforma a tu computador.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Genera un archivo <strong>JSON integral</strong> con todos los datos relacionales, el catálogo de fotos de la galería (con enlaces y categorías), enlaces de videos institucionales, actas, resoluciones, comisiones y delegados.
            </p>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] space-y-1 text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Incluye en el respaldo:</span>
              </div>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 pl-5 list-disc text-slate-400 text-[10px]">
                <li>Galería de fotos completa</li>
                <li>Catálogo de enlaces a videos</li>
                <li>Comisiones y directivas</li>
                <li>Matriz de países y cupos</li>
                <li>Inscripciones de delegados</li>
                <li>Cronograma y actividades</li>
                <li>Documentos y guías PDF</li>
                <li>Ajustes de evento y textos</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2.5">
            <button
              onClick={handleDownloadFullBackup}
              className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo (.json)</span>
            </button>

            <button
              onClick={() => {
                setSnapshotTitle(`Respaldo ${settings?.bimun_name || 'BIMUN'} - ${new Date().toLocaleDateString()}`);
                setSnapshotDesc(`Copia manual del estado actual.`);
                setSnapshotModalOpen(true);
              }}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Guardar instantánea en el servidor"
            >
              <Save className="w-4 h-4 text-blue-400" />
              <span>Guardar en Servidor</span>
            </button>
          </div>
        </div>

        {/* Card 2: Restore from Backup */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Restaurar Copia de Seguridad</h3>
                <p className="text-[11px] text-slate-400">Recupera contenidos y configuraciones desde un archivo JSON.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Carga un archivo de respaldo generado previamente para restaurar el contenido completo del sitio. El sistema verificará la estructura del archivo antes de aplicar los cambios.
            </p>

            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-center space-y-2 hover:border-blue-500/50 transition-colors">
              <FileJson className="w-8 h-8 mx-auto text-blue-400/60" />
              <div className="text-xs text-slate-300 font-medium">Selecciona o arrastra el archivo de respaldo</div>
              <div className="text-[10px] text-slate-500">Formatos soportados: archivos .json exportados por BIMUN</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Cargar Archivo de Respaldo (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Historical Archives on Server */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Memorias de Ediciones & Respaldos en el Servidor</h3>
          </div>
          <button
            onClick={loadArchives}
            disabled={loadingArchives}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingArchives ? 'animate-spin' : ''}`} />
            <span>Actualizar Lista</span>
          </button>
        </div>

        {loadingArchives ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Cargando respaldos archivados...</span>
          </div>
        ) : archives.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <FolderArchive className="w-10 h-10 mx-auto text-slate-600" />
            <div className="text-xs text-slate-400 font-semibold">No hay respaldos archivados aún en el servidor</div>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Puedes crear una copia manual en cualquier momento usando el botón "Guardar en Servidor" o dejar que el asistente de "Nuevo Modelo MUN" cree una automáticamente antes de cada ciclo anual.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {archives.map((arch) => (
              <div
                key={arch.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {arch.edition_name} ({arch.edition_year})
                    </span>
                    <span className="text-xs font-bold text-white">{arch.title}</span>
                  </div>

                  {arch.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">{arch.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(arch.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span>• Creado por: {arch.created_by}</span>
                    <span>• {arch.total_committees} comisiones</span>
                    <span>• {arch.total_delegates} delegados</span>
                    <span>• {arch.total_photos} fotos</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => handleDownloadArchiveJson(arch)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Descargar copia JSON de este archivo"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Descargar</span>
                  </button>

                  <button
                    onClick={() => setRestoreArchiveTarget(arch)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Restaurar esta edición como activa"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    onClick={() => setDeletingArchiveId(arch.id)}
                    className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/30 transition-colors cursor-pointer"
                    title="Eliminar este respaldo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Save Manual Snapshot to Server */}
      {snapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-blue-400" />
                <span>Guardar Respaldo en Servidor</span>
              </h3>
              <button
                onClick={() => setSnapshotModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Título del Respaldo *</label>
                <input
                  type="text"
                  required
                  value={snapshotTitle}
                  onChange={(e) => setSnapshotTitle(e.target.value)}
                  placeholder="Ej: Respaldo Pre-Clausura 2026"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Descripción u Observaciones</label>
                <textarea
                  rows={3}
                  value={snapshotDesc}
                  onChange={(e) => setSnapshotDesc(e.target.value)}
                  placeholder="Detalles adicionales sobre este punto de restauración..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                Se guardará una copia idéntica del estado actual de <strong>{settings?.bimun_name || 'BIMUN'}</strong> con todos sus registros, fotografías, delegaciones y configuraciones.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSnapshotModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSnapshot}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingSnapshot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Guardar Copia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Inspect & Confirm File Restore */}
      {restoreModalOpen && restoreFilePayload && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Confirmar Restauración de Copia de Seguridad</span>
              </h3>
              <button
                onClick={() => {
                  setRestoreModalOpen(false);
                  setRestoreFilePayload(null);
                }}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed">
                <strong>Atención:</strong> Esta operación reemplazará los datos actuales con el contenido del archivo de respaldo seleccionado. Los usuarios y contraseñas administrativas se preservarán para mantener el acceso seguro.
              </div>
            </div>

            {/* Inspection details */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">Detalles del Respaldo:</div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Edición:</span>
                  <span className="text-white font-semibold">{restoreFilePayload.metadata?.edition || 'No especificada'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Año:</span>
                  <span className="text-white font-semibold">{restoreFilePayload.metadata?.year || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha de Exportación:</span>
                  <span className="text-white font-semibold">
                    {restoreFilePayload.metadata?.exported_at
                      ? new Date(restoreFilePayload.metadata.exported_at).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Exportado por:</span>
                  <span className="text-white font-semibold">{restoreFilePayload.metadata?.exported_by || 'Sistema'}</span>
                </div>
              </div>
            </div>

            {/* Record counts */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-300">Resumen de Contenidos a Restaurar:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Comisiones:</span>
                  <strong>{restoreFilePayload.tables?.committees?.length || 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Países:</span>
                  <strong>{restoreFilePayload.tables?.countries?.length || 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Delegaciones:</span>
                  <strong>{restoreFilePayload.tables?.delegations?.length || 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Inscripciones:</span>
                  <strong>{restoreFilePayload.tables?.registrations?.length || 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Fotos Galería:</span>
                  <strong>{restoreFilePayload.tables?.gallery?.length || 0}</strong>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px]">Documentos:</span>
                  <strong>{restoreFilePayload.tables?.documents?.length || 0}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRestoreModalOpen(false);
                  setRestoreFilePayload(null);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={restoreLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {restoreLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Confirmar y Restaurar Datos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Direct Server Archive Restore Confirmation */}
      {restoreArchiveTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Restaurar esta Edición?</h3>
                <p className="text-xs text-slate-400">{restoreArchiveTarget.edition_name} ({restoreArchiveTarget.edition_year})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Estás a punto de restaurar la memoria histórica <strong>"{restoreArchiveTarget.title}"</strong>. Esto configurará el sitio activo con los contenidos guardados en ese punto en el tiempo.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRestoreArchiveTarget(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteRestoreArchive}
                disabled={restoreLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                {restoreLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>Restaurar Edición</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Archive Confirmation */}
      {deletingArchiveId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Respaldo del Historial?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              El archivo histórico seleccionado se eliminará permanentemente del almacenamiento en el servidor.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingArchiveId(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteArchive}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: NEW YEAR MUN WIZARD */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 my-8">
            {/* Wizard Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Asistente de Transición Anual MUN</h3>
                  <p className="text-xs text-slate-400">Configura la nueva edición para el siguiente año</p>
                </div>
              </div>
              <button
                onClick={() => setWizardOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Stepper indicators */}
            <div className="flex items-center gap-2">
              <div
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  wizardStep === 1
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-950/50 text-slate-500 border-slate-800'
                }`}
              >
                1. Datos del Nuevo Modelo
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <div
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                  wizardStep === 2
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-950/50 text-slate-500 border-slate-800'
                }`}
              >
                2. Opciones de Limpieza & Archivo
              </div>
            </div>

            {/* STEP 1: General Info for the new year */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 leading-relaxed">
                  Ingresa los datos generales para la nueva edición del modelo. Puedes modificarlos en cualquier momento después desde la pestaña de Configuración.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Nombre de la Nueva Edición *</label>
                    <input
                      type="text"
                      required
                      value={newEditionName}
                      onChange={(e) => setNewEditionName(e.target.value)}
                      placeholder="Ej: BIMUN XXVII"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Año de la Edición *</label>
                    <input
                      type="text"
                      required
                      value={newEditionYear}
                      onChange={(e) => setNewEditionYear(e.target.value)}
                      placeholder="Ej: 2027"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nuevas Fechas del Evento</label>
                  <input
                    type="text"
                    value={newDates}
                    onChange={(e) => setNewDates(e.target.value)}
                    placeholder="Ej: 24 al 26 de Septiembre, 2027"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Lema o Eje Temático del Nuevo Año</label>
                  <input
                    type="text"
                    value={newSlogan}
                    onChange={(e) => setNewSlogan(e.target.value)}
                    placeholder="Ej: Liderazgo, Diplomacia y Excelencia Académica"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Transition & Cleanup Rules */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                {/* Automatic archive box */}
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={archiveCurrent}
                      onChange={(e) => setArchiveCurrent(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-bold text-purple-200">
                      Archivar automáticamente la edición actual ({settings?.bimun_name || 'BIMUN Anterior'})
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-6.5 leading-relaxed">
                    <strong>Recomendado:</strong> Crea una copia de seguridad integral completa con todos los delegados, fotos, actas y comisiones en la memoria histórica antes de aplicar los cambios.
                  </p>
                </div>

                <div className="text-xs font-bold text-slate-300">Selecciona las acciones de renovación:</div>

                <div className="space-y-2.5">
                  {/* Reset registrations */}
                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={resetRegistrations}
                      onChange={(e) => setResetRegistrations(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">Reiniciar tabla de inscripciones de delegados</div>
                      <div className="text-[11px] text-slate-400">
                        Limpia las inscripciones anteriores para recibir a los nuevos delegados del año entrante (los registros anteriores quedan a salvo en el archivo histórico).
                      </div>
                    </div>
                  </label>

                  {/* Reset delegations status */}
                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={resetDelegations}
                      onChange={(e) => setResetDelegations(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">Liberar cupos de delegaciones</div>
                      <div className="text-[11px] text-slate-400">
                        Restablece todos los cupos de países y comisiones a estado "disponible" para que los nuevos inscritos puedan elegirlos.
                      </div>
                    </div>
                  </label>

                  {/* Reset schedule */}
                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={resetSchedule}
                      onChange={(e) => setResetSchedule(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">Reiniciar cronograma del evento</div>
                      <div className="text-[11px] text-slate-400">
                        Crea una plantilla limpia para definir las actividades y horarios del nuevo evento.
                      </div>
                    </div>
                  </label>

                  {/* Retain gallery */}
                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={retainGallery}
                      onChange={(e) => setRetainGallery(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">Conservar galería fotográfica histórica</div>
                      <div className="text-[11px] text-slate-400">
                        Mantiene las fotografías de ediciones previas debidamente etiquetadas en los filtros del sitio web público.
                      </div>
                    </div>
                  </label>

                  {/* Retain committees & countries structure */}
                  <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={retainCommittees}
                      onChange={(e) => setRetainCommittees(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 mt-0.5"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">Conservar comisiones y países cargados</div>
                      <div className="text-[11px] text-slate-400">
                        Mantiene la estructura académica base para no tener que crear los países y comisiones desde cero (podrás editarlos luego).
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {wizardStep === 1 ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setWizardOpen(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  ← Volver al Paso 1
                </button>
              )}

              {wizardStep === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!newEditionName.trim() || !newEditionYear.trim()) {
                      onStatusMessage('Por favor ingresa el nombre y el año de la edición.', 'error');
                      return;
                    }
                    setWizardStep(2);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <span>Continuar al Paso 2</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartNewYear}
                  disabled={wizardLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 disabled:opacity-50"
                >
                  {wizardLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>¡Iniciar {newEditionName || 'Nueva Edición'}!</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
