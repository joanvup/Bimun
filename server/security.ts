import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * PRODUCTION SECURITY MODULE FOR BIMUN
 * - In-memory rate limiting against brute-force attacks and registration floods
 * - Secure dynamic JWT secret derivation (never hardcoded in production)
 * - Strict whitelist for public settings (prevent accidental leak of SMTP/credentials)
 * - Production HTTP security headers & server footprint reduction
 */

// Dynamic secret generation in memory if not set in environment
let derivedSecret = process.env.JWT_SECRET;
if (!derivedSecret || derivedSecret === 'bimun_valledupar_secret_key_2026_un_model') {
  if (process.env.NODE_ENV === 'production') {
    // Generate secure random secret if not provided in production
    derivedSecret = crypto.randomBytes(48).toString('hex');
    console.warn('⚠️ [SEGURIDAD]: JWT_SECRET no estaba configurado en variables de entorno. Se generó un secreto criptográfico temporal único para este inicio.');
  } else {
    derivedSecret = derivedSecret || 'bimun_valledupar_secret_key_2026_un_model';
  }
}

export const SECURE_JWT_SECRET = derivedSecret;

// In-Memory Rate Limiting Storage
interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const registerAttempts = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (record.blockedUntil && record.blockedUntil < now) {
      loginAttempts.delete(ip);
    } else if (now - record.firstAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(ip);
    }
  }
  for (const [ip, record] of registerAttempts.entries()) {
    if (now - record.firstAttempt > 60 * 60 * 1000) {
      registerAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Rate Limiter for Login Endpoint:
 * Max 5 failed attempts within 15 minutes.
 * If exceeded, blocks the IP for 15 minutes.
 */
export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && record.blockedUntil && record.blockedUntil > now) {
    const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Demasiados intentos fallidos de inicio de sesión. Por motivos de seguridad, tu dirección IP ha sido bloqueada temporalmente durante ${remainingMinutes} minuto(s).`,
      retryAfterMinutes: remainingMinutes,
    });
  }

  next();
}

export function recordFailedLogin(req: Request) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 mins
  const maxAttempts = 5;

  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };

  if (now - record.firstAttempt > windowMs) {
    record.count = 1;
    record.firstAttempt = now;
    delete record.blockedUntil;
  } else {
    record.count += 1;
  }

  if (record.count >= maxAttempts) {
    record.blockedUntil = now + windowMs;
    console.warn(`🚨 [SEGURIDAD]: IP ${ip} bloqueada por exceder límite de ${maxAttempts} intentos fallidos de login.`);
  }

  loginAttempts.set(ip, record);
}

export function recordSuccessfulLogin(req: Request) {
  const ip = getClientIp(req);
  loginAttempts.delete(ip);
}

/**
 * Rate Limiter for Public Registration Endpoint:
 * Max 10 registrations per IP per hour to prevent spam/denial of service.
 */
export function registerRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAllowed = 12;

  const record = registerAttempts.get(ip) || { count: 0, firstAttempt: now };

  if (now - record.firstAttempt > windowMs) {
    record.count = 1;
    record.firstAttempt = now;
  } else {
    record.count += 1;
  }

  registerAttempts.set(ip, record);

  if (record.count > maxAllowed) {
    return res.status(429).json({
      error: 'Se ha alcanzado el límite de solicitudes de inscripción para tu conexión. Si requieres inscribir más delegaciones de tu colegio, por favor comunícate directamente con la Secretaría General.',
    });
  }

  next();
}

/**
 * Public Settings Whitelist:
 * Strict filter to prevent any backend secret (e.g. SMTP passwords, tokens, API credentials)
 * from ever being exposed via /api/public/data.
 */
const PUBLIC_SETTINGS_WHITELIST = new Set([
  'bimun_name',
  'bimun_edition',
  'edition',
  'motto',
  'slogan',
  'theme',
  'description',
  'hero_tagline',
  'hero_subtext',
  'hero_bg_image',
  'hero_video_url',
  'school_name',
  'institution_name',
  'institution_short',
  'venue',
  'venue_address',
  'venue_city',
  'contact_address',
  'contact_email',
  'contact_phone',
  'instagram_handle',
  'instagram_url',
  'youtube_url',
  'hero_image',
  'logo_url',
  'logo_size',
  'event_date_display',
  'start_date',
  'end_date',
  'inauguration_time',
  'registration_open',
  'active_sections',
  'event_dates_iso',
  'gallery_categories',
  'cta_primary_text',
  'cta_primary_link',
  'cta_secondary_text',
  'cta_secondary_link',
  'cta_tertiary_text',
  'cta_tertiary_link',
]);

export function filterPublicSettings(allSettings: Record<string, any>): Record<string, any> {
  const safeSettings: Record<string, any> = {};
  for (const key of Object.keys(allSettings)) {
    if (PUBLIC_SETTINGS_WHITELIST.has(key)) {
      safeSettings[key] = allSettings[key];
    }
  }
  return safeSettings;
}

/**
 * HTTP Security Headers Middleware:
 * Replaces express helmet for light zero-dependency production protection.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent browser MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Protect against Clickjacking in modern and legacy browsers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Legacy XSS filter activation
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Restrict sensitive browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}
