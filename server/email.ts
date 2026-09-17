import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { queryOne, runSql, saveDb } from './db.ts';

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  from_name: string;
  reply_to?: string;
  is_enabled: boolean;
}

let transporterInstance: Transporter | null = null;
let cachedConfigHash = '';

export function getSmtpConfig(): SmtpSettings {
  try {
    const hostRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_host';");
    const portRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_port';");
    const secureRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_secure';");
    const userRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_user';");
    const passRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_password';");
    const fromNameRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_from_name';");
    const replyToRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_reply_to';");
    const enabledRow = queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'smtp_enabled';");

    return {
      host: hostRow?.value || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(portRow?.value || process.env.SMTP_PORT || 465),
      secure: secureRow ? secureRow.value === 'true' : true,
      user: userRow?.value || process.env.SMTP_USER || '',
      password: passRow?.value || process.env.SMTP_PASSWORD || '',
      from_name: fromNameRow?.value || process.env.SMTP_FROM_NAME || 'BIMUN - Colegio Bilingüe',
      reply_to: replyToRow?.value || process.env.SMTP_REPLY_TO || '',
      is_enabled: enabledRow ? enabledRow.value === 'true' : false,
    };
  } catch (err: any) {
    console.warn('Error reading SMTP config from db:', err.message);
    return {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: '',
      password: '',
      from_name: 'BIMUN - Colegio Bilingüe',
      reply_to: '',
      is_enabled: false,
    };
  }
}

export function saveSmtpConfig(config: Partial<SmtpSettings>): void {
  const now = new Date().toISOString();
  
  if (config.host !== undefined) {
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_host', ?, ?);", [config.host, now]);
  }
  if (config.port !== undefined) {
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_port', ?, ?);", [String(config.port), now]);
  }
  if (config.secure !== undefined) {
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_secure', ?, ?);", [config.secure ? 'true' : 'false', now]);
  }
  if (config.user !== undefined) {
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_user', ?, ?);", [config.user.trim(), now]);
  }
  if (config.password !== undefined && config.password !== '') {
    // Clean spaces from Google Workspace app passwords (usually grouped as 4x4)
    const cleanedPass = config.password.replace(/\s+/g, '');
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_password', ?, ?);", [cleanedPass, now]);
  }
  if (config.from_name !== undefined) {
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_from_name', ?, ?);", [config.from_name.trim(), now]);
  }
  if (config.reply_to !== undefined) {
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_reply_to', ?, ?);", [config.reply_to.trim(), now]);
  }
  if (config.is_enabled !== undefined) {
    runSql("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('smtp_enabled', ?, ?);", [config.is_enabled ? 'true' : 'false', now]);
  }

  saveDb();
  // Invalidate transport instance
  transporterInstance = null;
  cachedConfigHash = '';
}

export function getTransporter(forceConfig?: SmtpSettings): Transporter {
  const config = forceConfig || getSmtpConfig();
  const currentHash = `${config.host}:${config.port}:${config.user}:${config.password}:${config.secure}`;

  if (transporterInstance && cachedConfigHash === currentHash && !forceConfig) {
    return transporterInstance;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.password,
    },
    // Google Workspace optimization
    tls: {
      rejectUnauthorized: true,
    },
  });

  if (!forceConfig) {
    transporterInstance = transporter;
    cachedConfigHash = currentHash;
  }

  return transporter;
}

export async function verifySmtpConnection(customConfig?: SmtpSettings): Promise<{ success: boolean; message: string }> {
  try {
    const config = customConfig || getSmtpConfig();
    if (!config.user || !config.password) {
      return { success: false, message: 'Se requiere cuenta de usuario y contraseña de aplicación de Google Workspace.' };
    }

    const transporter = getTransporter(config);
    await transporter.verify();
    return { success: true, message: 'Conexión con el servidor SMTP de Google Workspace establecida con éxito.' };
  } catch (err: any) {
    console.error('SMTP Verify Error:', err);
    let errorMsg = err.message || 'Error de conexión SMTP';
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      errorMsg = 'Error de autenticación (535): Revisa tu correo de Google Workspace y asegúrate de usar una Contraseña de Aplicación de 16 caracteres (no la contraseña habitual).';
    } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
      errorMsg = `Tiempo de espera agotado al conectar con ${customConfig?.host || 'smtp.gmail.com'}:${customConfig?.port || 465}.`;
    }
    return { success: false, message: errorMsg };
  }
}

export async function sendTestEmail(targetEmail: string, customConfig?: SmtpSettings): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const config = customConfig || getSmtpConfig();
    if (!config.user || !config.password) {
      return { success: false, message: 'La cuenta o contraseña de aplicación no están configuradas.' };
    }

    const transporter = getTransporter(config);

    const fromAddress = `"${config.from_name || 'BIMUN Oficial'}" <${config.user}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: targetEmail,
      replyTo: config.reply_to || config.user,
      subject: '✓ Verificación Exitosa de Servidor SMTP - BIMUN XXVII',
      text: `Hola,\n\nEste correo confirma que el servidor de correo SMTP para BIMUN (Fundación Colegio Bilingüe de Valledupar) ha sido configurado correctamente mediante Google Workspace.\n\nServidor: ${config.host}:${config.port}\nRemitente: ${fromAddress}\nFecha: ${new Date().toLocaleString('es-CO')}\n\nAtentamente,\nSecretaría de Tecnología e Informática - BIMUN`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">BIMUN XXVII</h1>
            <p style="color: #94a3b8; margin: 4px 0 0; font-size: 13px;">Fundación Colegio Bilingüe de Valledupar</p>
          </div>
          <div style="padding: 30px 24px; color: #334155; line-height: 1.6;">
            <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
              ✓ Verificación de Servidor SMTP Exitosa
            </div>
            <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 18px;">¡Conexión de Correo Establecida con Éxito!</h2>
            <p style="margin: 0 0 16px; font-size: 14px;">
              Este es un correo de prueba generado automáticamente desde el panel de control del Modelo de Naciones Unidas. La autenticación con <strong>Google Workspace</strong> y tu contraseña de aplicación se han validado correctamente.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Servidor SMTP:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${config.host}:${config.port} (${config.secure ? 'SSL' : 'TLS'})</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Cuenta Autenticada:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${config.user}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Nombre del Remitente:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${config.from_name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Destinatario de Prueba:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${targetEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748b;">Hora de Emisión:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${new Date().toLocaleString('es-CO')}</td>
                </tr>
              </table>
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0;">
              El sistema ahora está listo para el envío de confirmaciones de inscripción, asignaciones de país y comunicados oficiales a los delegados.
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            BIMUN XXVII &bull; Valledupar, Cesar, Colombia &bull; Colegio Bilingüe
          </div>
        </div>
      `,
    });

    return {
      success: true,
      message: `Correo de prueba enviado con éxito a ${targetEmail}.`,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error('Send Test Email Error:', err);
    let errorMsg = err.message || 'Error al enviar correo de prueba';
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      errorMsg = 'Error de autenticación: Verifica que la cuenta de Google Workspace tenga verificación en dos pasos activa y que hayas generado una Contraseña de Aplicación válida de 16 letras.';
    }
    return { success: false, message: errorMsg };
  }
}
