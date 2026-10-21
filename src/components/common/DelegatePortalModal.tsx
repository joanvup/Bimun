import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileBadge,
  School,
  Globe2,
  Users2,
  Calendar,
  Sparkles,
  Printer,
} from 'lucide-react';
import QRCode from 'qrcode';
import { DelegateLookupResult, BIMUNSettings } from '../../types';
import { generateDelegateCarnetPdf } from '../../utils/carnetPdfGenerator';

interface DelegatePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  settings?: BIMUNSettings;
}

export const DelegatePortalModal: React.FC<DelegatePortalModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  settings,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DelegateLookupResult['registration'] | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewQrUrl, setPreviewQrUrl] = useState<string | null>(null);

  // Sync initial query if supplied
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery, isOpen]);

  // Generate preview QR code when result changes
  useEffect(() => {
    if (result && result.is_eligible_for_badge) {
      const qrPayload = JSON.stringify({
        event: 'BIMUN',
        edition: settings?.bimun_edition || '2026',
        id: result.id,
        name: result.full_name,
        committee: result.assigned_committee?.code || 'ASG',
        country: result.assigned_country?.name || 'ASG',
      });

      QRCode.toDataURL(qrPayload, {
        width: 180,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => setPreviewQrUrl(url))
        .catch(() => setPreviewQrUrl(null));
    } else {
      setPreviewQrUrl(null);
    }
  }, [result, settings]);

  if (!isOpen) return null;

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!q || q.length < 3) {
      setError('Por favor ingresa tu correo electrónico o tu código de registro (ej. reg_17...)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/public/delegate-lookup?query=${encodeURIComponent(q)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'No se encontró la inscripción.');
        return;
      }

      if (data.found && data.registration) {
        setResult(data.registration);
      } else {
        setError('No se encontraron registros activos con estos datos.');
      }
    } catch (err: any) {
      console.error('Error fetching delegate registration:', err);
      setError('Error al consultar el servidor. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result || !result.is_eligible_for_badge) return;
    setDownloadingPdf(true);
    try {
      await generateDelegateCarnetPdf({
        delegate: result,
        settings: settings as any,
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Hubo un error al generar el carnet en PDF. Por favor intenta de nuevo.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delegate-portal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-5 text-white border-b border-amber-500/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <FileBadge className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delegate-portal-title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Portal del Delegado <span className="text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">BIMUN {settings?.bimun_edition || '2026'}</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Consulta tu estado de inscripción y descarga tu carnet digital oficial
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Search bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="space-y-2"
          >
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Ingresa tu correo o código de registro:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ej. delegado@colegio.edu.co o reg_17..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Consultando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Consultar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Usa el correo con el que diligenciaste el formulario de registro.
            </p>
          </form>

          {/* Error display */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-800 dark:text-red-300 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">{error}</p>
                <p className="text-red-700/80 dark:text-red-300/80">
                  Si ya te inscribiste y no recuerdas el correo exacto, revisa tu bandeja de entrada o contáctanos a{' '}
                  <span className="font-medium underline">{settings?.contact_email || 'secretaria@bimun.org'}</span>.
                </p>
              </div>
            </div>
          )}

          {/* Results section */}
          {result && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Status Header */}
              {result.is_eligible_for_badge ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                        Inscripción Aprobada y Cupo Asignado
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Tu carnet digital oficial está listo para ser descargado y portado durante el modelo.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-600 text-white shadow-sm">
                    OFICIAL ACTIVO
                  </span>
                </div>
              ) : result.status === 'pending' ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <h4 className="font-bold text-amber-900 dark:text-amber-200">
                      Inscripción en Proceso de Evaluación
                    </h4>
                    <p className="text-amber-800 dark:text-amber-300">
                      Hemos recibido tu solicitud correctamente (ID: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded text-[11px] font-mono">{result.id}</code>). La Secretaría General y la Mesa Directiva están asignando comisiones y países según disponibilidad de cupos.
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                      Una vez tu asignación sea confirmada, podrás descargar tu carnet oficial con código QR directamente desde este portal.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  <p className="font-semibold">Estado actual de la inscripción: {result.status}</p>
                  <p>Por favor ponte en contacto con la mesa organizadora si tienes inquietudes sobre tu registro.</p>
                </div>
              )}

              {/* Credential Card Preview */}
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 shadow-inner">
                <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Credencial Oficial</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  {/* Left: Badge Visual Preview */}
                  <div className="w-full sm:w-56 shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-md text-center flex flex-col items-center">
                    {/* Header badge */}
                    <div className="w-full py-1.5 px-2 bg-slate-900 text-white rounded-lg mb-3">
                      <p className="text-[10px] font-bold tracking-widest text-amber-400">
                        BIMUN {settings?.bimun_edition || '2026'}
                      </p>
                      <p className="text-[8px] text-slate-300">NACIONES UNIDAS</p>
                    </div>

                    {/* QR Code preview */}
                    {previewQrUrl ? (
                      <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm mb-3">
                        <img
                          src={previewQrUrl}
                          alt="QR Verificación"
                          className="w-28 h-28 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 rounded-lg bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-2 mb-3 text-slate-400">
                        <FileBadge className="w-6 h-6 mb-1 text-slate-300" />
                        <span className="text-[9px] text-center">QR disponible al aprobar</span>
                      </div>
                    )}

                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-1">
                      {result.id}
                    </div>

                    <div className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      {result.is_eligible_for_badge ? '✓ VALIDADO' : 'EN ESPERA'}
                    </div>
                  </div>

                  {/* Right: Detailed Fields */}
                  <div className="flex-1 space-y-3.5 w-full">
                    <div>
                      <span className="text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                        Delegado Registrado
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {result.full_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{result.school}</span>
                        {result.grade && <span>• Grado {result.grade}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {/* Commission */}
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 uppercase">
                          <Users2 className="w-3 h-3" /> Comisión / Comité
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                          {result.assigned_committee
                            ? `${result.assigned_committee.name} (${result.assigned_committee.code})`
                            : result.committee_preference_1
                            ? `Pref. 1: ${result.committee_preference_1}`
                            : 'Pendiente de asignación'}
                        </p>
                      </div>

                      {/* Country */}
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 uppercase">
                          <Globe2 className="w-3 h-3" /> País / Rol
                        </span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                          {result.assigned_country ? (
                            <>
                              <span>{result.assigned_country.name}</span>
                              {result.assigned_country.flag_emoji && (
                                <span className="text-base">{result.assigned_country.flag_emoji}</span>
                              )}
                            </>
                          ) : result.country_preference_1 ? (
                            `Pref. 1: ${result.country_preference_1}`
                          ) : (
                            'Pendiente de asignación'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Metadata pill */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Registro: {new Date(result.created_at).toLocaleDateString('es-CO')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="capitalize">{result.delegation_type?.replace(/_/g, ' ') || 'Delegado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                {result.is_eligible_for_badge ? (
                  <>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir Vista</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {downloadingPdf ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generando Carnet PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Descargar Carnet Digital (PDF)</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 font-medium text-xs cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Carnet PDF Disponible tras Aprobación</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950/80 px-6 py-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{settings?.institution_name || 'Colegio Bilingüe de Valledupar'}</span>
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
