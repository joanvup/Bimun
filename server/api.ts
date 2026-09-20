import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI, Type } from '@google/genai';
import { executeQueryAll, executeQueryOne, executeRunSql, initializeDatabaseManager, ensureDefaultAdmin } from './dbManager.ts';
import {
  getDb,
  clearDemoData,
  reloadDemoData,
  resetDefaultAboutSections,
  resetDefaultGallery,
  DEFAULT_ABOUT_SECTIONS,
  DEFAULT_GALLERY_CATEGORIES,
  DEFAULT_GALLERY_ITEMS,
} from './db.ts';
import { getSmtpConfig, saveSmtpConfig, verifySmtpConnection, sendTestEmail } from './email.ts';
import {
  SECURE_JWT_SECRET,
  loginRateLimiter,
  recordFailedLogin,
  recordSuccessfulLogin,
  registerRateLimiter,
  filterPublicSettings,
} from './security.ts';

export const apiRouter = Router();

// Automatic cache invalidation on any administrative write operation
apiRouter.use((req, res, next) => {
  const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  const isAdminPath = req.path.startsWith('/admin/');
  const isExcluded =
    req.path.startsWith('/admin/db-test') ||
    req.path.startsWith('/admin/smtp/verify') ||
    req.path.startsWith('/admin/smtp/send-test') ||
    req.path.startsWith('/admin/suggest-seo');

  if (isWriteMethod && isAdminPath && !isExcluded) {
    invalidatePublicDataCache();
  }
  next();
});

// Helper to authenticate JWT
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Se requiere token válido.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECURE_JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Helper to check admin/superadmin role
export function adminOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
  }
  next();
}

// Helper to check roles permitted to edit institutional content (Admin, Superadmin, Coordinador, Academico)
export function canEditInstitutionalContent(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  const allowedRoles = ['admin', 'superadmin', 'coordinador', 'academico'];
  if (!user || !allowedRoles.includes(user.role)) {
    return res.status(403).json({
      error: 'Acceso denegado. Este apartado está reservado para Administradores, Coordinación y Dirección Académica.',
    });
  }
  next();
}

// -------------------------------------------------------------
// PUBLIC ENDPOINTS
// -------------------------------------------------------------

// Server-side in-memory cache for ultra-fast response and low database load
export let publicDataCache: any = null;

export function invalidatePublicDataCache() {
  publicDataCache = null;
  console.log('[CACHE] Cache de datos públicos invalidada.');
}

// Comprehensive public bundle for high performance with server-side caching
apiRouter.get('/public/data', async (req, res) => {
  try {
    if (publicDataCache) {
      console.log('[CACHE] Sirviendo datos públicos desde caché en memoria.');
      return res.json(publicDataCache);
    }

    // Settings
    const rawSettings = await executeQueryAll<{ key: string; value: string; updated_at: string }>('SELECT * FROM settings;');
    const settings: Record<string, any> = {};
    for (const s of rawSettings) {
      if (s.key === 'active_sections' || s.key === 'event_dates_iso' || s.key === 'gallery_categories') {
        try {
          settings[s.key] = JSON.parse(s.value);
        } catch {
          settings[s.key] = s.value;
        }
      } else if (s.key === 'maintenance_mode') {
        settings[s.key] = s.value === 'true';
      } else {
        settings[s.key] = s.value;
      }
    }

    if (!settings.gallery_categories || !Array.isArray(settings.gallery_categories) || settings.gallery_categories.length === 0) {
      settings.gallery_categories = [
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
    }

    if (!settings.start_date) {
      if (settings.event_dates_iso && typeof settings.event_dates_iso === 'object' && settings.event_dates_iso.start) {
        settings.start_date = settings.event_dates_iso.start;
      } else {
        settings.start_date = '2026-10-23';
      }
    }
    if (!settings.end_date) {
      if (settings.event_dates_iso && typeof settings.event_dates_iso === 'object' && settings.event_dates_iso.end) {
        settings.end_date = settings.event_dates_iso.end;
      } else {
        settings.end_date = '2026-10-25';
      }
    }
    if (!settings.inauguration_time) {
      settings.inauguration_time = '08:30';
    }

    // Active About sections
    const about = await executeQueryAll('SELECT * FROM about_sections WHERE is_active = 1 ORDER BY sort_order ASC;');

    // Active Committees
    const committees = await executeQueryAll('SELECT * FROM committees WHERE status != "archived" ORDER BY sort_order ASC;');

    // Active Countries
    const countries = await executeQueryAll(`SELECT * FROM countries WHERE status = 'active' ORDER BY name ASC;`);

    // Delegations with Committee and Country joins
    const delegations = await executeQueryAll(`
      SELECT 
        d.id, d.committee_id, d.country_id, d.delegate_name, d.delegate_school, d.status,
        c.name as committee_name, c.abbreviation as committee_abbr, c.language as committee_language,
        cnt.name as country_name, cnt.code as country_code, cnt.flag_emoji, cnt.flag_url
      FROM delegations d
      JOIN committees c ON d.committee_id = c.id
      JOIN countries cnt ON d.country_id = cnt.id
      ORDER BY c.sort_order ASC, cnt.name ASC;
    `);

    // Schedule
    const schedule = await executeQueryAll('SELECT * FROM schedule ORDER BY date ASC, sort_order ASC;');

    // Documents
    const documents = await executeQueryAll('SELECT * FROM documents ORDER BY is_featured DESC, sort_order ASC;');

    // Gallery
    const gallery = await executeQueryAll('SELECT * FROM gallery ORDER BY sort_order ASC, created_at DESC;');

    // Organizing team
    const team = await executeQueryAll('SELECT * FROM organizing_team ORDER BY sort_order ASC;');

    // News
    const news = await executeQueryAll('SELECT * FROM news WHERE is_published = 1 ORDER BY publish_date DESC;');

    // Filter settings through strict whitelist to guarantee zero leakage of sensitive keys (e.g. SMTP passwords)
    const sanitizedSettings = filterPublicSettings(settings);

    const payload = {
      settings: sanitizedSettings,
      about,
      committees,
      countries,
      delegations,
      schedule,
      documents,
      gallery,
      team,
      news,
    };

    publicDataCache = payload;
    console.log('[CACHE] Reconstruida la caché de datos públicos en memoria.');
    res.json(payload);
  } catch (err: any) {
    console.error('Error fetching public data:', err);
    res.status(500).json({ error: 'Error al consultar datos públicos', details: err.message });
  }
});

// Purge cache and force database reload
apiRouter.post('/admin/clear-cache', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    invalidatePublicDataCache();
    res.json({
      success: true,
      message: 'La caché de datos públicos ha sido limpiada con éxito. El portal público se sincronizará de inmediato con la base de datos.',
      clearedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al limpiar la caché', details: err.message });
  }
});

// Public registration submission (protected with rate limiter against spam)
apiRouter.post('/public/register', registerRateLimiter, async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      school,
      delegation_type,
      grade,
      committee_preference_1,
      committee_preference_2,
      country_preference_1,
      country_preference_2,
      experience,
      dietary_medical,
      emergency_contact,
      payment_receipt,
    } = req.body;

    if (!full_name || !email || !phone || !school || !delegation_type) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser completados.' });
    }

    const regId = 'reg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();

    await executeRunSql(
      `INSERT INTO registrations (
        id, full_name, email, phone, school, delegation_type, grade,
        committee_preference_1, committee_preference_2, country_preference_1, country_preference_2,
        experience, dietary_medical, emergency_contact, payment_receipt, status, assigned_committee_id, assigned_country_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', '', '', ?)`,
      [
        regId,
        full_name,
        email,
        phone,
        school,
        delegation_type,
        grade || '',
        committee_preference_1 || '',
        committee_preference_2 || '',
        country_preference_1 || '',
        country_preference_2 || '',
        experience || '',
        dietary_medical || '',
        emergency_contact || '',
        payment_receipt || '',
        now,
      ]
    );

    res.status(201).json({
      success: true,
      message: '¡Inscripción recibida exitosamente! La Secretaría General se comunicará contigo pronto.',
      registration_id: regId,
    });
  } catch (err: any) {
    console.error('Error submitting registration:', err);
    res.status(500).json({ error: 'Error al procesar la inscripción', details: err.message });
  }
});

// -------------------------------------------------------------
// AUTH ENDPOINTS (with brute-force protection & JWT signing)
// -------------------------------------------------------------

apiRouter.post('/auth/login', loginRateLimiter, async (req, res) => {
  try {
    await initializeDatabaseManager();

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const user = await executeQueryOne<any>(
      'SELECT * FROM users WHERE LOWER(TRIM(username)) = ?;',
      [cleanUsername]
    );

    if (!user) {
      recordFailedLogin(req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    let validPassword = false;
    try {
      validPassword = bcrypt.compareSync(cleanPassword, user.password_hash);
    } catch {
      validPassword = false;
    }

    if (!validPassword) {
      recordFailedLogin(req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Clear failed login tracker on success
    recordSuccessfulLogin(req);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
      SECURE_JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error durante la autenticación', details: err.message });
  }
});

apiRouter.get('/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: (req as any).user });
});

// Endpoint to audit default security state (checks if user is still using default credentials)
apiRouter.get('/auth/security-audit', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const dbUser = await executeQueryOne<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?;', [user.id]);
    
    // Check if the current password is still the default 'bimun2026'
    const isUsingDefaultPassword = dbUser ? bcrypt.compareSync('bimun2026', dbUser.password_hash) : false;
    const hasCustomJwtSecret = Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET !== 'bimun_valledupar_secret_key_2026_un_model');

    res.json({
      success: true,
      audit: {
        is_using_default_password: isUsingDefaultPassword,
        has_custom_jwt_secret: hasCustomJwtSecret,
        username: user.username,
        role: user.role,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error en auditoría de seguridad', details: err.message });
  }
});

apiRouter.post('/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres para producción.' });
    }

    const dbUser = await executeQueryOne('SELECT * FROM users WHERE id = ?;', [user.id]);
    if (!dbUser || !bcrypt.compareSync(current_password, dbUser.password_hash)) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);
    await executeRunSql('UPDATE users SET password_hash = ? WHERE id = ?;', [hash, user.id]);

    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al cambiar contraseña', details: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN PROTECTED ENDPOINTS
// -------------------------------------------------------------

// Dashboard statistics
apiRouter.get('/admin/stats', authMiddleware, async (req, res) => {
  try {
    const comCount = (await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM committees;'))?.count || 0;
    const delTotal = (await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM delegations;'))?.count || 0;
    const delAssigned = (await executeQueryOne<{ count: number }>(`SELECT COUNT(*) as count FROM delegations WHERE status = 'assigned';`))?.count || 0;
    const regPending = (await executeQueryOne<{ count: number }>(`SELECT COUNT(*) as count FROM registrations WHERE status = 'pending';`))?.count || 0;
    const regTotal = (await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM registrations;'))?.count || 0;
    const cntCount = (await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM countries;'))?.count || 0;
    const docCount = (await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM documents;'))?.count || 0;
    const newsCount = (await executeQueryOne<{ count: number }>('SELECT COUNT(*) as count FROM news;'))?.count || 0;

    res.json({
      committees_total: comCount,
      delegations_total: delTotal,
      delegations_assigned: delAssigned,
      delegations_available: delTotal - delAssigned,
      registrations_pending: regPending,
      registrations_total: regTotal,
      countries_total: cntCount,
      documents_total: docCount,
      news_total: newsCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener estadísticas', details: err.message });
  }
});

// Settings CRUD
apiRouter.get('/admin/settings', authMiddleware, async (req, res) => {
  const rows = await executeQueryAll<{ key: string; value: string; updated_at: string }>('SELECT * FROM settings;');
  const settingsObj: Record<string, any> = {};
  const rawStringKeys = [
    'schema_json',
    'meta_title',
    'meta_description',
    'meta_keywords',
    'og_image_url',
    'twitter_handle',
    'bimun_name',
    'bimun_edition',
    'slogan',
    'hero_slogan',
    'hero_tagline',
    'institution_name',
    'institution_short'
  ];

  for (const r of rows) {
    if (rawStringKeys.includes(r.key)) {
      settingsObj[r.key] = r.value;
    } else {
      try {
        settingsObj[r.key] = JSON.parse(r.value);
      } catch {
        settingsObj[r.key] = r.value;
      }
    }
  }
  if (!settingsObj.start_date) {
    if (settingsObj.event_dates_iso && typeof settingsObj.event_dates_iso === 'object' && settingsObj.event_dates_iso.start) {
      settingsObj.start_date = settingsObj.event_dates_iso.start;
    } else {
      settingsObj.start_date = '2026-10-23';
    }
  }
  if (!settingsObj.end_date) {
    if (settingsObj.event_dates_iso && typeof settingsObj.event_dates_iso === 'object' && settingsObj.event_dates_iso.end) {
      settingsObj.end_date = settingsObj.event_dates_iso.end;
    } else {
      settingsObj.end_date = '2026-10-25';
    }
  }
  if (!settingsObj.inauguration_time) {
    settingsObj.inauguration_time = '08:30';
  }
  res.json(settingsObj);
});

apiRouter.put('/admin/settings', authMiddleware, async (req, res) => {
  try {
    const updates: Record<string, any> = req.body;
    const now = new Date().toISOString();

    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined) continue;
      const valStr = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '');
      await executeRunSql(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        [key, valStr, now]
      );
    }

    invalidatePublicDataCache();

    res.json({ success: true, message: 'Configuración guardada exitosamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar configuraciones', details: err.message });
  }
});

// Committees CRUD
apiRouter.get('/admin/committees', authMiddleware, async (req, res) => {
  const committees = await executeQueryAll('SELECT * FROM committees ORDER BY sort_order ASC, name ASC;');
  res.json(committees);
});

apiRouter.post('/admin/committees', authMiddleware, async (req, res) => {
  try {
    const {
      code,
      name,
      abbreviation,
      description,
      image_url,
      language,
      topic_a,
      topic_b,
      topic_c,
      president_name,
      president_photo,
      vicepresident_name,
      vicepresident_photo,
      status,
      sort_order,
    } = req.body;

    if (!name || !abbreviation || !code || !topic_a) {
      return res.status(400).json({ error: 'Nombre, código, sigla y Tema A son obligatorios.' });
    }

    const id = 'com_' + Date.now();
    const now = new Date().toISOString();

    await executeRunSql(
      `INSERT INTO committees (
        id, code, name, abbreviation, description, image_url, language,
        topic_a, topic_b, topic_c, president_name, president_photo,
        vicepresident_name, vicepresident_photo, status, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        code.trim().toUpperCase(),
        name.trim(),
        abbreviation.trim(),
        description || '',
        image_url || '',
        language || 'Español',
        topic_a.trim(),
        topic_b || '',
        topic_c || '',
        president_name || '',
        president_photo || '',
        vicepresident_name || '',
        vicepresident_photo || '',
        status || 'active',
        sort_order || 0,
        now,
      ]
    );

    res.status(201).json({ success: true, id, message: 'Comisión creada con éxito.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear comisión', details: err.message });
  }
});

apiRouter.put('/admin/committees/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      abbreviation,
      description,
      image_url,
      language,
      topic_a,
      topic_b,
      topic_c,
      president_name,
      president_photo,
      vicepresident_name,
      vicepresident_photo,
      status,
      sort_order,
    } = req.body;

    await executeRunSql(
      `UPDATE committees SET
        code = ?, name = ?, abbreviation = ?, description = ?, image_url = ?, language = ?,
        topic_a = ?, topic_b = ?, topic_c = ?, president_name = ?, president_photo = ?,
        vicepresident_name = ?, vicepresident_photo = ?, status = ?, sort_order = ?
       WHERE id = ?`,
      [
        code,
        name,
        abbreviation,
        description,
        image_url,
        language,
        topic_a,
        topic_b,
        topic_c,
        president_name,
        president_photo,
        vicepresident_name,
        vicepresident_photo,
        status,
        sort_order,
        id,
      ]
    );

    res.json({ success: true, message: 'Comisión actualizada con éxito.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar comisión', details: err.message });
  }
});

// Duplicate a committee
apiRouter.post('/admin/committees/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const com = await executeQueryOne<any>('SELECT * FROM committees WHERE id = ?;', [id]);
    if (!com) return res.status(404).json({ error: 'Comisión no encontrada' });

    const newId = 'com_' + Date.now();
    const newCode = (com.code + '_COPIA').substring(0, 15);
    const newName = com.name + ' (Copia)';
    const now = new Date().toISOString();

    await executeRunSql(
      `INSERT INTO committees (
        id, code, name, abbreviation, description, image_url, language,
        topic_a, topic_b, topic_c, president_name, president_photo,
        vicepresident_name, vicepresident_photo, status, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        newCode,
        newName,
        com.abbreviation + ' (C)',
        com.description,
        com.image_url,
        com.language,
        com.topic_a,
        com.topic_b,
        com.topic_c,
        com.president_name,
        com.president_photo,
        com.vicepresident_name,
        com.vicepresident_photo,
        'draft',
        com.sort_order + 1,
        now,
      ]
    );

    res.json({ success: true, id: newId, message: 'Comisión duplicada exitosamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al duplicar comisión', details: err.message });
  }
});

apiRouter.delete('/admin/committees/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM delegations WHERE committee_id = ?;', [id]);
    await executeRunSql('DELETE FROM committees WHERE id = ?;', [id]);
    res.json({ success: true, message: 'Comisión eliminada con éxito.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar comisión', details: err.message });
  }
});

// Countries CRUD
apiRouter.get('/admin/countries', authMiddleware, async (req, res) => {
  const countries = await executeQueryAll('SELECT * FROM countries ORDER BY name ASC;');
  res.json(countries);
});

apiRouter.post('/admin/countries', authMiddleware, async (req, res) => {
  try {
    const { name, official_name, code, flag_emoji, flag_url, additional_info, status } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Nombre y código ISO son requeridos.' });
    }

    const id = 'cnt_' + code.toLowerCase().replace(/[^a-z0-9]/g, '');
    await executeRunSql(
      `INSERT INTO countries (id, name, official_name, code, flag_emoji, flag_url, additional_info, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        official_name || name,
        code.trim().toUpperCase(),
        flag_emoji || '🏳️',
        flag_url || '',
        additional_info || '',
        status || 'active',
      ]
    );

    res.status(201).json({ success: true, id, message: 'País registrado con éxito.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al registrar país', details: err.message });
  }
});

apiRouter.put('/admin/countries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, official_name, code, flag_emoji, flag_url, additional_info, status } = req.body;

    await executeRunSql(
      `UPDATE countries SET name = ?, official_name = ?, code = ?, flag_emoji = ?, flag_url = ?, additional_info = ?, status = ?
       WHERE id = ?`,
      [name, official_name, code, flag_emoji, flag_url, additional_info, status, id]
    );

    res.json({ success: true, message: 'País actualizado.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar país', details: err.message });
  }
});

apiRouter.delete('/admin/countries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM delegations WHERE country_id = ?;', [id]);
    await executeRunSql('DELETE FROM countries WHERE id = ?;', [id]);
    res.json({ success: true, message: 'País eliminado.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar país', details: err.message });
  }
});

// Delegations CRUD (Relación Comisión <-> País <-> Delegado)
apiRouter.get('/admin/delegations', authMiddleware, async (req, res) => {
  const delegations = await executeQueryAll(`
    SELECT 
      d.*,
      c.name as committee_name, c.abbreviation as committee_abbr,
      cnt.name as country_name, cnt.code as country_code, cnt.flag_emoji
    FROM delegations d
    JOIN committees c ON d.committee_id = c.id
    JOIN countries cnt ON d.country_id = cnt.id
    ORDER BY c.sort_order ASC, cnt.name ASC;
  `);
  res.json(delegations);
});

apiRouter.post('/admin/delegations', authMiddleware, async (req, res) => {
  try {
    const { committee_id, country_id, delegate_name, delegate_school, delegate_email, delegate_phone, status, notes } = req.body;
    if (!committee_id || !country_id) {
      return res.status(400).json({ error: 'Comisión y país son requeridos.' });
    }

    const id = 'del_' + Date.now();
    const now = new Date().toISOString();

    await executeRunSql(
      `INSERT INTO delegations (
        id, committee_id, country_id, delegate_name, delegate_school, delegate_email, delegate_phone, status, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        committee_id,
        country_id,
        delegate_name || '',
        delegate_school || '',
        delegate_email || '',
        delegate_phone || '',
        status || 'available',
        notes || '',
        now,
      ]
    );

    res.status(201).json({ success: true, id, message: 'Delegación asignada exitosamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear delegación', details: err.message });
  }
});

apiRouter.put('/admin/delegations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { committee_id, country_id, delegate_name, delegate_school, delegate_email, delegate_phone, status, notes } = req.body;

    await executeRunSql(
      `UPDATE delegations SET
        committee_id = ?, country_id = ?, delegate_name = ?, delegate_school = ?,
        delegate_email = ?, delegate_phone = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        committee_id,
        country_id,
        delegate_name || '',
        delegate_school || '',
        delegate_email || '',
        delegate_phone || '',
        status || 'available',
        notes || '',
        id,
      ]
    );

    res.json({ success: true, message: 'Delegación actualizada.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar delegación', details: err.message });
  }
});

apiRouter.delete('/admin/delegations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM delegations WHERE id = ?;', [id]);
    res.json({ success: true, message: 'Delegación eliminada.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar delegación', details: err.message });
  }
});

// Batch populate country slots for a committee
apiRouter.post('/admin/delegations/batch-slots', authMiddleware, async (req, res) => {
  try {
    const { committee_id, country_ids } = req.body;
    if (!committee_id || !Array.isArray(country_ids) || country_ids.length === 0) {
      return res.status(400).json({ error: 'Comisión y lista de países son requeridos.' });
    }

    const now = new Date().toISOString();
    let createdCount = 0;

    for (const cntId of country_ids) {
      const existing = await executeQueryOne('SELECT id FROM delegations WHERE committee_id = ? AND country_id = ?;', [committee_id, cntId]);
      if (!existing) {
        const id = 'del_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        await executeRunSql(
          `INSERT INTO delegations (id, committee_id, country_id, delegate_name, delegate_school, delegate_email, delegate_phone, status, notes, created_at)
           VALUES (?, ?, ?, '', '', '', '', 'available', '', ?)`,
          [id, committee_id, cntId, now]
        );
        createdCount++;
      }
    }

    res.json({ success: true, message: `Se generaron ${createdCount} cupos de delegaciones para la comisión.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al generar cupos', details: err.message });
  }
});

// Registrations CRUD
apiRouter.get('/admin/registrations', authMiddleware, async (req, res) => {
  const list = await executeQueryAll('SELECT * FROM registrations ORDER BY created_at DESC;');
  res.json(list);
});

apiRouter.put('/admin/registrations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_committee_id, assigned_country_id, notes } = req.body;

    await executeRunSql(
      `UPDATE registrations SET
        status = ?, assigned_committee_id = ?, assigned_country_id = ?, notes = ?
       WHERE id = ?`,
      [status, assigned_committee_id || '', assigned_country_id || '', notes || '', id]
    );

    // If status is 'assigned' and committee & country are set, sync with delegations table!
    if (status === 'assigned' && assigned_committee_id && assigned_country_id) {
      const reg = await executeQueryOne<any>('SELECT * FROM registrations WHERE id = ?;', [id]);
      if (reg) {
        // check if delegation slot exists
        const existingDel = await executeQueryOne<any>(
          'SELECT * FROM delegations WHERE committee_id = ? AND country_id = ?;',
          [assigned_committee_id, assigned_country_id]
        );

        if (existingDel) {
          await executeRunSql(
            `UPDATE delegations SET
              delegate_name = ?, delegate_school = ?, delegate_email = ?, delegate_phone = ?, status = 'assigned'
             WHERE id = ?`,
            [reg.full_name, reg.school, reg.email, reg.phone, existingDel.id]
          );
        } else {
          const newDelId = 'del_' + Date.now();
          await executeRunSql(
            `INSERT INTO delegations (id, committee_id, country_id, delegate_name, delegate_school, delegate_email, delegate_phone, status, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned', 'Asignado desde inscripción', ?)`,
            [newDelId, assigned_committee_id, assigned_country_id, reg.full_name, reg.school, reg.email, reg.phone, new Date().toISOString()]
          );
        }
      }
    }

    res.json({ success: true, message: 'Estado de inscripción actualizado.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar inscripción', details: err.message });
  }
});

apiRouter.delete('/admin/registrations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM registrations WHERE id = ?;', [id]);
    res.json({ success: true, message: 'Inscripción eliminada.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar inscripción', details: err.message });
  }
});

// About Sections CRUD
apiRouter.get('/admin/about', authMiddleware, async (req, res) => {
  const sections = await executeQueryAll('SELECT * FROM about_sections ORDER BY sort_order ASC;');
  res.json(sections);
});

apiRouter.post('/admin/about', authMiddleware, canEditInstitutionalContent, async (req, res) => {
  try {
    const { section_key, title, subtitle, content, icon, sort_order, is_active } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'El título y el contenido son obligatorios.' });
    }
    const id = 'abt_' + Date.now();
    const finalKey = section_key ? section_key.trim().toLowerCase().replace(/\s+/g, '_') : id;
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    await executeRunSql(
      `INSERT INTO about_sections (id, section_key, title, subtitle, content, icon, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, finalKey, title.trim(), subtitle || '', content, icon || 'Globe', Number(sort_order) || 0, activeVal]
    );
    res.status(201).json({ success: true, id, message: 'Sección institucional creada exitosamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear sección institucional', details: err.message });
  }
});

apiRouter.put('/admin/about/:id', authMiddleware, canEditInstitutionalContent, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, content, icon, sort_order, is_active } = req.body;

    const existing = await executeQueryOne<any>('SELECT * FROM about_sections WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Sección no encontrada.' });
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedSubtitle = subtitle !== undefined ? subtitle : (existing.subtitle || '');
    const updatedContent = content !== undefined ? content : existing.content;
    const updatedIcon = icon !== undefined ? icon : (existing.icon || 'Globe');
    const updatedSortOrder = sort_order !== undefined ? Number(sort_order) : existing.sort_order;
    const updatedIsActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    await executeRunSql(
      `UPDATE about_sections SET title = ?, subtitle = ?, content = ?, icon = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [updatedTitle, updatedSubtitle, updatedContent, updatedIcon, updatedSortOrder, updatedIsActive, id]
    );
    res.json({ success: true, message: 'Sección actualizada correctamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar sección', details: err.message });
  }
});

apiRouter.delete('/admin/about/:id', authMiddleware, canEditInstitutionalContent, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM about_sections WHERE id = ?;', [id]);
    res.json({ success: true, message: 'Sección eliminada.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar sección', details: err.message });
  }
});

apiRouter.post('/admin/about/reset-defaults', authMiddleware, canEditInstitutionalContent, async (req, res) => {
  try {
    // Delete existing sections in active database
    await executeRunSql('DELETE FROM about_sections;');

    // Insert the 6 official BIMUN about sections
    for (const abt of DEFAULT_ABOUT_SECTIONS) {
      await executeRunSql(
        `INSERT INTO about_sections (id, section_key, title, subtitle, content, icon, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1);`,
        [abt.id, abt.section_key, abt.title, abt.subtitle, abt.content, abt.icon, abt.sort_order]
      );
    }

    const sections = await executeQueryAll('SELECT * FROM about_sections ORDER BY sort_order ASC;');
    res.json({
      success: true,
      message: 'Se han restablecido con éxito los 6 textos institucionales oficiales del BIMUN.',
      sections,
    });
  } catch (err: any) {
    console.error('Error resetting about sections:', err);
    res.status(500).json({ error: 'Error al restablecer secciones institucionales', details: err.message });
  }
});

// Schedule CRUD
apiRouter.get('/admin/schedule', authMiddleware, async (req, res) => {
  const items = await executeQueryAll('SELECT * FROM schedule ORDER BY date ASC, sort_order ASC;');
  res.json(items);
});

apiRouter.post('/admin/schedule', authMiddleware, async (req, res) => {
  try {
    const { day_label, date, time_start, time_end, activity, description, location, audience, sort_order } = req.body;
    const id = 'sch_' + Date.now();
    await executeRunSql(
      `INSERT INTO schedule (id, day_label, date, time_start, time_end, activity, description, location, audience, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, day_label, date, time_start, time_end, activity, description || '', location || '', audience || 'Todos', sort_order || 0]
    );
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear evento del cronograma', details: err.message });
  }
});

apiRouter.put('/admin/schedule/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { day_label, date, time_start, time_end, activity, description, location, audience, sort_order } = req.body;
    await executeRunSql(
      `UPDATE schedule SET day_label = ?, date = ?, time_start = ?, time_end = ?, activity = ?, description = ?, location = ?, audience = ?, sort_order = ?
       WHERE id = ?`,
      [day_label, date, time_start, time_end, activity, description, location, audience, sort_order, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar evento', details: err.message });
  }
});

apiRouter.delete('/admin/schedule/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM schedule WHERE id = ?;', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar evento', details: err.message });
  }
});

// Documents CRUD
apiRouter.get('/admin/documents', authMiddleware, async (req, res) => {
  const docs = await executeQueryAll('SELECT * FROM documents ORDER BY sort_order ASC;');
  res.json(docs);
});

apiRouter.post('/admin/documents', authMiddleware, async (req, res) => {
  try {
    const { title, category, file_url, description, file_size, is_featured, sort_order } = req.body;
    const id = 'doc_' + Date.now();
    const now = new Date().toISOString();
    await executeRunSql(
      `INSERT INTO documents (id, title, category, file_url, description, file_size, is_featured, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, category || 'General', file_url || '#', description || '', file_size || '', is_featured ? 1 : 0, sort_order || 0, now]
    );
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear documento', details: err.message });
  }
});

apiRouter.put('/admin/documents/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, file_url, description, file_size, is_featured, sort_order } = req.body;
    await executeRunSql(
      `UPDATE documents SET title = ?, category = ?, file_url = ?, description = ?, file_size = ?, is_featured = ?, sort_order = ?
       WHERE id = ?`,
      [title, category, file_url, description, file_size, is_featured ? 1 : 0, sort_order, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar documento', details: err.message });
  }
});

apiRouter.delete('/admin/documents/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM documents WHERE id = ?;', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar documento', details: err.message });
  }
});

// Document Categories CRUD (MySQL compatible)
apiRouter.get('/admin/documents/categories', authMiddleware, async (req, res) => {
  try {
    const row = await executeQueryOne<{ value: string }>(`SELECT value FROM settings WHERE key = 'document_categories';`);
    let categories: string[] = [];
    if (row && row.value) {
      try {
        categories = JSON.parse(row.value);
      } catch {
        categories = [];
      }
    }
    if (!categories || categories.length === 0) {
      categories = ['Protocolo', 'Académico', 'Plantillas', 'Inscripción', 'Normativa'];
    }

    // Collect counts per category
    const counts = await executeQueryAll<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM documents GROUP BY category;'
    );
    const categoryCounts: Record<string, number> = {};
    for (const c of counts) {
      if (c.category) {
        categoryCounts[c.category] = c.count;
        if (!categories.includes(c.category)) {
          categories.push(c.category);
        }
      }
    }

    res.json({ categories, categoryCounts });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener categorías de los documentos', details: err.message });
  }
});

apiRouter.post('/admin/documents/categories', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'academico'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para modificar categorías de documentos.' });
    }

    const { categories, renameFrom, renameTo, deleteCategory, reassignTo } = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar una lista válida de categorías.' });
    }

    const cleanedCategories = Array.from(
      new Set(
        categories
          .map((c: string) => (typeof c === 'string' ? c.trim() : ''))
          .filter(Boolean)
      )
    );

    // Handle renaming category across existing documents
    if (renameFrom && renameTo && renameFrom.trim() !== renameTo.trim()) {
      await executeRunSql('UPDATE documents SET category = ? WHERE category = ?;', [renameTo.trim(), renameFrom.trim()]);
    }

    // Handle deleting category and reassigning documents
    if (deleteCategory) {
      const fallbackTarget = reassignTo ? reassignTo.trim() : (cleanedCategories[0] || 'General');
      await executeRunSql('UPDATE documents SET category = ? WHERE category = ?;', [fallbackTarget, deleteCategory.trim()]);
    }

    const now = new Date().toISOString();
    await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', [
      'document_categories',
      JSON.stringify(cleanedCategories),
      now,
    ]);

    const counts = await executeQueryAll<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM documents GROUP BY category;'
    );
    const categoryCounts: Record<string, number> = {};
    for (const c of counts) {
      if (c.category) {
        categoryCounts[c.category] = c.count;
      }
    }

    res.json({ success: true, categories: cleanedCategories, categoryCounts });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar categorías de documentos', details: err.message });
  }
});

// Gallery CRUD & Categories
apiRouter.get('/admin/gallery/categories', authMiddleware, async (req, res) => {
  try {
    const row = await executeQueryOne<{ value: string }>(`SELECT value FROM settings WHERE key = 'gallery_categories';`);
    let categories: string[] = [];
    if (row && row.value) {
      try {
        categories = JSON.parse(row.value);
      } catch {
        categories = [];
      }
    }
    if (!categories || categories.length === 0) {
      categories = ['Debate', 'Protocolo', 'Negociación', 'Crisis', 'Premiación', 'Campus', 'Social', 'Inauguración', 'Clausura'];
    }

    // Also collect counts per category and include any category present in existing photos
    const counts = await executeQueryAll<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM gallery GROUP BY category;'
    );
    const categoryCounts: Record<string, number> = {};
    for (const c of counts) {
      if (c.category) {
        categoryCounts[c.category] = c.count;
        if (!categories.includes(c.category)) {
          categories.push(c.category);
        }
      }
    }

    res.json({ categories, categoryCounts });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener categorías de la galería', details: err.message });
  }
});

apiRouter.post('/admin/gallery/categories', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'prensa'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para modificar categorías de la galería.' });
    }

    const { categories, renameFrom, renameTo, deleteCategory, reassignTo } = req.body;
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar una lista válida de categorías.' });
    }

    const cleanedCategories = Array.from(
      new Set(
        categories
          .map((c: string) => (typeof c === 'string' ? c.trim() : ''))
          .filter(Boolean)
      )
    );

    // Handle renaming category across existing photos
    if (renameFrom && renameTo && renameFrom.trim() !== renameTo.trim()) {
      await executeRunSql('UPDATE gallery SET category = ? WHERE category = ?;', [renameTo.trim(), renameFrom.trim()]);
    }

    // Handle deleting category and reassigning photos
    if (deleteCategory) {
      const fallbackTarget = reassignTo ? reassignTo.trim() : (cleanedCategories[0] || 'Debate');
      await executeRunSql('UPDATE gallery SET category = ? WHERE category = ?;', [fallbackTarget, deleteCategory.trim()]);
    }

    const now = new Date().toISOString();
    await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', [
      'gallery_categories',
      JSON.stringify(cleanedCategories),
      now,
    ]);

    const counts = await executeQueryAll<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM gallery GROUP BY category;'
    );
    const categoryCounts: Record<string, number> = {};
    for (const c of counts) {
      if (c.category) {
        categoryCounts[c.category] = c.count;
      }
    }

    res.json({ success: true, categories: cleanedCategories, categoryCounts });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar categorías', details: err.message });
  }
});

apiRouter.get('/admin/gallery', authMiddleware, async (req, res) => {
  const items = await executeQueryAll('SELECT * FROM gallery ORDER BY sort_order ASC, created_at DESC;');
  res.json(items);
});

apiRouter.post('/admin/gallery', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'prensa'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para agregar fotografías.' });
    }

    const { title, caption, image_url, category, edition, sort_order } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'La URL o archivo de imagen es obligatorio.' });
    }

    const id = 'gal_' + Date.now();
    const now = new Date().toISOString();
    const finalCategory = (category && category.trim()) || 'Debate';

    await executeRunSql(
      `INSERT INTO gallery (id, title, caption, image_url, category, edition, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title || 'Fotografía BIMUN', caption || '', image_url, finalCategory, edition || 'BIMUN XXVII', sort_order || 0, now]
    );

    // Auto-register category in settings if new
    try {
      const catRow = await executeQueryOne<{ value: string }>(`SELECT value FROM settings WHERE key = 'gallery_categories';`);
      if (catRow && catRow.value) {
        const cats = JSON.parse(catRow.value);
        if (Array.isArray(cats) && !cats.includes(finalCategory)) {
          cats.push(finalCategory);
          await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', [
            'gallery_categories',
            JSON.stringify(cats),
            now,
          ]);
        }
      }
    } catch {}

    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al agregar foto', details: err.message });
  }
});

// Batch photo upload endpoint
apiRouter.post('/admin/gallery/batch', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'prensa'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para subir fotografías en lote.' });
    }

    const { photos } = req.body;
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos una fotografía para subir.' });
    }

    const now = new Date().toISOString();
    const insertedIds: string[] = [];
    const usedCategories = new Set<string>();

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      if (!p || !p.image_url) continue;

      const id = 'gal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + i;
      const title = (p.title && p.title.trim()) || `Fotografía BIMUN ${i + 1}`;
      const caption = (p.caption && p.caption.trim()) || '';
      const category = (p.category && p.category.trim()) || 'Debate';
      const edition = (p.edition && p.edition.trim()) || 'BIMUN XXVII';
      const sort_order = Number(p.sort_order ?? i);

      usedCategories.add(category);

      await executeRunSql(
        `INSERT INTO gallery (id, title, caption, image_url, category, edition, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, caption, p.image_url, category, edition, sort_order, now]
      );
      insertedIds.push(id);
    }

    // Auto-register new categories in settings
    try {
      const catRow = await executeQueryOne<{ value: string }>(`SELECT value FROM settings WHERE key = 'gallery_categories';`);
      let currentCategories: string[] = [];
      if (catRow && catRow.value) {
        try {
          currentCategories = JSON.parse(catRow.value);
        } catch {
          currentCategories = [];
        }
      }
      let changed = false;
      for (const cat of usedCategories) {
        if (cat && !currentCategories.includes(cat)) {
          currentCategories.push(cat);
          changed = true;
        }
      }
      if (changed) {
        await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', [
          'gallery_categories',
          JSON.stringify(currentCategories),
          now,
        ]);
      }
    } catch {}

    res.status(201).json({
      success: true,
      count: insertedIds.length,
      ids: insertedIds,
      message: `Se agregaron exitosamente ${insertedIds.length} fotografías a la galería.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al procesar subida masiva de fotos', details: err.message });
  }
});

// Batch delete photos
apiRouter.post('/admin/gallery/batch-delete', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'prensa'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar fotografías.' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Debe especificar los identificadores de fotos a eliminar.' });
    }

    for (const id of ids) {
      await executeRunSql('DELETE FROM gallery WHERE id = ?;', [id]);
    }

    res.json({ success: true, count: ids.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar fotografías seleccionadas', details: err.message });
  }
});

// Reset gallery to default demo photos
apiRouter.post('/admin/gallery/reset-defaults', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'prensa'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para restaurar la galería.' });
    }

    // Delete existing gallery items in active database
    await executeRunSql('DELETE FROM gallery;');

    const now = new Date().toISOString();
    for (const g of DEFAULT_GALLERY_ITEMS) {
      await executeRunSql(
        `INSERT INTO gallery (id, title, caption, image_url, category, edition, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [g.id, g.title, g.caption, g.image_url, g.cat, g.edition, g.order, now]
      );
    }

    // Ensure default gallery categories in settings
    const categoriesJson = JSON.stringify(DEFAULT_GALLERY_CATEGORIES);
    await executeRunSql(
      `INSERT INTO settings (key, value, updated_at) VALUES ('gallery_categories', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [categoriesJson, now]
    );

    const items = await executeQueryAll('SELECT * FROM gallery ORDER BY sort_order ASC, created_at DESC;');

    res.json({
      success: true,
      count: items.length,
      message: 'Galería de fotografías y categorías de demostración restauradas con éxito.',
      gallery: items,
      categories: DEFAULT_GALLERY_CATEGORIES,
    });
  } catch (err: any) {
    console.error('Error resetting gallery:', err);
    res.status(500).json({ error: 'Error al restaurar galería predeterminada', details: err.message });
  }
});

apiRouter.put('/admin/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'prensa'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar fotografías.' });
    }

    const { id } = req.params;
    const { title, caption, image_url, category, edition, sort_order } = req.body;
    await executeRunSql(
      `UPDATE gallery SET title = ?, caption = ?, image_url = ?, category = ?, edition = ?, sort_order = ?
       WHERE id = ?`,
      [title, caption, image_url, category, edition, sort_order, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar foto', details: err.message });
  }
});

apiRouter.delete('/admin/gallery/:id', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!['admin', 'superadmin', 'coordinador', 'prensa'].includes(user?.role)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar fotografías.' });
    }

    const { id } = req.params;
    await executeRunSql('DELETE FROM gallery WHERE id = ?;', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar foto', details: err.message });
  }
});

// Organizing Team CRUD
apiRouter.get('/admin/team', authMiddleware, async (req, res) => {
  const team = await executeQueryAll('SELECT * FROM organizing_team ORDER BY sort_order ASC;');
  res.json(team);
});

apiRouter.post('/admin/team', authMiddleware, async (req, res) => {
  try {
    const { name, role, category, photo_url, bio, email, sort_order } = req.body;
    const id = 'tm_' + Date.now();
    await executeRunSql(
      `INSERT INTO organizing_team (id, name, role, category, photo_url, bio, email, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, role, category || 'Secretaría', photo_url || '', bio || '', email || '', sort_order || 0]
    );
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al agregar miembro del comité', details: err.message });
  }
});

apiRouter.put('/admin/team/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, category, photo_url, bio, email, sort_order } = req.body;
    await executeRunSql(
      `UPDATE organizing_team SET name = ?, role = ?, category = ?, photo_url = ?, bio = ?, email = ?, sort_order = ?
       WHERE id = ?`,
      [name, role, category, photo_url, bio, email, sort_order, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar miembro', details: err.message });
  }
});

apiRouter.delete('/admin/team/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM organizing_team WHERE id = ?;', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar miembro', details: err.message });
  }
});

// News CRUD
apiRouter.get('/admin/news', authMiddleware, async (req, res) => {
  const news = await executeQueryAll('SELECT * FROM news ORDER BY publish_date DESC;');
  res.json(news);
});

apiRouter.post('/admin/news', authMiddleware, async (req, res) => {
  try {
    const { title, slug, excerpt, content, image_url, category, publish_date, is_published } = req.body;
    const id = 'nw_' + Date.now();
    const cleanSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await executeRunSql(
      `INSERT INTO news (id, title, slug, excerpt, content, image_url, category, publish_date, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title, cleanSlug, excerpt || '', content, image_url || '', category || 'General', publish_date || new Date().toISOString().split('T')[0], is_published ? 1 : 0]
    );
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al publicar noticia', details: err.message });
  }
});

apiRouter.put('/admin/news/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, image_url, category, publish_date, is_published } = req.body;
    await executeRunSql(
      `UPDATE news SET title = ?, slug = ?, excerpt = ?, content = ?, image_url = ?, category = ?, publish_date = ?, is_published = ?
       WHERE id = ?`,
      [title, slug, excerpt, content, image_url, category, publish_date, is_published ? 1 : 0, id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar noticia', details: err.message });
  }
});

apiRouter.delete('/admin/news/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await executeRunSql('DELETE FROM news WHERE id = ?;', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar noticia', details: err.message });
  }
});

// -------------------------------------------------------------
// COMPREHENSIVE BACKUP & ANNUAL EDITION CYCLE MANAGEMENT
// -------------------------------------------------------------
import {
  generateFullBackup,
  restoreFullBackup,
  createEditionArchive,
  listEditionArchives,
  getEditionArchiveById,
  deleteEditionArchive,
  startNewModelYearEdition,
} from './backupService.ts';

// Full Export with Multimedia Catalog & All Structured Data
apiRouter.get('/admin/backups/export', authMiddleware, adminOnlyMiddleware, async (req: any, res) => {
  try {
    const adminUser = req.user?.display_name || req.user?.username || 'Administrador';
    const backup = await generateFullBackup(adminUser);
    const editionTag = (backup.metadata.edition || 'BIMUN').replace(/\s+/g, '_');
    const filename = `${editionTag}_backup_${backup.metadata.year}_${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al exportar respaldo completo', details: err.message });
  }
});

// Legacy backwards-compatible export endpoint
apiRouter.get('/admin/export-database', authMiddleware, adminOnlyMiddleware, async (req: any, res) => {
  try {
    const adminUser = req.user?.display_name || req.user?.username || 'Administrador';
    const backup = await generateFullBackup(adminUser);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="bimun_backup_${Date.now()}.json"`);
    res.json(backup);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al exportar base de datos', details: err.message });
  }
});

// Restore from uploaded JSON Backup
apiRouter.post('/admin/backups/restore', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'El cuerpo de la solicitud no contiene un archivo de respaldo válido.' });
    }
    const result = await restoreFullBackup(payload);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al restaurar respaldo', details: err.message });
  }
});

// List all archived editions and snapshots
apiRouter.get('/admin/editions/history', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const archives = await listEditionArchives();
    res.json(archives);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener historial de ediciones', details: err.message });
  }
});

// Create a manual snapshot of the current state
apiRouter.post('/admin/editions/create-snapshot', authMiddleware, adminOnlyMiddleware, async (req: any, res) => {
  try {
    const { editionName, editionYear, title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Debes proporcionar un título para el respaldo.' });
    }
    const adminUser = req.user?.display_name || req.user?.username || 'Administrador';
    const result = await createEditionArchive(
      editionName || 'BIMUN Actual',
      editionYear || new Date().getFullYear().toString(),
      title,
      description || '',
      adminUser
    );
    res.json({ success: true, message: 'Copia de seguridad guardada exitosamente en el servidor.', archiveId: result.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear copia de seguridad', details: err.message });
  }
});

// Download a specific archive snapshot JSON
apiRouter.get('/admin/editions/archive-download/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const archive = await getEditionArchiveById(req.params.id);
    if (!archive) {
      return res.status(404).json({ error: 'Archivo histórico no encontrado.' });
    }
    const snapshot = JSON.parse(archive.snapshot_json);
    const filename = `${archive.edition_name.replace(/\s+/g, '_')}_${archive.edition_year}_backup.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al descargar archivo de respaldo', details: err.message });
  }
});

// Restore from an existing server-side archived snapshot
apiRouter.post('/admin/editions/restore-archive/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const archive = await getEditionArchiveById(req.params.id);
    if (!archive) {
      return res.status(404).json({ error: 'Archivo histórico no encontrado.' });
    }
    const snapshot = JSON.parse(archive.snapshot_json);
    const result = await restoreFullBackup(snapshot);
    res.json({
      success: true,
      message: `Edición ${archive.edition_name} (${archive.edition_year}) restaurada con éxito.`,
      restoredCounts: result.restoredCounts,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al restaurar edición archivada', details: err.message });
  }
});

// Delete an archived snapshot from history
apiRouter.delete('/admin/editions/archive/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    await deleteEditionArchive(req.params.id);
    res.json({ success: true, message: 'Respaldo eliminado del historial.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar respaldo', details: err.message });
  }
});

// Wizard to transition to a brand new annual MUN Model
apiRouter.post('/admin/editions/start-new', authMiddleware, adminOnlyMiddleware, async (req: any, res) => {
  try {
    const {
      newEditionName,
      newEditionYear,
      newSlogan,
      newDates,
      archiveCurrentEdition,
      archiveTitle,
      archiveDescription,
      resetRegistrations,
      resetDelegationStatus,
      resetSchedule,
      retainCommittees,
      retainCountries,
      retainGalleryHistory,
      retainTeam,
    } = req.body;

    if (!newEditionName || !newEditionYear) {
      return res.status(400).json({ error: 'El nombre y el año de la nueva edición son obligatorios.' });
    }

    const adminUser = req.user?.display_name || req.user?.username || 'Administrador';
    const result = await startNewModelYearEdition(
      {
        newEditionName,
        newEditionYear,
        newSlogan,
        newDates,
        archiveCurrentEdition: archiveCurrentEdition ?? true,
        archiveTitle,
        archiveDescription,
        resetRegistrations: resetRegistrations ?? true,
        resetDelegationStatus: resetDelegationStatus ?? true,
        resetSchedule: resetSchedule ?? true,
        retainCommittees: retainCommittees ?? true,
        retainCountries: retainCountries ?? true,
        retainGalleryHistory: retainGalleryHistory ?? true,
        retainTeam: retainTeam ?? false,
      },
      adminUser
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al iniciar nueva edición anual', details: err.message });
  }
});

// -------------------------------------------------------------
// DYNAMIC DATABASE CONFIGURATION & MANAGEMENT (PostgreSQL / MySQL / SQLite)
// -------------------------------------------------------------
import {
  getDatabaseStatus,
  getCurrentConfigSafe,
  testConnection,
  switchDatabaseEngine,
  migrateCurrentDataToTarget,
} from './dbManager.ts';

// Get current database status and configuration
apiRouter.get('/admin/db-config', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const status = getDatabaseStatus();
    const config = getCurrentConfigSafe();
    res.json({ status, config });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener estado de base de datos', details: err.message });
  }
});

// Test connection to PostgreSQL or MySQL without applying
apiRouter.post('/admin/db-test', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { type, host, port, database, user, password, ssl, connectionString } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Tipo de base de datos requerido.' });
    }

    const result = await testConnection({
      type,
      host,
      port: port ? Number(port) : undefined,
      database,
      user,
      password,
      ssl: Boolean(ssl),
      connectionString,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error probando conexión: ${err.message}` });
  }
});

// Switch active database engine (SQLite, PostgreSQL or MySQL)
apiRouter.post('/admin/db-switch', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { type, host, port, database, user, password, ssl, connectionString } = req.body;
    if (!type || !['sqlite', 'postgres', 'mysql'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de base de datos inválido. Use sqlite, postgres o mysql.' });
    }

    const result = await switchDatabaseEngine({
      type,
      host,
      port: port ? Number(port) : undefined,
      database,
      user,
      password,
      ssl: Boolean(ssl),
      connectionString,
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        status: getDatabaseStatus(),
        config: getCurrentConfigSafe(),
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        status: getDatabaseStatus(),
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error cambiando base de datos: ${err.message}` });
  }
});

// Migrate current data to target database (PostgreSQL or MySQL)
apiRouter.post('/admin/db-migrate', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { type, host, port, database, user, password, ssl, connectionString } = req.body;
    if (!type || (type !== 'postgres' && type !== 'mysql')) {
      return res.status(400).json({ error: 'Solo se puede migrar hacia PostgreSQL o MySQL.' });
    }

    const result = await migrateCurrentDataToTarget({
      type,
      host,
      port: port ? Number(port) : undefined,
      database,
      user,
      password,
      ssl: Boolean(ssl),
      connectionString,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Error durante migración: ${err.message}` });
  }
});

// Admin-only: Clear test data (registrations, delegations, committees, countries, schedule, docs, gallery, news, team, about)
apiRouter.post('/admin/system/clear-test-data', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el perfil administrador puede limpiar los datos del sistema.' });
    }

    const result = clearDemoData();
    res.json({
      success: true,
      message: 'Todos los datos de prueba han sido eliminados satisfactoriamente. Tu configuración institucional y usuarios se mantienen intactos.',
      clearedCounts: result.clearedCounts,
    });
  } catch (err: any) {
    console.error('Error clearing test data:', err);
    res.status(500).json({ error: 'Error al limpiar datos de prueba', details: err.message });
  }
});

// Admin-only: Reload initial seed demonstration data
apiRouter.post('/admin/system/load-seed-data', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo el perfil administrador puede recargar los datos de prueba.' });
    }

    const result = reloadDemoData();
    res.json({
      success: true,
      message: 'Datos de prueba de BIMUN recargados exitosamente (comisiones, países, cronograma, equipo, documentos, noticias e inscripciones de muestra).',
    });
  } catch (err: any) {
    console.error('Error loading seed data:', err);
    res.status(500).json({ error: 'Error al recargar datos de prueba', details: err.message });
  }
});

// -------------------------------------------------------------
// USER MANAGEMENT & PROFILES (ADMIN ONLY)
// -------------------------------------------------------------

// List all system users
apiRouter.get('/admin/users', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const users = await executeQueryAll<any>('SELECT id, username, display_name, role, created_at FROM users ORDER BY created_at ASC;');
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: err.message });
  }
});

// Create new user
apiRouter.post('/admin/users', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { username, display_name, password, role } = req.body;
    if (!username || !display_name || !password) {
      return res.status(400).json({ error: 'Nombre de usuario, nombre visible y contraseña son requeridos.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await executeQueryOne('SELECT id FROM users WHERE username = ?;', [cleanUsername]);
    if (existing) {
      return res.status(409).json({ error: 'El nombre de usuario ya está registrado en el sistema.' });
    }

    const validRoles = ['admin', 'superadmin', 'coordinador', 'academico', 'prensa'];
    const assignedRole = validRoles.includes(role) ? role : 'coordinador';

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    await executeRunSql(
      'INSERT INTO users (id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?);',
      [id, cleanUsername, password_hash, display_name.trim(), assignedRole, now]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente.',
      user: { id, username: cleanUsername, display_name: display_name.trim(), role: assignedRole, created_at: now },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear usuario', details: err.message });
  }
});

// Update user details (name, role)
apiRouter.put('/admin/users/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, role } = req.body;
    const currentUser = (req as any).user;

    const existing = await executeQueryOne<any>('SELECT id, role FROM users WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Safety: don't allow removing own admin role
    if (id === currentUser.id && role && role !== 'admin' && role !== 'superadmin') {
      return res.status(400).json({ error: 'No puedes degradar tu propio rol de administrador.' });
    }

    const validRoles = ['admin', 'superadmin', 'coordinador', 'academico', 'prensa'];
    const updatedRole = role && validRoles.includes(role) ? role : existing.role;
    const updatedName = display_name ? display_name.trim() : undefined;

    if (updatedName) {
      await executeRunSql('UPDATE users SET display_name = ?, role = ? WHERE id = ?;', [updatedName, updatedRole, id]);
    } else {
      await executeRunSql('UPDATE users SET role = ? WHERE id = ?;', [updatedRole, id]);
    }

    res.json({ success: true, message: 'Usuario actualizado correctamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar usuario', details: err.message });
  }
});

// Reset user password (admin reset)
apiRouter.post('/admin/users/:id/reset-password', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const existing = await executeQueryOne('SELECT id FROM users WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(new_password, salt);
    await executeRunSql('UPDATE users SET password_hash = ? WHERE id = ?;', [hash, id]);

    res.json({ success: true, message: 'Contraseña restablecida exitosamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al restablecer contraseña', details: err.message });
  }
});

// Delete user
apiRouter.delete('/admin/users/:id', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    if (id === currentUser.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de usuario en sesión.' });
    }

    const existing = await executeQueryOne<any>('SELECT id, role, username FROM users WHERE id = ?;', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Safety guard: Prevent deleting the last remaining admin or superadmin
    if (existing.role === 'admin' || existing.role === 'superadmin') {
      const remainingAdmins = await executeQueryAll<any>(
        "SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND id != ?;",
        [id]
      );
      if (!remainingAdmins || remainingAdmins.length === 0) {
        return res.status(400).json({
          error: 'Acción bloqueada por seguridad: Este es el único administrador activo del sistema. Debes crear o designar otro administrador antes de eliminarlo.'
        });
      }
    }

    await executeRunSql('DELETE FROM users WHERE id = ?;', [id]);
    res.json({ success: true, message: 'Usuario eliminado del sistema.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar usuario', details: err.message });
  }
});

// -------------------------------------------------------------
// SMTP & GOOGLE WORKSPACE EMAIL ENDPOINTS (ADMIN ONLY)
// -------------------------------------------------------------

// Get SMTP Configuration (safe view without exposing raw password)
apiRouter.get('/admin/smtp/config', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const config = getSmtpConfig();
    res.json({
      success: true,
      config: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        has_password: Boolean(config.password && config.password.length > 0),
        from_name: config.from_name,
        reply_to: config.reply_to || '',
        is_enabled: config.is_enabled,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener configuración SMTP', details: err.message });
  }
});

// Update SMTP Configuration
apiRouter.put('/admin/smtp/config', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { host, port, secure, user, password, from_name, reply_to, is_enabled } = req.body;

    saveSmtpConfig({
      host: host ? host.trim() : 'smtp.gmail.com',
      port: port ? Number(port) : 465,
      secure: secure !== undefined ? Boolean(secure) : true,
      user: user ? user.trim() : '',
      password: password !== undefined ? password : '',
      from_name: from_name ? from_name.trim() : 'BIMUN Oficial',
      reply_to: reply_to ? reply_to.trim() : '',
      is_enabled: is_enabled !== undefined ? Boolean(is_enabled) : false,
    });

    res.json({ success: true, message: 'Configuración SMTP guardada correctamente.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al guardar configuración SMTP', details: err.message });
  }
});

// Verify connection with SMTP server
apiRouter.post('/admin/smtp/verify', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { host, port, secure, user, password } = req.body;
    let customConfig = undefined;
    if (user && password) {
      customConfig = {
        host: host || 'smtp.gmail.com',
        port: port ? Number(port) : 465,
        secure: secure !== undefined ? Boolean(secure) : true,
        user: user.trim(),
        password: password.trim().replace(/\s+/g, ''),
        from_name: 'BIMUN Test',
        is_enabled: true,
      };
    }

    const result = await verifySmtpConnection(customConfig);
    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send test email
apiRouter.post('/admin/smtp/send-test', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    const { target_email, host, port, secure, user, password, from_name } = req.body;
    if (!target_email) {
      return res.status(400).json({ error: 'Se requiere una dirección de correo destinataria para la prueba.' });
    }

    let customConfig = undefined;
    if (user && password) {
      customConfig = {
        host: host || 'smtp.gmail.com',
        port: port ? Number(port) : 465,
        secure: secure !== undefined ? Boolean(secure) : true,
        user: user.trim(),
        password: password.trim().replace(/\s+/g, ''),
        from_name: from_name || 'BIMUN Oficial',
        is_enabled: true,
      };
    }

    const result = await sendTestEmail(target_email.trim(), customConfig);
    if (result.success) {
      res.json({ success: true, message: result.message, messageId: result.messageId });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI-generated suggestions for meta_title, meta_description, and meta_keywords using Gemini with robust fallbacks
apiRouter.post('/admin/suggest-seo', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  let eventName = 'BIMUN';
  let slogan = '';
  let institution = 'Colegio Bilingüe de Valledupar';

  try {
    // Query active settings
    const rawSettings = await executeQueryAll<{ key: string; value: string }>('SELECT `key`, value FROM settings;');
    const settings: Record<string, string> = {};
    for (const r of rawSettings) {
      settings[r.key] = r.value;
    }

    // Query institutional about sections
    const rawAbout = await executeQueryAll<{ title: string; subtitle: string; content: string }>(
      'SELECT title, subtitle, content FROM about_sections WHERE is_active = 1;'
    );

    // Query committees
    const rawCommittees = await executeQueryAll<{ name: string; abbreviation: string; topic_a: string }>(
      "SELECT name, abbreviation, topic_a FROM committees WHERE status = 'active';"
    );

    // Construct metadata summary of the event for Gemini
    eventName = settings['bimun_name'] || settings['bimun_edition'] || 'BIMUN XXV';
    slogan = settings['slogan'] || settings['hero_slogan'] || 'Debate, liderazgo y diplomacia internacional.';
    const tagline = settings['hero_tagline'] || '';
    institution = settings['institution_name'] || 'Fundación Colegio Bilingüe de Valledupar';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('La API Key de Gemini no está configurada.');
    }

    let contentContext = `Nombre del Evento: ${eventName}\nLema/Slogan: ${slogan}\nSubtítulo/Tagline: ${tagline}\nInstitución Organizadora: ${institution}\n\nSecciones de Información:\n`;
    for (const abt of rawAbout) {
      contentContext += `- ${abt.title}: ${abt.subtitle}. ${abt.content.slice(0, 150)}...\n`;
    }

    contentContext += `\nComisiones/Comités Activos:\n`;
    for (const com of rawCommittees) {
      contentContext += `- ${com.name} (${com.abbreviation}): ${com.topic_a.slice(0, 150)}\n`;
    }

    // Instantiate Gemini SDK with proper parameters and User-Agent
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Eres un estratega experto en marketing digital, redacción web y SEO para eventos académicos internacionales.
Suministrado el siguiente contexto real sobre el Modelo de Naciones Unidas "${eventName}" (BIMUN) de la institución "${institution}", tu tarea es generar un Meta Title, una Meta Description y una lista de Meta Keywords optimizados para SEO para la página de inicio.

CONTEXTO REAL DEL EVENTO:
${contentContext}

REGLAS DE GENERACIÓN DE SEO:
1. El "meta_title" debe tener entre 30 y 60 caracteres. Debe ser atractivo, incluir el nombre "${eventName}", el Colegio Bilingüe de Valledupar, y resumir el evento de forma persuasiva.
2. La "meta_description" debe tener entre 120 y 160 caracteres. Debe capturar la esencia del modelo, usar palabras clave como debate, liderazgo, diplomacia, Valledupar, etc., e invitar a delegados a inscribirse o participar con un claro llamado a la acción.
3. El "meta_keywords" debe ser una lista de entre 8 y 12 palabras o frases clave altamente relevantes separadas por comas (ejemplo: ${eventName}, Modelo de Naciones Unidas, ${institution}, Valledupar, Debate Académico, Diplomacia, Liderazgo Estudiantil, Cesar, Colombia, Oratoria, Resoluciones ONU).
4. El resultado debe venir estrictamente en español, con excelente ortografía y redacción impecable. Evita clichés de inteligencia artificial.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meta_title: {
                type: Type.STRING,
                description: 'Sugerencia de título meta (Meta Title) en español para SEO de máximo 60 caracteres.'
              },
              meta_description: {
                type: Type.STRING,
                description: 'Sugerencia de descripción meta (Meta Description) en español para SEO de entre 120 y 160 caracteres.'
              },
              meta_keywords: {
                type: Type.STRING,
                description: 'Lista de 8 a 12 palabras o frases clave separadas por comas para meta_keywords.'
              }
            },
            required: ['meta_title', 'meta_description', 'meta_keywords']
          }
        }
      });
    } catch (firstErr: any) {
      console.warn('First attempt with gemini-3.8-flash failed, trying fallback to gemini-flash-latest...', firstErr.message || firstErr);
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              meta_title: {
                type: Type.STRING,
                description: 'Sugerencia de título meta (Meta Title) en español para SEO de máximo 60 caracteres.'
              },
              meta_description: {
                type: Type.STRING,
                description: 'Sugerencia de descripción meta (Meta Description) en español para SEO de entre 120 y 160 caracteres.'
              },
              meta_keywords: {
                type: Type.STRING,
                description: 'Lista de 8 a 12 palabras o frases clave separadas por comas para meta_keywords.'
              }
            },
            required: ['meta_title', 'meta_description', 'meta_keywords']
          }
        }
      });
    }

    const text = response.text;
    if (!text) {
      throw new Error('La respuesta generada por Gemini fue nula o vacía.');
    }

    const parsedResult = JSON.parse(text.trim());
    const final_meta_title = (parsedResult.meta_title || `${eventName} | Modelo de Naciones Unidas`).trim().slice(0, 70);
    const final_meta_description = (parsedResult.meta_description || slogan).trim().slice(0, 160);
    const final_meta_keywords = (parsedResult.meta_keywords || `${eventName}, Modelo de Naciones Unidas, ${institution}, Valledupar, Debate Académico, Diplomacia, Liderazgo`).trim();

    // Persist explicitly to settings table so that 'Sugerir con IA' automatically stores keywords and metadata in the DB
    const now = new Date().toISOString();
    await executeRunSql(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      ['meta_title', final_meta_title, now]
    );
    await executeRunSql(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      ['meta_description', final_meta_description, now]
    );
    await executeRunSql(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      ['meta_keywords', final_meta_keywords, now]
    );
    invalidatePublicDataCache();

    res.json({
      success: true,
      is_fallback: false,
      persisted: true,
      meta_title: final_meta_title,
      meta_description: final_meta_description,
      meta_keywords: final_meta_keywords
    });

  } catch (err: any) {
    console.warn('[Gemini SEO Fallback Triggered] falling back to heuristic generation:', err.message);
    // Calculate high-quality metadata locally to make sure it never fails!
    const meta_title = `${eventName} | Modelo de Naciones Unidas - ${institution}`.slice(0, 60);
    const defaultSlogan = slogan || 'Debate, liderazgo y diplomacia internacional en Valledupar.';
    const meta_description = `Participa en el ${eventName}, el prestigioso Modelo de Naciones Unidas del ${institution}. ${defaultSlogan} ¡Inscríbete hoy!`.slice(0, 160);
    const meta_keywords = `${eventName}, Modelo de Naciones Unidas, ${institution}, Valledupar, Debate Académico, Diplomacia, Liderazgo, Oratoria, Resoluciones ONU, Cesar, Colombia, BIMUN`;

    try {
      const now = new Date().toISOString();
      await executeRunSql(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        ['meta_title', meta_title, now]
      );
      await executeRunSql(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        ['meta_description', meta_description, now]
      );
      await executeRunSql(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        ['meta_keywords', meta_keywords, now]
      );
      invalidatePublicDataCache();
    } catch (persistErr: any) {
      console.error('Error persisting SEO fallback settings to database:', persistErr);
    }

    res.json({
      success: true,
      is_fallback: true,
      persisted: true,
      fallback_reason: err.message || 'Error de conexión con la IA de Google',
      meta_title,
      meta_description,
      meta_keywords
    });
  }
});

// Explicit endpoint to save SEO metadata (meta_keywords, meta_description, meta_title, schema_json, og_image_url, twitter_handle)
async function handleSaveExplicitSeo(req: Request, res: Response) {
  try {
    const {
      meta_keywords,
      meta_description,
      meta_title,
      schema_json,
      og_image_url,
      twitter_handle
    } = req.body;

    const now = new Date().toISOString();
    const updates: Record<string, string> = {};

    if (meta_keywords !== undefined) {
      updates['meta_keywords'] = String(meta_keywords ?? '').trim();
    }
    if (meta_description !== undefined) {
      updates['meta_description'] = String(meta_description ?? '').trim();
    }
    if (meta_title !== undefined) {
      updates['meta_title'] = String(meta_title ?? '').trim();
    }
    if (schema_json !== undefined) {
      updates['schema_json'] = typeof schema_json === 'object' && schema_json !== null
        ? JSON.stringify(schema_json, null, 2)
        : String(schema_json ?? '');
    }
    if (og_image_url !== undefined) {
      updates['og_image_url'] = String(og_image_url ?? '').trim();
    }
    if (twitter_handle !== undefined) {
      updates['twitter_handle'] = String(twitter_handle ?? '').trim();
    }

    for (const [key, value] of Object.entries(updates)) {
      await executeRunSql(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        [key, value, now]
      );
    }

    invalidatePublicDataCache();

    res.json({
      success: true,
      message: 'Campos SEO y metadatos guardados explícitamente en la base de datos.',
      saved: updates
    });
  } catch (err: any) {
    console.error('Error saving SEO settings explicitly:', err);
    res.status(500).json({
      error: 'Error al guardar explícitamente los campos de SEO en la base de datos',
      details: err.message
    });
  }
}

apiRouter.put('/admin/seo-settings', authMiddleware, adminOnlyMiddleware, handleSaveExplicitSeo);
apiRouter.post('/admin/seo-settings', authMiddleware, adminOnlyMiddleware, handleSaveExplicitSeo);
apiRouter.put('/admin/settings/seo', authMiddleware, adminOnlyMiddleware, handleSaveExplicitSeo);
apiRouter.post('/admin/settings/seo', authMiddleware, adminOnlyMiddleware, handleSaveExplicitSeo);


