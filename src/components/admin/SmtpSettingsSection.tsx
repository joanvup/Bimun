import React, { useState, useEffect } from 'react';
import {
  Mail, Send, CheckCircle2, AlertTriangle, RefreshCw, Key,
  ShieldCheck, HelpCircle, Eye, EyeOff, Globe, Server
} from 'lucide-react';
import { SmtpConfig } from '../../types.ts';

interface SmtpSettingsSectionProps {
  token: string;
  onStatusMessage: (text: string, type?: 'success' | 'error') => void;
}

export const SmtpSettingsSection: React.FC<SmtpSettingsSectionProps> = ({
  token,
  onStatusMessage,
}) => {
  const [config, setConfig] = useState<SmtpConfig>({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: '',
    from_name: 'BIMUN Oficial - Colegio Bilingüe',
    reply_to: '',
    is_enabled: false,
    has_password: false,
  });

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [sendingTestMail, setSendingTestMail] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);

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

  const loadSmtpConfig = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/smtp/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          if (data.config.user && !testEmailTarget) {
            setTestEmailTarget(data.config.user);
          }
        }
      }
    } catch (err: any) {
      console.error('Error loading SMTP config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmtpConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestFeedback(null);
    try {
      const payload: any = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        from_name: config.from_name,
        reply_to: config.reply_to,
        is_enabled: config.is_enabled,
      };

      if (passwordInput.trim()) {
        payload.password = passwordInput.trim();
      }

      const res = await authFetch('/api/admin/smtp/config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onStatusMessage('Configuración SMTP de Google Workspace guardada exitosamente.');
        setPasswordInput('');
        await loadSmtpConfig();
      } else {
        onStatusMessage(data.error || 'Error al guardar la configuración SMTP', 'error');
      }
    } catch (err: any) {
      onStatusMessage(err.message || 'Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setTestingConnection(true);
    setTestFeedback(null);
    try {
      const res = await authFetch('/api/admin/smtp/verify', {
        method: 'POST',
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
          password: passwordInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestFeedback({ success: true, message: data.message });
        onStatusMessage('Conexión con Google Workspace validada exitosamente.');
      } else {
        setTestFeedback({ success: false, message: data.error || 'Error de autenticación con Google Workspace.' });
      }
    } catch (err: any) {
      setTestFeedback({ success: false, message: err.message || 'Error al probar conexión.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget || !testEmailTarget.includes('@')) {
      onStatusMessage('Por favor ingresa un correo destinatario válido para la prueba.', 'error');
      return;
    }
    setSendingTestMail(true);
    setTestFeedback(null);
    try {
      const res = await authFetch('/api/admin/smtp/send-test', {
        method: 'POST',
        body: JSON.stringify({
          target_email: testEmailTarget.trim(),
          host: config.host,
          port: config.port,
          secure: config.secure,
          user: config.user,
          password: passwordInput.trim() || undefined,
          from_name: config.from_name,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestFeedback({ success: true, message: data.message });
        onStatusMessage(`Correo de prueba enviado a ${testEmailTarget}`);
      } else {
        setTestFeedback({ success: false, message: data.error || 'Error al enviar el correo de prueba.' });
      }
    } catch (err: any) {
      setTestFeedback({ success: false, message: err.message || 'Error de red.' });
    } finally {
      setSendingTestMail(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
        <span>Cargando configuración de servidor de correo...</span>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
              <span>Servidor de Correo SMTP (Google Workspace)</span>
              {config.is_enabled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Activo
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  Inactivo
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Configura el envío de confirmaciones automáticas de inscripción y resoluciones vía Gmail / Google Workspace.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              checked={config.is_enabled}
              onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-xs font-semibold text-slate-300">
              Habilitar Notificaciones por Correo
            </span>
          </label>
        </div>
      </div>

      {/* Google Workspace Guide Banner */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200/90 space-y-2">
        <div className="flex items-center gap-2 font-bold text-blue-300">
          <HelpCircle className="w-4 h-4 shrink-0 text-blue-400" />
          <span>Instrucciones para Google Workspace (Colegio Bilingüe de Valledupar)</span>
        </div>
        <p className="leading-relaxed text-[11px] text-slate-300">
          Para conectar una cuenta institucional (ej: <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300">bimun@colegiobilingue.edu.co</code>):
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 pl-1">
          <li>Asegúrate de que la cuenta tenga activa la <strong>Verificación en dos pasos (2FA)</strong>.</li>
          <li>Ingresa a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">myaccount.google.com/apppasswords</a>.</li>
          <li>Crea una <strong>Contraseña de Aplicación</strong> llamada por ejemplo <span className="font-semibold text-white">"BIMUN Web"</span>.</li>
          <li>Copia la clave generada de 16 letras y pégala en el campo <em>Contraseña de Aplicación</em> abajo.</li>
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Host */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Servidor SMTP (Host)
            </label>
            <div className="relative">
              <Server className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Port */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Puerto y Cifrado
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={config.port}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setConfig({ ...config, port: p, secure: p === 465 });
                }}
                placeholder="465"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
              <select
                value={config.secure ? 'ssl' : 'tls'}
                onChange={(e) => setConfig({ ...config, secure: e.target.value === 'ssl' })}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ssl">SSL (Puerto 465)</option>
                <option value="tls">TLS/STARTTLS (587)</option>
              </select>
            </div>
          </div>

          {/* User Email */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Cuenta Google Workspace
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                value={config.user}
                onChange={(e) => setConfig({ ...config, user: e.target.value })}
                placeholder="bimun@colegiobilingue.edu.co"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          {/* App Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contraseña de Aplicación
              </label>
              {config.has_password && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Configurada</span>
                </span>
              )}
            </div>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={config.has_password ? '•••••••••••••••• (Guardada)' : 'xxxx xxxx xxxx xxxx (16 caracteres)'}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Deja en blanco si ya la configuraste y no deseas modificarla.
            </p>
          </div>

          {/* From Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre del Remitente
            </label>
            <input
              type="text"
              value={config.from_name}
              onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
              placeholder="BIMUN XXVII - Colegio Bilingüe"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Reply To */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Correo de Respuesta (Reply-To)
            </label>
            <input
              type="email"
              value={config.reply_to || ''}
              onChange={(e) => setConfig({ ...config, reply_to: e.target.value })}
              placeholder="contacto@colegiobilingue.edu.co (opcional)"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={testingConnection || (!config.has_password && !passwordInput.trim())}
              onClick={handleVerify}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {testingConnection ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Verificando Handshake...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Probar Conexión SMTP</span>
                </>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm shadow-blue-600/30 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Guardar Configuración SMTP</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Test Feedback */}
      {testFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            testFeedback.success
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {testFeedback.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          )}
          <p className="leading-relaxed">{testFeedback.message}</p>
        </div>
      )}

      {/* Test Email Sender Sandbox */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Enviar Correo Real de Prueba
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Verifica la entrega final en bandeja de entrada
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={testEmailTarget}
            onChange={(e) => setTestEmailTarget(e.target.value)}
            placeholder="Introduce correo destinatario (ej. tu correo personal)"
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="button"
            disabled={sendingTestMail || (!config.has_password && !passwordInput.trim())}
            onClick={handleSendTestEmail}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm shadow-emerald-600/30"
          >
            {sendingTestMail ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Enviando Correo...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Prueba</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
