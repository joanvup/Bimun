import React, { useState, useEffect } from 'react';
import {
  Database, Server, CheckCircle2, AlertTriangle, RefreshCw, Send,
  ArrowRightLeft, ShieldCheck, Download, HardDrive, Info, Layers, Zap
} from 'lucide-react';
import { DatabaseStatus, DatabaseConfig, DatabaseEngineType } from '../../types.ts';
import { ConfirmDeleteModal } from './ConfirmDeleteModal.tsx';

interface DatabaseSettingsSectionProps {
  token: string;
  onStatusMessage: (text: string, type?: 'success' | 'error') => void;
  onDataUpdated: () => void;
}

export const DatabaseSettingsSection: React.FC<DatabaseSettingsSectionProps> = ({
  token,
  onStatusMessage,
  onDataUpdated,
}) => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    type: 'sqlite',
    host: '',
    port: 5432,
    database: '',
    user: '',
    password: '',
    ssl: true,
    connectionString: '',
  });

  const [useUri, setUseUri] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const res = await authFetch('/api/admin/clear-cache', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        onStatusMessage('La caché de datos públicos ha sido limpiada con éxito. El portal web público se ha sincronizado inmediatamente con los datos de producción.');
        onDataUpdated();
      } else {
        onStatusMessage(data.error || 'Error al limpiar la caché de datos públicos', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setClearingCache(false);
    }
  };

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

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await authFetch('/api/admin/db-config');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.status);
        if (data.config) {
          setDbConfig((prev) => ({
            ...prev,
            ...data.config,
            port: data.config.port || (data.config.type === 'mysql' ? 3306 : 5432),
          }));
          if (data.config.connectionString) {
            setUseUri(true);
          }
        }
      }
    } catch (err: any) {
      console.error('Error cargando estado de base de datos:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Handle engine change
  const handleEngineChange = (newType: DatabaseEngineType) => {
    setDbConfig((prev) => ({
      ...prev,
      type: newType,
      port: newType === 'mysql' ? 3306 : newType === 'postgres' ? 5432 : undefined,
    }));
    setTestResult(null);
  };

  // Test Connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await authFetch('/api/admin/db-test', {
        method: 'POST',
        body: JSON.stringify(dbConfig),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        onStatusMessage('Prueba de conexión exitosa');
      } else {
        onStatusMessage('Fallo en la prueba de conexión', 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
      onStatusMessage(err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  // Apply & Switch Engine
  const handleSwitchEngine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);
    try {
      const res = await authFetch('/api/admin/db-switch', {
        method: 'POST',
        body: JSON.stringify(dbConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onStatusMessage(data.message);
        setDbStatus(data.status);
        onDataUpdated();
      } else {
        onStatusMessage(data.message || 'Error al cambiar de base de datos', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Revert quickly to SQLite
  const handleRevertToSqlite = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/db-switch', {
        method: 'POST',
        body: JSON.stringify({ type: 'sqlite' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowRevertModal(false);
        onStatusMessage('Cambiado a SQLite Local exitosamente.');
        setDbConfig((prev) => ({ ...prev, type: 'sqlite' }));
        setDbStatus(data.status);
        onDataUpdated();
      } else {
        onStatusMessage(data.error || 'Error al cambiar a SQLite.', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Migrate Data from SQLite to Target Engine
  const handleMigrateData = async () => {
    setMigrating(true);
    try {
      const res = await authFetch('/api/admin/db-migrate', {
        method: 'POST',
        body: JSON.stringify(dbConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowMigrateModal(false);
        onStatusMessage(data.message);
        onDataUpdated();
      } else {
        onStatusMessage(data.message || 'Error durante la migración de datos.', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message, 'error');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Active Engine Status Card */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Motor de Base de Datos Activo</span>
                {dbStatus && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      dbStatus.activeType === 'sqlite'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : dbStatus.activeType === 'postgres'
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                        : 'bg-orange-950/80 text-orange-300 border border-orange-800'
                    }`}
                  >
                    {dbStatus.activeType === 'sqlite'
                      ? 'SQLite 3 (Local)'
                      : dbStatus.activeType === 'postgres'
                      ? 'PostgreSQL'
                      : 'MySQL'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {dbStatus?.sqliteFallback ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Atención: La BD configurada presentó un error. El sistema está operando en modo seguro sobre SQLite local.
                  </span>
                ) : (
                  'Todas las lecturas y escrituras de la web pública y el CMS se ejecutan con alta disponibilidad.'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadConfig}
            disabled={loadingConfig}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors flex items-center gap-1.5"
            title="Refrescar estado"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingConfig ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>

        {dbStatus?.error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-bold">Aviso de conectividad:</p>
              <p className="text-[11px] text-rose-200 mt-0.5">{dbStatus.error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo Configurado</span>
            <span className="text-white font-semibold capitalize">{dbStatus?.configuredType || 'sqlite'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Host / Ubicación</span>
            <span className="text-white font-mono truncate block">{dbStatus?.host || 'Local'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Base de Datos</span>
            <span className="text-white font-mono truncate block">{dbStatus?.database || 'bimun_database.sqlite'}</span>
          </div>
        </div>
      </div>

      {/* Cache Management Card */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Caché de Rendimiento y Datos Públicos
              <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Optimización Activa
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Para garantizar la máxima velocidad de carga de la web de BIMUN bajo alta concurrencia de delegados, el servidor mantiene una caché en memoria de alto rendimiento para el sitio público. El sistema purga la caché automáticamente ante cualquier edición en el CMS, pero puedes forzar una sincronización e invalidación manual inmediata aquí.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Consultas cacheadas: Toda la información consolidada de la web.</span>
          </div>
          <button
            type="button"
            onClick={handleClearCache}
            disabled={clearingCache}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${clearingCache ? 'animate-spin' : ''}`} />
            <span>{clearingCache ? 'Limpiando...' : 'Limpiar Caché'}</span>
          </button>
        </div>
      </div>

      {/* Engine Selection & Configuration Form */}
      <form onSubmit={handleSwitchEngine} className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            <span>Configurar Conexión a Base de Datos</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona el motor relacional que prefieras. Si eliges PostgreSQL o MySQL, el sistema valida la conexión antes de activarla y mantiene SQLite como respaldo seguro si algo falla.
          </p>
        </div>

        {/* Engine Tabs */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleEngineChange('sqlite')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              dbConfig.type === 'sqlite'
                ? 'bg-amber-950/30 border-amber-500 text-white shadow-sm shadow-amber-500/20'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <HardDrive className="w-4 h-4 text-amber-400" />
              {dbConfig.type === 'sqlite' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <div>
              <p className="font-bold text-xs">SQLite Local</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Archivo embebido rápido</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleEngineChange('postgres')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              dbConfig.type === 'postgres'
                ? 'bg-blue-950/30 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Database className="w-4 h-4 text-blue-400" />
              {dbConfig.type === 'postgres' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
            </div>
            <div>
              <p className="font-bold text-xs">PostgreSQL</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supabase, Cloud SQL, Neon</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleEngineChange('mysql')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              dbConfig.type === 'mysql'
                ? 'bg-orange-950/30 border-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Server className="w-4 h-4 text-orange-400" />
              {dbConfig.type === 'mysql' && <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />}
            </div>
            <div>
              <p className="font-bold text-xs">MySQL</p>
              <p className="text-[10px] text-slate-400 mt-0.5">cPanel, Hostinger, AWS RDS</p>
            </div>
          </button>
        </div>

        {/* Form fields for PostgreSQL or MySQL */}
        {dbConfig.type !== 'sqlite' && (
          <div className="space-y-4 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Método de Configuración:</span>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setUseUri(false)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    !useUri ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Campos Individuales
                </button>
                <button
                  type="button"
                  onClick={() => setUseUri(true)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    useUri ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Connection URI / String
                </button>
              </div>
            </div>

            {useUri ? (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">
                  Cadena de Conexión ({dbConfig.type === 'postgres' ? 'postgres://...' : 'mysql://...'})
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    dbConfig.type === 'postgres'
                      ? 'postgresql://usuario:contraseña@servidor.com:5432/nombre_bd?sslmode=require'
                      : 'mysql://usuario:contraseña@servidor.com:3306/nombre_bd'
                  }
                  value={dbConfig.connectionString || ''}
                  onChange={(e) => setDbConfig({ ...dbConfig, connectionString: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-400 font-medium">Host / Servidor</label>
                  <input
                    type="text"
                    required
                    placeholder="db.midominio.com o 192.168.1.10 o localhost"
                    value={dbConfig.host || ''}
                    onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Puerto</label>
                  <input
                    type="number"
                    required
                    placeholder={dbConfig.type === 'postgres' ? '5432' : '3306'}
                    value={dbConfig.port || (dbConfig.type === 'postgres' ? 5432 : 3306)}
                    onChange={(e) => setDbConfig({ ...dbConfig, port: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Nombre de la Base de Datos</label>
                  <input
                    type="text"
                    required
                    placeholder="bimun_db"
                    value={dbConfig.database || ''}
                    onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Usuario</label>
                  <input
                    type="text"
                    required
                    placeholder="admin_bimun"
                    value={dbConfig.user || ''}
                    onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={dbConfig.password || ''}
                    onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2 pt-1 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(dbConfig.ssl)}
                      onChange={(e) => setDbConfig({ ...dbConfig, ssl: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                    />
                    <span>Requerir conexión cifrada SSL (Recomendado para servidores en la nube)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Live Test Feedback */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{testResult.success ? 'Conexión Exitosa' : 'Fallo en la Verificación'}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buttons Action Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {dbConfig.type !== 'sqlite' && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 text-blue-400 ${testing ? 'animate-pulse' : ''}`} />
                <span>{testing ? 'Verificando...' : 'Probar Conexión'}</span>
              </button>
            )}

            {dbStatus?.activeType !== 'sqlite' && (
              <button
                type="button"
                onClick={() => setShowRevertModal(true)}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 text-xs font-semibold flex items-center gap-1.5"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Volver a SQLite Local</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar y Activar Conexión'}</span>
          </button>
        </div>
      </form>

      {/* Migration Wizard Card */}
      {dbConfig.type !== 'sqlite' && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950/80 to-blue-950/30 border border-blue-900/40 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Sincronizar y Migrar Datos Actuales a {dbConfig.type === 'postgres' ? 'PostgreSQL' : 'MySQL'}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Transfiere automáticamente todo el catálogo de comisiones, países, inscripciones, noticias, fotos de galería y usuarios administradores desde la base de datos local hacia el nuevo servidor relacional.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-200 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              La migración utiliza cláusulas de actualización segura (UPSERT / ON DUPLICATE KEY) para no duplicar datos si ya existen registros.
            </span>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowMigrateModal(true)}
              disabled={migrating}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
              <span>{migrating ? 'Sincronizando registros...' : 'Iniciar Migración de Datos'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal for Reverting to SQLite */}
      <ConfirmDeleteModal
        isOpen={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        onConfirm={handleRevertToSqlite}
        isDeleting={saving}
        title="¿Activar SQLite Local?"
        itemName="Motor SQLite 3 Local"
        description="El sistema volverá a utilizar la base de datos local SQLite para almacenar todas las operaciones del portal BIMUN."
        confirmButtonText="Activar SQLite"
      />

      {/* Modal for Migrating Data */}
      <ConfirmDeleteModal
        isOpen={showMigrateModal}
        onClose={() => setShowMigrateModal(false)}
        onConfirm={handleMigrateData}
        isDeleting={migrating}
        title={`¿Sincronizar y Migrar a ${dbConfig.type === 'postgres' ? 'PostgreSQL' : 'MySQL'}?`}
        itemName={`Servidor ${dbConfig.type === 'postgres' ? 'PostgreSQL' : 'MySQL'}`}
        description={`Se transferirán y sincronizarán comisiones, países, inscripciones, noticias, delegaciones y galería hacia el servidor remoto mediante actualización segura.`}
        confirmButtonText="Iniciar Migración"
      />
    </div>
  );
};
