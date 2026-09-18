import { executeQueryAll, executeRunSql, saveSqliteDisk } from './dbManager.ts';
import crypto from 'crypto';

function generateUniqueId(prefix: string = 'id'): string {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface BackupMetadata {
  schema_version: string;
  system: string;
  institution: string;
  edition: string;
  year: string;
  exported_at: string;
  exported_by: string;
  counts: Record<string, number>;
  multimedia_summary: {
    total_photos: number;
    total_documents: number;
    total_committee_graphics: number;
    total_team_portraits: number;
    total_news_banners: number;
    total_video_links: number;
  };
}

export interface MultimediaCatalog {
  gallery_photos: Array<{
    id: string;
    title: string;
    caption?: string;
    image_url: string;
    category?: string;
    edition?: string;
  }>;
  committee_media: Array<{
    committee_id: string;
    code: string;
    name: string;
    banner_url?: string;
    president_name?: string;
    president_photo?: string;
    vicepresident_name?: string;
    vicepresident_photo?: string;
  }>;
  team_portraits: Array<{
    id: string;
    name: string;
    role: string;
    photo_url?: string;
  }>;
  news_banners: Array<{
    id: string;
    title: string;
    image_url?: string;
  }>;
  document_files: Array<{
    id: string;
    title: string;
    category: string;
    file_url: string;
    file_size?: string;
  }>;
  video_links: Array<{
    source: string;
    title: string;
    url: string;
    type: 'youtube' | 'drive' | 'vimeo' | 'direct' | 'other';
  }>;
}

export interface FullBackupPayload {
  version: string;
  metadata: BackupMetadata;
  tables: {
    settings: any[];
    about_sections: any[];
    committees: any[];
    countries: any[];
    delegations: any[];
    schedule: any[];
    documents: any[];
    gallery: any[];
    organizing_team: any[];
    news: any[];
    registrations: any[];
  };
  multimedia_catalog: MultimediaCatalog;
}

/**
 * Helper to identify video URL types
 */
function classifyVideoUrl(url: string): 'youtube' | 'drive' | 'vimeo' | 'direct' | 'other' {
  if (!url) return 'other';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('drive.google.com')) return 'drive';
  if (lower.includes('vimeo.com')) return 'vimeo';
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) return 'direct';
  return 'other';
}

/**
 * Generate a complete JSON backup payload including all structured data and multimedia catalogs.
 */
export async function generateFullBackup(exportedBy: string = 'Administrador General'): Promise<FullBackupPayload> {
  // Query all database tables
  const settingsRows = await executeQueryAll<any>('SELECT * FROM settings;');
  const aboutRows = await executeQueryAll<any>('SELECT * FROM about_sections;');
  const committeeRows = await executeQueryAll<any>('SELECT * FROM committees;');
  const countryRows = await executeQueryAll<any>('SELECT * FROM countries;');
  const delegationRows = await executeQueryAll<any>('SELECT * FROM delegations;');
  const scheduleRows = await executeQueryAll<any>('SELECT * FROM schedule;');
  const documentRows = await executeQueryAll<any>('SELECT * FROM documents;');
  const galleryRows = await executeQueryAll<any>('SELECT * FROM gallery;');
  const teamRows = await executeQueryAll<any>('SELECT * FROM organizing_team;');
  const newsRows = await executeQueryAll<any>('SELECT * FROM news;');
  const registrationRows = await executeQueryAll<any>('SELECT * FROM registrations;');

  // Find edition name and year in settings
  const editionRow = settingsRows.find((s) => s.key === 'bimun_edition' || s.key === 'edition');
  const editionName = editionRow ? editionRow.value : 'BIMUN XXVII';
  const datesRow = settingsRows.find((s) => s.key === 'event_dates');
  const yearMatch = (datesRow?.value || editionName).match(/20\d\d/);
  const detectedYear = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

  // Build Multimedia Catalog
  const galleryPhotos = galleryRows.map((g) => ({
    id: g.id,
    title: g.title,
    caption: g.caption,
    image_url: g.image_url,
    category: g.category,
    edition: g.edition,
  }));

  const committeeMedia = committeeRows.map((c) => ({
    committee_id: c.id,
    code: c.code,
    name: c.name,
    banner_url: c.image_url,
    president_name: c.president_name,
    president_photo: c.president_photo,
    vicepresident_name: c.vicepresident_name,
    vicepresident_photo: c.vicepresident_photo,
  }));

  const teamPortraits = teamRows.map((t) => ({
    id: t.id,
    name: t.name,
    role: t.role,
    photo_url: t.photo_url,
  }));

  const newsBanners = newsRows.map((n) => ({
    id: n.id,
    title: n.title,
    image_url: n.image_url,
  }));

  const documentFiles = documentRows.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    file_url: d.file_url,
    file_size: d.file_size,
  }));

  // Extract video URLs from settings and content
  const videoLinks: MultimediaCatalog['video_links'] = [];
  settingsRows.forEach((s) => {
    if (s.key.includes('video') || s.key.includes('stream') || s.key.includes('youtube')) {
      if (s.value && typeof s.value === 'string' && s.value.startsWith('http')) {
        videoLinks.push({
          source: `Settings: ${s.key}`,
          title: `Configuración: ${s.key}`,
          url: s.value,
          type: classifyVideoUrl(s.value),
        });
      }
    }
  });

  // Extract video URLs inside news or about if present
  newsRows.forEach((n) => {
    if (n.content && n.content.includes('http')) {
      const urls = n.content.match(/https?:\/\/[^\s"'<>]+/g) || [];
      urls.forEach((u: string) => {
        if (classifyVideoUrl(u) !== 'other') {
          videoLinks.push({
            source: `Noticia: ${n.title}`,
            title: n.title,
            url: u,
            type: classifyVideoUrl(u),
          });
        }
      });
    }
  });

  const metadata: BackupMetadata = {
    schema_version: '2.1.0',
    system: 'BIMUN - Plataforma Oficial de Modelo de Naciones Unidas',
    institution: 'Fundación Colegio Bilingüe de Valledupar',
    edition: editionName,
    year: detectedYear,
    exported_at: new Date().toISOString(),
    exported_by: exportedBy,
    counts: {
      settings: settingsRows.length,
      about_sections: aboutRows.length,
      committees: committeeRows.length,
      countries: countryRows.length,
      delegations: delegationRows.length,
      schedule: scheduleRows.length,
      documents: documentRows.length,
      gallery: galleryRows.length,
      organizing_team: teamRows.length,
      news: newsRows.length,
      registrations: registrationRows.length,
    },
    multimedia_summary: {
      total_photos: galleryPhotos.length,
      total_documents: documentFiles.length,
      total_committee_graphics: committeeMedia.length,
      total_team_portraits: teamPortraits.length,
      total_news_banners: newsBanners.length,
      total_video_links: videoLinks.length,
    },
  };

  return {
    version: '2.1.0',
    metadata,
    tables: {
      settings: settingsRows,
      about_sections: aboutRows,
      committees: committeeRows,
      countries: countryRows,
      delegations: delegationRows,
      schedule: scheduleRows,
      documents: documentRows,
      gallery: galleryRows,
      organizing_team: teamRows,
      news: newsRows,
      registrations: registrationRows,
    },
    multimedia_catalog: {
      gallery_photos: galleryPhotos,
      committee_media: committeeMedia,
      team_portraits: teamPortraits,
      news_banners: newsBanners,
      document_files: documentFiles,
      video_links: videoLinks,
    },
  };
}

/**
 * Restores a full backup payload into the database.
 */
export async function restoreFullBackup(
  payload: any,
  options: { preserveAdminUsers?: boolean } = { preserveAdminUsers: true }
): Promise<{ success: boolean; message: string; restoredCounts: Record<string, number> }> {
  if (!payload || !payload.tables) {
    throw new Error('Formato de archivo de respaldo inválido: no contiene tablas de datos.');
  }

  const { tables } = payload;
  const restoredCounts: Record<string, number> = {};

  // 1. Settings
  if (Array.isArray(tables.settings) && tables.settings.length > 0) {
    await executeRunSql('DELETE FROM settings;');
    for (const s of tables.settings) {
      await executeRunSql(
        'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?);',
        [s.key, s.value, s.updated_at || new Date().toISOString()]
      );
    }
    restoredCounts.settings = tables.settings.length;
  }

  // 2. About Sections
  if (Array.isArray(tables.about_sections)) {
    await executeRunSql('DELETE FROM about_sections;');
    for (const a of tables.about_sections) {
      await executeRunSql(
        `INSERT INTO about_sections (id, section_key, title, subtitle, content, icon, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [a.id, a.section_key, a.title, a.subtitle || '', a.content, a.icon || 'Globe', a.sort_order || 0, a.is_active ?? 1]
      );
    }
    restoredCounts.about_sections = tables.about_sections.length;
  }

  // 3. Countries (Insert before delegations for FK consistency)
  if (Array.isArray(tables.countries)) {
    await executeRunSql('DELETE FROM countries;');
    for (const c of tables.countries) {
      await executeRunSql(
        `INSERT INTO countries (id, name, official_name, code, flag_emoji, flag_url, additional_info, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [c.id, c.name, c.official_name || '', c.code, c.flag_emoji || '🌐', c.flag_url || '', c.additional_info || '', c.status || 'active']
      );
    }
    restoredCounts.countries = tables.countries.length;
  }

  // 4. Committees (Insert before delegations for FK consistency)
  if (Array.isArray(tables.committees)) {
    await executeRunSql('DELETE FROM committees;');
    for (const com of tables.committees) {
      await executeRunSql(
        `INSERT INTO committees (
          id, code, name, abbreviation, description, image_url, language,
          topic_a, topic_b, topic_c, president_name, president_photo,
          vicepresident_name, vicepresident_photo, status, sort_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          com.id, com.code, com.name, com.abbreviation, com.description, com.image_url || '', com.language || 'Español',
          com.topic_a, com.topic_b || '', com.topic_c || '', com.president_name || '', com.president_photo || '',
          com.vicepresident_name || '', com.vicepresident_photo || '', com.status || 'active', com.sort_order || 0, com.created_at || new Date().toISOString()
        ]
      );
    }
    restoredCounts.committees = tables.committees.length;
  }

  // 5. Delegations
  if (Array.isArray(tables.delegations)) {
    await executeRunSql('DELETE FROM delegations;');
    for (const d of tables.delegations) {
      await executeRunSql(
        `INSERT INTO delegations (id, committee_id, country_id, delegate_name, delegate_school, delegate_email, delegate_phone, status, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [d.id, d.committee_id, d.country_id, d.delegate_name || '', d.delegate_school || '', d.delegate_email || '', d.delegate_phone || '', d.status || 'available', d.notes || '', d.created_at || new Date().toISOString()]
      );
    }
    restoredCounts.delegations = tables.delegations.length;
  }

  // 6. Schedule
  if (Array.isArray(tables.schedule)) {
    await executeRunSql('DELETE FROM schedule;');
    for (const sch of tables.schedule) {
      await executeRunSql(
        `INSERT INTO schedule (id, day_label, date, time_start, time_end, activity, description, location, audience, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [sch.id, sch.day_label, sch.date, sch.time_start, sch.time_end, sch.activity, sch.description || '', sch.location || '', sch.audience || 'Todos los participantes', sch.sort_order || 0]
      );
    }
    restoredCounts.schedule = tables.schedule.length;
  }

  // 7. Documents
  if (Array.isArray(tables.documents)) {
    await executeRunSql('DELETE FROM documents;');
    for (const doc of tables.documents) {
      await executeRunSql(
        `INSERT INTO documents (id, title, category, file_url, description, file_size, is_featured, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [doc.id, doc.title, doc.category, doc.file_url, doc.description || '', doc.file_size || '', doc.is_featured ? 1 : 0, doc.sort_order || 0, doc.created_at || new Date().toISOString()]
      );
    }
    restoredCounts.documents = tables.documents.length;
  }

  // 8. Gallery
  if (Array.isArray(tables.gallery)) {
    await executeRunSql('DELETE FROM gallery;');
    for (const g of tables.gallery) {
      await executeRunSql(
        `INSERT INTO gallery (id, title, caption, image_url, category, edition, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [g.id, g.title, g.caption || '', g.image_url, g.category || 'Debate', g.edition || 'BIMUN XXVI', g.sort_order || 0, g.created_at || new Date().toISOString()]
      );
    }
    restoredCounts.gallery = tables.gallery.length;
  }

  // 9. Organizing Team
  if (Array.isArray(tables.organizing_team)) {
    await executeRunSql('DELETE FROM organizing_team;');
    for (const t of tables.organizing_team) {
      await executeRunSql(
        `INSERT INTO organizing_team (id, name, role, category, photo_url, bio, email, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [t.id, t.name, t.role, t.category || 'Secretaría', t.photo_url || '', t.bio || '', t.email || '', t.sort_order || 0]
      );
    }
    restoredCounts.organizing_team = tables.organizing_team.length;
  }

  // 10. News
  if (Array.isArray(tables.news)) {
    await executeRunSql('DELETE FROM news;');
    for (const n of tables.news) {
      await executeRunSql(
        `INSERT INTO news (id, title, slug, excerpt, content, image_url, category, publish_date, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [n.id, n.title, n.slug, n.excerpt || '', n.content, n.image_url || '', n.category || 'General', n.publish_date || new Date().toISOString().split('T')[0], n.is_published ? 1 : 0]
      );
    }
    restoredCounts.news = tables.news.length;
  }

  // 11. Registrations
  if (Array.isArray(tables.registrations)) {
    await executeRunSql('DELETE FROM registrations;');
    for (const r of tables.registrations) {
      await executeRunSql(
        `INSERT INTO registrations (
          id, full_name, email, phone, school, delegation_type, grade,
          committee_preference_1, committee_preference_2, country_preference_1, country_preference_2,
          experience, dietary_medical, emergency_contact, status, assigned_committee_id, assigned_country_id, notes, payment_receipt, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          r.id, r.full_name, r.email, r.phone, r.school, r.delegation_type || 'individual', r.grade || '',
          r.committee_preference_1 || '', r.committee_preference_2 || '', r.country_preference_1 || '', r.country_preference_2 || '',
          r.experience || '', r.dietary_medical || '', r.emergency_contact || '', r.status || 'pending',
          r.assigned_committee_id || null, r.assigned_country_id || null, r.notes || '', r.payment_receipt || null, r.created_at || new Date().toISOString()
        ]
      );
    }
    restoredCounts.registrations = tables.registrations.length;
  }

  saveSqliteDisk();

  return {
    success: true,
    message: 'Base de datos y contenidos restaurados satisfactoriamente.',
    restoredCounts,
  };
}

/**
 * Creates and stores an edition archive snapshot inside edition_archives table.
 */
export async function createEditionArchive(
  editionName: string,
  editionYear: string,
  title: string,
  description: string = '',
  createdBy: string = 'Administrador'
): Promise<{ id: string; success: boolean }> {
  const backupPayload = await generateFullBackup(createdBy);
  const id = `arch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const snapshotJson = JSON.stringify(backupPayload);

  const totalDelegates = backupPayload.tables.registrations?.length || 0;
  const totalCommittees = backupPayload.tables.committees?.length || 0;
  const totalPhotos = backupPayload.tables.gallery?.length || 0;
  const now = new Date().toISOString();

  await executeRunSql(
    `INSERT INTO edition_archives (id, edition_name, edition_year, title, description, snapshot_json, total_delegates, total_committees, total_photos, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, editionName, editionYear, title, description, snapshotJson, totalDelegates, totalCommittees, totalPhotos, createdBy, now]
  );

  saveSqliteDisk();

  return { id, success: true };
}

/**
 * Retrieves the list of all historical edition archives.
 */
export async function listEditionArchives(): Promise<any[]> {
  const rows = await executeQueryAll<any>(
    'SELECT id, edition_name, edition_year, title, description, total_delegates, total_committees, total_photos, created_by, created_at FROM edition_archives ORDER BY created_at DESC;'
  );
  return rows;
}

/**
 * Retrieves a single archive by ID with full snapshot.
 */
export async function getEditionArchiveById(id: string): Promise<any | null> {
  const row = await executeQueryAll<any>(
    'SELECT * FROM edition_archives WHERE id = ?;',
    [id]
  );
  if (row.length === 0) return null;
  return row[0];
}

/**
 * Deletes an archive from history.
 */
export async function deleteEditionArchive(id: string): Promise<boolean> {
  await executeRunSql('DELETE FROM edition_archives WHERE id = ?;', [id]);
  saveSqliteDisk();
  return true;
}

/**
 * Executes the complete transition to a new annual MUN model.
 */
export async function startNewModelYearEdition(
  options: {
    newEditionName: string;
    newEditionYear: string;
    newSlogan?: string;
    newDates?: string;
    archiveCurrentEdition: boolean;
    archiveTitle?: string;
    archiveDescription?: string;
    resetRegistrations: boolean;
    resetDelegationStatus: boolean;
    resetSchedule: boolean;
    retainCommittees: boolean;
    retainCountries: boolean;
    retainGalleryHistory: boolean;
    retainTeam: boolean;
  },
  adminUser: string = 'Administrador'
): Promise<{ success: boolean; message: string; archiveId?: string }> {
  let createdArchiveId: string | undefined;

  // 1. If requested, automatically archive current edition state first
  if (options.archiveCurrentEdition) {
    const currentSettings = await executeQueryAll<any>('SELECT value FROM settings WHERE key = "bimun_edition" OR key = "edition";');
    const curEdition = currentSettings[0]?.value || 'BIMUN Anterior';
    const archiveTitle = options.archiveTitle || `Memoria Oficial de ${curEdition}`;
    const archiveDesc = options.archiveDescription || `Copia de seguridad y archivo histórico generado antes de la transición hacia ${options.newEditionName} (${options.newEditionYear}).`;

    const archiveRes = await createEditionArchive(
      curEdition,
      new Date().getFullYear().toString(),
      archiveTitle,
      archiveDesc,
      adminUser
    );
    createdArchiveId = archiveRes.id;
  }

  // 2. Update settings for the new edition
  const now = new Date().toISOString();
  await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', ['bimun_edition', options.newEditionName, now]);
  await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', ['edition', options.newEditionName, now]);

  if (options.newDates) {
    await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', ['event_dates', options.newDates, now]);
  }
  if (options.newSlogan) {
    await executeRunSql('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?);', ['hero_slogan', options.newSlogan, now]);
  }

  // 3. Clear or reset registrations if requested
  if (options.resetRegistrations) {
    await executeRunSql('DELETE FROM registrations;');
  }

  // 4. Reset delegations allocations (liberate all spots) if requested
  if (options.resetDelegationStatus) {
    await executeRunSql(`
      UPDATE delegations
      SET delegate_name = '', delegate_school = '', delegate_email = '', delegate_phone = '', status = 'available', notes = '';
    `);
  }

  // 5. Clean schedule if requested
  if (options.resetSchedule) {
    await executeRunSql('DELETE FROM schedule;');
    // Add default initial placeholder for day 1
    const dayDate = options.newDates?.split('al')[0]?.trim() || `${options.newEditionYear}-09-24`;
    await executeRunSql(`
      INSERT INTO schedule (id, day_label, date, time_start, time_end, activity, description, location, audience, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      `sch_${Date.now()}_1`,
      'Día 1 - Inauguración',
      dayDate,
      '08:00',
      '10:30',
      `Ceremonia Inaugural ${options.newEditionName}`,
      'Apertura oficial del Modelo de Naciones Unidas y palabras de la Secretaría General.',
      'Auditorio Principal Colegio Bilingüe',
      'Todos los participantes',
      1
    ]);
  }

  // 6. Reset organizing team if requested
  if (!options.retainTeam) {
    await executeRunSql('DELETE FROM organizing_team;');
  }

  // 7. Retain gallery with proper edition tagging
  if (options.retainGalleryHistory) {
    // Current photos are preserved; future uploads will take new edition by default
  }

  saveSqliteDisk();

  return {
    success: true,
    message: `¡Transición completada con éxito hacia ${options.newEditionName} (${options.newEditionYear})!`,
    archiveId: createdArchiveId,
  };
}
