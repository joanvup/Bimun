import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { executeQueryAll, executeQueryOne, executeRunSql, getDatabaseStatus } from './dbManager.ts';

const DB_PATH = path.join(process.cwd(), 'bimun_database.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from', DB_PATH);
    } catch (err) {
      console.error('Error reading existing database, initializing new one:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    console.log('Creating new SQLite database file...');
    dbInstance = new SQL.Database();
  }

  initSchemaAndSeed(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();

  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runSql(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  saveDb();

  // Also asynchronously replicate write to target external engine if active
  const status = getDatabaseStatus();
  if (status.activeType !== 'sqlite') {
    executeRunSql(sql, params).catch((err) => {
      console.warn('[Write replication error to ' + status.activeType + ']:', err.message);
    });
  }
}

function initSchemaAndSeed(db: Database): void {
  // 1. Settings Table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. About Sections Table
  db.run(`
    CREATE TABLE IF NOT EXISTS about_sections (
      id TEXT PRIMARY KEY,
      section_key TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      content TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 3. Committees Table
  db.run(`
    CREATE TABLE IF NOT EXISTS committees (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      abbreviation TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      language TEXT DEFAULT 'Español',
      topic_a TEXT NOT NULL,
      topic_b TEXT,
      topic_c TEXT,
      president_name TEXT,
      president_photo TEXT,
      vicepresident_name TEXT,
      vicepresident_photo TEXT,
      status TEXT DEFAULT 'active',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 4. Countries Table
  db.run(`
    CREATE TABLE IF NOT EXISTS countries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      official_name TEXT,
      code TEXT UNIQUE NOT NULL,
      flag_emoji TEXT,
      flag_url TEXT,
      additional_info TEXT,
      status TEXT DEFAULT 'active'
    );
  `);

  // 5. Delegations Table (Relación Comisión <-> País <-> Delegado)
  db.run(`
    CREATE TABLE IF NOT EXISTS delegations (
      id TEXT PRIMARY KEY,
      committee_id TEXT NOT NULL,
      country_id TEXT NOT NULL,
      delegate_name TEXT,
      delegate_school TEXT,
      delegate_email TEXT,
      delegate_phone TEXT,
      status TEXT DEFAULT 'available', -- 'available', 'assigned', 'reserved'
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (committee_id) REFERENCES committees (id) ON DELETE CASCADE,
      FOREIGN KEY (country_id) REFERENCES countries (id) ON DELETE CASCADE
    );
  `);

  // 6. Schedule Table
  db.run(`
    CREATE TABLE IF NOT EXISTS schedule (
      id TEXT PRIMARY KEY,
      day_label TEXT NOT NULL,
      date TEXT NOT NULL,
      time_start TEXT NOT NULL,
      time_end TEXT NOT NULL,
      activity TEXT NOT NULL,
      description TEXT,
      location TEXT,
      audience TEXT DEFAULT 'Todos los participantes',
      sort_order INTEGER DEFAULT 0
    );
  `);

  // 7. Documents Table
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      file_url TEXT NOT NULL,
      description TEXT,
      file_size TEXT,
      is_featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 8. Gallery Table
  db.run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      caption TEXT,
      image_url TEXT NOT NULL,
      category TEXT DEFAULT 'Debate',
      edition TEXT DEFAULT 'BIMUN XXVI',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // 9. Organizing Team Table
  db.run(`
    CREATE TABLE IF NOT EXISTS organizing_team (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      category TEXT DEFAULT 'Secretaría',
      photo_url TEXT,
      bio TEXT,
      email TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // 10. News Table
  db.run(`
    CREATE TABLE IF NOT EXISTS news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      category TEXT DEFAULT 'General',
      publish_date TEXT NOT NULL,
      is_published INTEGER DEFAULT 1
    );
  `);

  // 11. Registrations Table
  db.run(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      school TEXT NOT NULL,
      delegation_type TEXT NOT NULL, -- 'individual', 'delegacion_colegial', 'observador'
      grade TEXT,
      committee_preference_1 TEXT,
      committee_preference_2 TEXT,
      country_preference_1 TEXT,
      country_preference_2 TEXT,
      experience TEXT,
      dietary_medical TEXT,
      emergency_contact TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'assigned', 'rejected'
      assigned_committee_id TEXT,
      assigned_country_id TEXT,
      notes TEXT,
      payment_receipt TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Safe table alterations if existing DB
  try {
    db.run("ALTER TABLE registrations ADD COLUMN payment_receipt TEXT;");
  } catch (e) {
    // Column already exists, ignore
  }

  // 12. Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
  `);

  // 13. Edition Archives & Full System Backups
  db.run(`
    CREATE TABLE IF NOT EXISTS edition_archives (
      id TEXT PRIMARY KEY,
      edition_name TEXT NOT NULL,
      edition_year TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      snapshot_json TEXT NOT NULL,
      total_delegates INTEGER DEFAULT 0,
      total_committees INTEGER DEFAULT 0,
      total_photos INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Check if initial admin user exists
  const userCheck = db.exec("SELECT COUNT(*) as count FROM users;");
  const userCount = userCheck.length > 0 && userCheck[0].values.length > 0 ? Number(userCheck[0].values[0][0]) : 0;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('bimun2026', salt);
    db.run(
      `INSERT INTO users (id, username, password_hash, display_name, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['usr_admin_1', 'admin', hash, 'Secretaría General BIMUN', 'superadmin', new Date().toISOString()]
    );
    console.log('Default admin created: admin / bimun2026');
  }

  // Check if settings exist, otherwise seed
  const settingsCheck = db.exec("SELECT COUNT(*) as count FROM settings;");
  const settingsCount = settingsCheck.length > 0 && settingsCheck[0].values.length > 0 ? Number(settingsCheck[0].values[0][0]) : 0;
  if (settingsCount === 0) {
    seedInitialData(db);
  }

  // Auto-healing check: guarantee about_sections has institutional content
  try {
    const aboutCheck = db.exec("SELECT COUNT(*) as count FROM about_sections;");
    const aboutCount = aboutCheck.length > 0 && aboutCheck[0].values.length > 0 ? Number(aboutCheck[0].values[0][0]) : 0;
    if (aboutCount === 0) {
      console.log('about_sections is empty, populating default institutional content...');
      seedDefaultAboutSections(db);
    }
  } catch (err) {
    console.error('Error verifying about_sections:', err);
  }

  // Auto-healing check: guarantee gallery has initial photos if empty
  try {
    const galleryCheck = db.exec("SELECT COUNT(*) as count FROM gallery;");
    const galleryCount = galleryCheck.length > 0 && galleryCheck[0].values.length > 0 ? Number(galleryCheck[0].values[0][0]) : 0;
    if (galleryCount === 0) {
      console.log('gallery is empty, populating default gallery photos...');
      seedDefaultGallery(db);
    }
  } catch (err) {
    console.error('Error verifying gallery:', err);
  }

  // Auto-healing check: guarantee gallery_categories exists in settings
  try {
    const catCheck = db.exec("SELECT value FROM settings WHERE key = 'gallery_categories';");
    if (catCheck.length === 0 || catCheck[0].values.length === 0) {
      console.log('gallery_categories is missing in settings, populating default categories...');
      db.run('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)', [
        'gallery_categories',
        JSON.stringify(DEFAULT_GALLERY_CATEGORIES),
        new Date().toISOString()
      ]);
    }
  } catch (err) {
    console.error('Error verifying gallery_categories:', err);
  }
}

export const DEFAULT_ABOUT_SECTIONS = [
  {
    id: 'abt_1',
    section_key: 'que_es_mun',
    title: '¿Qué es el Modelo de Naciones Unidas?',
    subtitle: 'Simulación académica y diplomática internacional',
    content: 'El Modelo de Naciones Unidas (MUN) es una simulación académica donde estudiantes de secundaria y preparatoria asumen el rol de delegados diplomáticos en representación de diversos Estados miembros de la ONU. Durante tres días intensivos de sesiones formales y negociaciones informales, los estudiantes debaten problemáticas globales apremiantes, redactan resoluciones y construyen consensos multilaterales siguiendo el estricto protocolo parlamentario de las Naciones Unidas.',
    icon: 'Globe',
    sort_order: 1,
  },
  {
    id: 'abt_2',
    section_key: 'objetivos',
    title: 'Objetivos del BIMUN',
    subtitle: 'Excelencia oratoria, rigor académico y vocación de paz',
    content: '1. Fomentar la investigación profunda de la política internacional, la historia y la geografía contemporánea.\n2. Desarrollar habilidades superiores de oratoria persuasiva, retórica respetuosa, negociación pacífica y diplomacia multilateral.\n3. Capacitar a los jóvenes en la redacción técnica de acuerdos y tratados internacionales mediante cláusulas preambulatorias y operativas.\n4. Promover el entendimiento intercultural, la tolerancia y el respeto por los derechos humanos universales.',
    icon: 'Target',
    sort_order: 2,
  },
  {
    id: 'abt_3',
    section_key: 'metodologia',
    title: 'Metodología Parlamentaria',
    subtitle: 'Protocolo formal, debates caucus y resolución de crisis',
    content: 'El BIMUN opera bajo el prestigioso formato THIMUN y Protocolo ONU Tradicional. Las sesiones se dividen en Lista de Oradores (debate general), Caucus Moderados (debates estructurados con tiempos acotados por moción) y Caucus No Moderados (negociación directa y redacción de borradores). Cada delegado defiende con fidelidad la política exterior de su país asignado, culminando con la votación calificada de proyectos de resolución.',
    icon: 'BookOpen',
    sort_order: 3,
  },
  {
    id: 'abt_4',
    section_key: 'beneficios',
    title: 'Beneficios para los Estudiantes',
    subtitle: 'Competencias para la vida universitaria y ciudadana',
    content: 'Participar en BIMUN forja seguridad personal, pensamiento crítico acelerado, dominio bilingüe fluido (inglés y español) en escenarios formales, trabajo colaborativo bajo presión y una comprensión madura de los equilibrios geopolíticos globales. Los delegados destacan notablemente en sus postulaciones a las mejores universidades de Colombia y el extranjero.',
    icon: 'Award',
    sort_order: 4,
  },
  {
    id: 'abt_5',
    section_key: 'historia',
    title: 'Historia del BIMUN',
    subtitle: 'Más de dos décadas de tradición diplomática en el Cesar',
    content: 'Fundado en el seno del Colegio Bilingüe de Valledupar con la convicción de conectar a los estudiantes del Cesar con el panorama global, el BIMUN ha evolucionado a lo largo de 27 ediciones consecutivas hasta convertirse en el referente indiscutible de modelos de naciones unidas en la Región Caribe. Cada año reúne a cientos de delegados de prestigiosas instituciones educativas nacionales e internacionales.',
    icon: 'Clock',
    sort_order: 5,
  },
  {
    id: 'abt_6',
    section_key: 'mision_vision',
    title: 'Misión, Visión y Valores',
    subtitle: 'El compromiso de la Fundación Colegio Bilingüe',
    content: 'Misión: Brindar una plataforma de formación diplomática integral que estimule el pensamiento analítico, la empatía global y el liderazgo ético en las nuevas generaciones.\n\nVisión: Consolidar al BIMUN como el modelo escolar de relaciones internacionales con mayor impacto formativo e innovación académica en el norte de Colombia.\n\nValores: Integridad diplomática, respeto incondicional a la diversidad, rigor investigativo, empatía humanitaria y excelencia académica.',
    icon: 'Compass',
    sort_order: 6,
  }
];

export function seedDefaultAboutSections(db: Database): void {
  for (const abt of DEFAULT_ABOUT_SECTIONS) {
    db.run(
      `INSERT OR REPLACE INTO about_sections (id, section_key, title, subtitle, content, icon, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [abt.id, abt.section_key, abt.title, abt.subtitle, abt.content, abt.icon, abt.sort_order]
    );
  }
}

export function resetDefaultAboutSections(): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run('DELETE FROM about_sections;');
  seedDefaultAboutSections(dbInstance);
  saveDb();
}

export const DEFAULT_GALLERY_CATEGORIES = [
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

export const DEFAULT_GALLERY_ITEMS = [
  { id: 'gal_1', title: 'Debate en Plenaria General', caption: 'Intervención de la delegación de Colombia en el Consejo de Seguridad', image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80', cat: 'Debate', edition: 'BIMUN XXVI', order: 1 },
  { id: 'gal_2', title: 'Ceremonia de Inauguración', caption: 'Palabras del Secretario General en el Auditorio Principal', image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80', cat: 'Protocolo', edition: 'BIMUN XXVI', order: 2 },
  { id: 'gal_3', title: 'Negociación en Caucus No Moderado', caption: 'Delegados construyendo consenso para el borrador de resolución', image_url: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80', cat: 'Negociación', edition: 'BIMUN XXVI', order: 3 },
  { id: 'gal_4', title: 'Comité de Crisis en Acción', caption: 'Directivas urgentes enviadas durante la simulación de contingencia', image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', cat: 'Crisis', edition: 'BIMUN XXVI', order: 4 },
  { id: 'gal_5', title: 'Entrega de Galardones y Menciones de Honor', caption: 'Reconocimiento a los delegados más destacados de la edición', image_url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&q=80', cat: 'Premiación', edition: 'BIMUN XXV', order: 5 },
  { id: 'gal_6', title: 'Delegaciones Invitadas en el Campus', caption: 'Estudiantes del Colegio Bilingüe recibiendo a delegados visitantes', image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80', cat: 'Campus', edition: 'BIMUN XXV', order: 6 },
];

export function seedDefaultGallery(db: Database): void {
  const now = new Date().toISOString();
  for (const g of DEFAULT_GALLERY_ITEMS) {
    db.run(
      `INSERT INTO gallery (id, title, caption, image_url, category, edition, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.title, g.caption, g.image_url, g.cat, g.edition, g.order, now]
    );
  }
}

export function resetDefaultGallery(): { success: boolean; itemsCount: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run('DELETE FROM gallery;');
  seedDefaultGallery(dbInstance);
  saveDb();
  return { success: true, itemsCount: DEFAULT_GALLERY_ITEMS.length };
}

function seedInitialData(db: Database): void {
  console.log('Seeding initial BIMUN data...');
  const now = new Date().toISOString();

  // Settings
  const defaultSettings = [
    ['bimun_name', 'BIMUN XXVII'],
    ['bimun_edition', 'XXVII Edición'],
    ['institution_name', 'Fundación Colegio Bilingüe de Valledupar'],
    ['institution_short', 'Colegio Bilingüe'],
    ['slogan', 'Diplomacia, liderazgo y pensamiento crítico para transformar el mundo'],
    ['hero_tagline', 'Forjando a los líderes y diplomáticos del mañana en el Caribe colombiano'],
    ['hero_subtext', 'Bienvenidos a la XXVII edición del Modelo de Naciones Unidas del Colegio Bilingüe de Valledupar. Un espacio académico de excelencia y debate riguroso sobre los mayores desafíos geopolíticos globales.'],
    ['event_date_display', '23 al 25 de Octubre de 2026'],
    ['event_dates_iso', JSON.stringify({ start: '2026-10-23', end: '2026-10-25' })],
    ['start_date', '2026-10-23'],
    ['end_date', '2026-10-25'],
    ['inauguration_time', '08:30'],
    ['venue', 'Campus Principal - Fundación Colegio Bilingüe de Valledupar'],
    ['venue_city', 'Valledupar, Cesar, Colombia'],
    ['logo_url', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=300&q=80'],
    ['logo_size', '56'],
    ['hero_bg_image', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1920&q=80'],
    ['hero_video_url', ''],
    ['contact_email', 'bimun@colegiobilingue.edu.co'],
    ['contact_phone', '+57 (605) 574-2100'],
    ['contact_address', 'Calle 16 # 19E-45, Valledupar, Cesar'],
    ['instagram_url', 'https://instagram.com/bimun_valledupar'],
    ['youtube_url', 'https://youtube.com'],
    ['cta_primary_text', 'Inscripciones Abiertas'],
    ['cta_primary_link', '#inscripciones'],
    ['cta_secondary_text', 'Conocer Comisiones'],
    ['cta_secondary_link', '#comisiones'],
    ['cta_tertiary_text', 'Guías y Documentos'],
    ['cta_tertiary_link', '#documentos'],
    ['gallery_categories', JSON.stringify(DEFAULT_GALLERY_CATEGORIES)],
    [
      'active_sections',
      JSON.stringify({
        inicio: true,
        nosotros: true,
        comisiones: true,
        delegaciones: true,
        temas: true,
        cronograma: true,
        documentos: true,
        galeria: true,
        comite: true,
        noticias: true,
        inscripciones: true,
        contacto: true,
      })
    ],
  ];

  for (const [key, val] of defaultSettings) {
    db.run('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)', [key, val, now]);
  }

  // About Sections
  seedDefaultAboutSections(db);

  // Committees
  const initialCommittees = [
    {
      id: 'com_ag',
      code: 'GA',
      name: 'Asamblea General (Primera Comisión: Desarme y Seguridad Internacional)',
      abbreviation: 'DISEC / AG',
      description: 'Órgano deliberativo principal de las Naciones Unidas donde todos los Estados Miembros tienen igual representación. Aborda los desafíos armamentistas emergentes y la no proliferación.',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
      language: 'Español',
      topic_a: 'Regulación del uso militar de la Inteligencia Artificial y armas autónomas en zonas de conflicto',
      topic_b: 'Militarización del espacio ultraterrestre y mecanismos de prevención de conflictos satelitales',
      topic_c: 'Control del tráfico ilícito de armas ligeras en el hemisferio occidental',
      president_name: 'Mariana Sofia Castro',
      president_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Santiago Morales Guerra',
      vicepresident_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 1,
    },
    {
      id: 'com_cs',
      code: 'UNSC',
      name: 'Consejo de Seguridad de las Naciones Unidas',
      abbreviation: 'CSNU / UNSC',
      description: 'El órgano con la responsabilidad primordial de mantener la paz y la seguridad internacionales. Con 15 miembros con poder de resolución vinculante y derecho de veto.',
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      language: 'English',
      topic_a: 'Mitigating maritime security threats and escalation in critical trade straits and chokepoints',
      topic_b: 'Humanitarian corridors and ceasefire verification mechanisms in persistent civil wars',
      topic_c: 'Reform of the Security Council permanent membership and the veto privilege',
      president_name: 'David Alejandro Dangond',
      president_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Valeria Cotes Lacouture',
      vicepresident_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 2,
    },
    {
      id: 'com_ecosoc',
      code: 'ECOSOC',
      name: 'Consejo Económico y Social',
      abbreviation: 'ECOSOC',
      description: 'Encargado de la coordinación y recomendación económica, ambiental y social para avanzar hacia el cumplimiento integral de los Objetivos de Desarrollo Sostenible.',
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
      language: 'Español',
      topic_a: 'Transición energética justa y financiamiento verde para economías en desarrollo en América Latina y el Caribe',
      topic_b: 'Impacto macroeconómico del endeudamiento soberano e inflación en la soberanía alimentaria',
      topic_c: 'Integración laboral juvenil y formalización del trabajo en la economía digital',
      president_name: 'Isabella Baute Maestre',
      president_photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Andrés Felipe Orozco',
      vicepresident_photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 3,
    },
    {
      id: 'com_unesco',
      code: 'UNESCO',
      name: 'Organización de las Naciones Unidas para la Educación, la Ciencia y la Cultura',
      abbreviation: 'UNESCO',
      description: 'Promueve la paz y la seguridad mundial mediante la educación intercultural, la difusión de la ciencia y la preservación incondicional del patrimonio histórico.',
      image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80',
      language: 'Español',
      topic_a: 'Protección y repatriación del patrimonio cultural material e inmaterial en territorios de posconflicto',
      topic_b: 'Garantía del acceso universal a la educación científica para niñas y comunidades rurales marginadas',
      topic_c: 'Preservación de lenguas indígenas originarias frente a la homogeneización digital',
      president_name: 'Camila Rodriguez Quintero',
      president_photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Juan Pablo Zuleta',
      vicepresident_photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 4,
    },
    {
      id: 'com_unicef',
      code: 'UNICEF',
      name: 'Fondo de las Naciones Unidas para la Infancia',
      abbreviation: 'UNICEF',
      description: 'Organismo dedicado a la protección de los derechos de la niñez y la adolescencia en más de 190 países y territorios, salvando vidas y garantizando su desarrollo.',
      image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
      language: 'Español',
      topic_a: 'Protección de la infancia en flujos migratorios transfronterizos y prevención del reclutamiento ilícito',
      topic_b: 'Erradicación de la desnutrición infantil crónica y seguridad hídrica en comunidades vulnerables',
      topic_c: 'Protección de menores ante la explotación y el ciberacoso en plataformas digitales emergentes',
      president_name: 'Lucia Fernanda Cuello',
      president_photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Mateo Jose Hinojosa',
      vicepresident_photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 5,
    },
    {
      id: 'com_who',
      code: 'WHO',
      name: 'World Health Organization',
      abbreviation: 'WHO / OMS',
      description: 'Directing and coordinating authority on international health work within the United Nations system, promoting universal health coverage and epidemic containment.',
      image_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
      language: 'English',
      topic_a: 'Establishing an enforceable global pandemic treaty and equitable access to pathogen genomic data',
      topic_b: 'Addressing antimicrobial resistance (AMR) in global food supply chains and clinical settings',
      topic_c: 'Youth mental health epidemics fueled by digital hyperconnectivity and social isolation',
      president_name: 'Gabriel Enrique Mejia',
      president_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Natalia Sofía Maya',
      vicepresident_photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 6,
    },
    {
      id: 'com_unwomen',
      code: 'UNWOMEN',
      name: 'ONU Mujeres (Entidad para la Igualdad de Género y el Empoderamiento)',
      abbreviation: 'UN Women',
      description: 'Lidera esfuerzos globales para defender los derechos de las mujeres y niñas, erradicar la violencia de género e impulsar su participación en la toma de decisiones.',
      image_url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80',
      language: 'Español',
      topic_a: 'Participación femenina en mesas de negociación de paz y reconstrucción constitucional',
      topic_b: 'Cierre de la brecha salarial y reconocimiento del trabajo de cuidados no remunerado',
      topic_c: 'Protección integral a defensoras de derechos humanos y líderes ambientales',
      president_name: 'Valentina Perez Soto',
      president_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Alejandro Daza Fuentes',
      vicepresident_photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 7,
    },
    {
      id: 'com_crisis',
      code: 'CRISIS',
      name: 'Gabinete de Crisis Contemporáneo: Consejo Ártico y Recursos Estratégicos',
      abbreviation: 'Crisis Committee',
      description: 'Comité dinámico y de ritmo acelerado con directivas continuas, actualizaciones en tiempo real y toma de decisiones táctica ante escaladas de tensión geopolítica.',
      image_url: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=600&q=80',
      language: 'Bilingüe (ES/EN)',
      topic_a: 'Disputa de soberanía sobre rutas marítimas de paso noroccidental y depósitos de hidrocarburos árticos',
      topic_b: 'Gestión de crisis ante incidente submarino no declarado en el lecho polar',
      topic_c: 'Regulación de flotas pesqueras no reguladas y contingencia ecológica por deshielo',
      president_name: 'Carlos Alberto Ustariz',
      president_photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      vicepresident_name: 'Daniela Gomez Pavajeau',
      vicepresident_photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80',
      status: 'active',
      sort_order: 8,
    },
  ];

  for (const c of initialCommittees) {
    db.run(
      `INSERT INTO committees (id, code, name, abbreviation, description, image_url, language, topic_a, topic_b, topic_c, president_name, president_photo, vicepresident_name, vicepresident_photo, status, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.code, c.name, c.abbreviation, c.description, c.image_url, c.language, c.topic_a, c.topic_b, c.topic_c, c.president_name, c.president_photo, c.vicepresident_name, c.vicepresident_photo, c.status, c.sort_order, now]
    );
  }

  // Countries
  const initialCountries = [
    { id: 'cnt_col', name: 'Colombia', official_name: 'República de Colombia', code: 'COL', flag_emoji: '🇨🇴', flag_url: '', info: 'Estado miembro de la ONU desde 1945.' },
    { id: 'cnt_usa', name: 'Estados Unidos', official_name: 'Estados Unidos de América', code: 'USA', flag_emoji: '🇺🇸', flag_url: '', info: 'Miembro permanente del Consejo de Seguridad (P5).' },
    { id: 'cnt_fra', name: 'Francia', official_name: 'República Francesa', code: 'FRA', flag_emoji: '🇫🇷', flag_url: '', info: 'Miembro permanente del Consejo de Seguridad (P5).' },
    { id: 'cnt_gbr', name: 'Reino Unido', official_name: 'Reino Unido de Gran Bretaña e Irlanda del Norte', code: 'GBR', flag_emoji: '🇬🇧', flag_url: '', info: 'Miembro permanente del Consejo de Seguridad (P5).' },
    { id: 'cnt_chn', name: 'China', official_name: 'República Popular China', code: 'CHN', flag_emoji: '🇨🇳', flag_url: '', info: 'Miembro permanente del Consejo de Seguridad (P5).' },
    { id: 'cnt_rus', name: 'Rusia', official_name: 'Federación de Rusia', code: 'RUS', flag_emoji: '🇷🇺', flag_url: '', info: 'Miembro permanente del Consejo de Seguridad (P5).' },
    { id: 'cnt_deu', name: 'Alemania', official_name: 'República Federal de Alemania', code: 'DEU', flag_emoji: '🇩🇪', flag_url: '', info: 'Potencia económica de la Unión Europea y miembro del G4.' },
    { id: 'cnt_jpn', name: 'Japón', official_name: 'Estado del Japón', code: 'JPN', flag_emoji: '🇯🇵', flag_url: '', info: 'Tercera potencia económica y líder en tecnología.' },
    { id: 'cnt_bra', name: 'Brasil', official_name: 'República Federativa de Brasil', code: 'BRA', flag_emoji: '🇧🇷', flag_url: '', info: 'Líder en Sudamérica y miembro fundador del BRICS.' },
    { id: 'cnt_mex', name: 'México', official_name: 'Estados Unidos Mexicanos', code: 'MEX', flag_emoji: '🇲🇽', flag_url: '', info: 'Referente de diplomacia y mediación en América Latina.' },
    { id: 'cnt_ind', name: 'India', official_name: 'República de la India', code: 'IND', flag_emoji: '🇮🇳', flag_url: '', info: 'El país más poblado del mundo y potencia nuclear emergente.' },
    { id: 'cnt_can', name: 'Canadá', official_name: 'Canadá', code: 'CAN', flag_emoji: '🇨🇦', flag_url: '', info: 'Miembro del G7 y líder en diplomacia humanitaria y ártica.' },
    { id: 'cnt_nor', name: 'Noruega', official_name: 'Reino de Noruega', code: 'NOR', flag_emoji: '🇳🇴', flag_url: '', info: 'Histórico facilitador de procesos de paz internacional.' },
    { id: 'cnt_zaf', name: 'Sudáfrica', official_name: 'República de Sudáfrica', code: 'ZAF', flag_emoji: '🇿🇦', flag_url: '', info: 'Voz líder en la Unión Africana y el Sur Global.' },
    { id: 'cnt_egy', name: 'Egipto', official_name: 'República Árabe de Egipto', code: 'EGY', flag_emoji: '🇪🇬', flag_url: '', info: 'Actor clave en la diplomacia de Oriente Medio y Norte de África.' },
    { id: 'cnt_esp', name: 'España', official_name: 'Reino de España', code: 'ESP', flag_emoji: '🇪🇸', flag_url: '', info: 'Puente diplomático entre Europa e Iberoamérica.' },
    { id: 'cnt_kor', name: 'Corea del Sur', official_name: 'República de Corea', code: 'KOR', flag_emoji: '🇰🇷', flag_url: '', info: 'Líder en innovación y estabilidad en Asia Oriental.' },
    { id: 'cnt_chl', name: 'Chile', official_name: 'República de Chile', code: 'CHL', flag_emoji: '🇨🇱', flag_url: '', info: 'Líder en gobernanza antártica y sostenibilidad oceánica.' },
    { id: 'cnt_arg', name: 'Argentina', official_name: 'República Argentina', code: 'ARG', flag_emoji: '🇦🇷', flag_url: '', info: 'Miembro del G20 con activa presencia diplomática.' },
    { id: 'cnt_sau', name: 'Arabia Saudita', official_name: 'Reino de Arabia Saudita', code: 'SAU', flag_emoji: '🇸🇦', flag_url: '', info: 'Potencia energética en Oriente Medio y líder de la OPEP.' },
  ];

  for (const cnt of initialCountries) {
    db.run(
      `INSERT INTO countries (id, name, official_name, code, flag_emoji, flag_url, additional_info, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [cnt.id, cnt.name, cnt.official_name, cnt.code, cnt.flag_emoji, cnt.flag_url, cnt.info]
    );
  }

  // Delegations linking Committee <-> Country <-> Delegate
  const delegationsData = [
    { id: 'del_1', com: 'com_ag', cnt: 'cnt_col', name: 'Juan Sebastián Morales', school: 'Colegio Bilingüe de Valledupar', status: 'assigned' },
    { id: 'del_2', com: 'com_ag', cnt: 'cnt_usa', name: 'María Paula Quintero', school: 'Gimnasio del Norte', status: 'assigned' },
    { id: 'del_3', com: 'com_ag', cnt: 'cnt_fra', name: '', school: '', status: 'available' },
    { id: 'del_4', com: 'com_ag', cnt: 'cnt_bra', name: '', school: '', status: 'available' },
    { id: 'del_5', com: 'com_cs', cnt: 'cnt_usa', name: 'Nicolás Eduardo Dangond', school: 'Colegio Bilingüe de Valledupar', status: 'assigned' },
    { id: 'del_6', com: 'com_cs', cnt: 'cnt_fra', name: 'Ana Sofía Maestre', school: 'Colegio San Fernando', status: 'assigned' },
    { id: 'del_7', com: 'com_cs', cnt: 'cnt_gbr', name: '', school: '', status: 'available' },
    { id: 'del_8', com: 'com_cs', cnt: 'cnt_chn', name: '', school: '', status: 'available' },
    { id: 'del_9', com: 'com_cs', cnt: 'cnt_rus', name: '', school: '', status: 'available' },
    { id: 'del_10', com: 'com_ecosoc', cnt: 'cnt_col', name: 'Daniela Isabel Baute', school: 'Colegio Bilingüe de Valledupar', status: 'assigned' },
    { id: 'del_11', com: 'com_ecosoc', cnt: 'cnt_deu', name: '', school: '', status: 'available' },
    { id: 'del_12', com: 'com_unesco', cnt: 'cnt_esp', name: 'Felipe Andrés Cuello', school: 'Colegio Sierra Nevada', status: 'assigned' },
    { id: 'del_13', com: 'com_unicef', cnt: 'cnt_col', name: '', school: '', status: 'available' },
    { id: 'del_14', com: 'com_who', cnt: 'cnt_jpn', name: 'Laura Camila Oñate', school: 'Colegio Bilingüe de Valledupar', status: 'assigned' },
    { id: 'del_15', com: 'com_unwomen', cnt: 'cnt_zaf', name: '', school: '', status: 'available' },
    { id: 'del_16', com: 'com_crisis', cnt: 'cnt_nor', name: 'Carlos Mario Hinojosa', school: 'Colegio Santa Fe', status: 'assigned' },
    { id: 'del_17', com: 'com_crisis', cnt: 'cnt_can', name: '', school: '', status: 'available' },
  ];

  for (const d of delegationsData) {
    db.run(
      `INSERT INTO delegations (id, committee_id, country_id, delegate_name, delegate_school, delegate_email, delegate_phone, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, '', '', ?, '', ?)`,
      [d.id, d.com, d.cnt, d.name, d.school, d.status, now]
    );
  }

  // Schedule (Cronograma)
  const scheduleItems = [
    { id: 'sch_1', day: 'Día 1 - Viernes 23 Oct', date: '2026-10-23', t_start: '07:30 AM', t_end: '08:30 AM', act: 'Acreditación y Registro de Delegaciones', desc: 'Entrega de escarapelas, carpetas oficiales y credenciales en el Auditorio Principal.', loc: 'Auditorio Principal Consuelo Araújo', aud: 'Todos los participantes', order: 1 },
    { id: 'sch_2', day: 'Día 1 - Viernes 23 Oct', date: '2026-10-23', t_start: '08:45 AM', t_end: '10:15 AM', act: 'Solemne Ceremonia de Apertura BIMUN XXVII', desc: 'Discurso de la Secretaría General, bienvenida por las directivas del Colegio Bilingüe y conferencia inaugural del Embajador invitado.', loc: 'Auditorio Principal', aud: 'Todos los participantes e invitados', order: 2 },
    { id: 'sch_3', day: 'Día 1 - Viernes 23 Oct', date: '2026-10-23', t_start: '10:30 AM', t_end: '01:00 PM', act: 'Primera Sesión de Debate Formal', desc: 'Pase de lista, fijación de agenda y apertura de lista de oradores para el Tema A en cada sala de comisión.', loc: 'Salas de Comisiones (Bloques A y B)', aud: 'Delegados por comité', order: 3 },
    { id: 'sch_4', day: 'Día 1 - Viernes 23 Oct', date: '2026-10-23', t_start: '01:00 PM', t_end: '02:00 PM', act: 'Almuerzo Diplomático', desc: 'Espacio de confraternidad y descanso para delegados y asesores docentes.', loc: 'Cafetería y Zonas Verdes del Campus', aud: 'Todos', order: 4 },
    { id: 'sch_5', day: 'Día 1 - Viernes 23 Oct', date: '2026-10-23', t_start: '02:15 PM', t_end: '05:30 PM', act: 'Segunda Sesión de Debate y Primeros Bloques', desc: 'Caucus moderados intensivos y primeros acuerdos informales entre bloques de países.', loc: 'Salas de Comisiones', aud: 'Delegados', order: 5 },
    { id: 'sch_6', day: 'Día 2 - Sábado 24 Oct', date: '2026-10-24', t_start: '08:00 AM', t_end: '12:30 PM', act: 'Tercera Sesión de Debate y Redacción de Resoluciones', desc: 'Redacción rigurosa de borradores de resolución (Draft Resolutions) con cláusulas operativas.', loc: 'Salas de Comisiones', aud: 'Delegados', order: 6 },
    { id: 'sch_7', day: 'Día 2 - Sábado 24 Oct', date: '2026-10-24', t_start: '02:00 PM', t_end: '05:00 PM', act: 'Cuarta Sesión: Enmiendas y Debate de Crisis', desc: 'Introducción de eventos de crisis sorpresa e introducción de enmiendas amigables y no amigables.', loc: 'Salas de Comisiones', aud: 'Delegados', order: 7 },
    { id: 'sch_8', day: 'Día 3 - Domingo 25 Oct', date: '2026-10-25', t_start: '08:30 AM', t_end: '11:30 AM', act: 'Quinta Sesión: Votación Plenaria de Resoluciones', desc: 'Votación calificada final de proyectos de resolución en cada comisión.', loc: 'Salas de Comisiones', aud: 'Delegados', order: 8 },
    { id: 'sch_9', day: 'Día 3 - Domingo 25 Oct', date: '2026-10-25', t_start: '12:00 PM', t_end: '02:00 PM', act: 'Ceremonia de Clausura y Premiación', desc: 'Entrega de distinciones al Mejor Delegado, Delegado Sobresaliente, Mejor Documento de Posición y Mejor Delegación Colegial.', loc: 'Auditorio Principal', aud: 'Todos los participantes y familias', order: 9 },
  ];

  for (const s of scheduleItems) {
    db.run(
      `INSERT INTO schedule (id, day_label, date, time_start, time_end, activity, description, location, audience, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.day, s.date, s.t_start, s.t_end, s.act, s.desc, s.loc, s.aud, s.order]
    );
  }

  // Documents
  const initialDocs = [
    {
      id: 'doc_1',
      title: 'Manual de Procedimiento Parlamentario BIMUN XXVII',
      category: 'Protocolo',
      file_url: '#',
      description: 'Reglamento oficial detallado con mociones, puntos de privilegio y estructura de votaciones.',
      file_size: '2.4 MB',
      is_featured: 1,
      sort_order: 1,
    },
    {
      id: 'doc_2',
      title: 'Guía Maestra para la Elaboración de Position Papers',
      category: 'Académico',
      file_url: '#',
      description: 'Formato y pautas de investigación para la redacción de los documentos de postura oficial.',
      file_size: '1.8 MB',
      is_featured: 1,
      sort_order: 2,
    },
    {
      id: 'doc_3',
      title: 'Plantilla Oficial de Proyectos de Resolución (Draft Resolution)',
      category: 'Plantillas',
      file_url: '#',
      description: 'Modelo en formato editable con verbos preambulatorios y operativos de las Naciones Unidas.',
      file_size: '650 KB',
      is_featured: 1,
      sort_order: 3,
    },
    {
      id: 'doc_4',
      title: 'Carta Invitación y Convocatoria a Colegios Asesores',
      category: 'Inscripción',
      file_url: '#',
      description: 'Documento institucional dirigido a rectores, directores de área y docentes coordinadores.',
      file_size: '1.2 MB',
      is_featured: 0,
      sort_order: 4,
    },
    {
      id: 'doc_5',
      title: 'Código de Conducta y Vestimenta Diplomática',
      category: 'Normativa',
      file_url: '#',
      description: 'Regulaciones sobre etiqueta Western Business Attire, uso de dispositivos y convivencia.',
      file_size: '890 KB',
      is_featured: 0,
      sort_order: 5,
    },
  ];

  for (const doc of initialDocs) {
    db.run(
      `INSERT INTO documents (id, title, category, file_url, description, file_size, is_featured, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doc.id, doc.title, doc.category, doc.file_url, doc.description, doc.file_size, doc.is_featured, doc.sort_order, now]
    );
  }

  // Gallery
  seedDefaultGallery(db);

  // Organizing Team
  const teamItems = [
    { id: 'tm_1', name: 'Sofía Elena Dangond', role: 'Secretaria General', cat: 'Secretaría', photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', bio: 'Estudiante de grado 11 con 5 años de trayectoria en modelos MUN nacionales e internacionales.', email: 'secgeneral.bimun@colegiobilingue.edu.co', order: 1 },
    { id: 'tm_2', name: 'Mateo Alejandro Morales', role: 'Vicesecretario General', cat: 'Secretaría', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', bio: 'Líder en articulación logística y relaciones interinstitucionales para BIMUN XXVII.', email: 'vicesecretario.bimun@colegiobilingue.edu.co', order: 2 },
    { id: 'tm_3', name: 'Valeria Cotes Quintero', role: 'Directora Académica', cat: 'Académica', photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', bio: 'Responsable de la supervisión de temas, guías de estudio y capacitación de presidentes de mesa.', email: 'academica.bimun@colegiobilingue.edu.co', order: 3 },
    { id: 'tm_4', name: 'Andrés Felipe Maestre', role: 'Director de Logística y Protocolo', cat: 'Logística', photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', bio: 'Encargado de sedes, transporte diplomático, hospitalidad y materiales oficiales.', email: 'logistica.bimun@colegiobilingue.edu.co', order: 4 },
    { id: 'tm_5', name: 'Camila Andrea Baute', role: 'Directora de Prensa y Comunicaciones', cat: 'Comunicaciones', photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', bio: 'Gestión de cobertura audiovisual, boletines oficiales y redes sociales en tiempo real.', email: 'prensa.bimun@colegiobilingue.edu.co', order: 5 },
    { id: 'tm_6', name: 'Prof. Juan Carlos Guerra', role: 'Faculty Advisor / Asesor Docente', cat: 'Facultad', photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', bio: 'Docente de Ciencias Sociales y Relaciones Internacionales del Colegio Bilingüe de Valledupar.', email: 'jguerra@colegiobilingue.edu.co', order: 6 },
  ];

  for (const t of teamItems) {
    db.run(
      `INSERT INTO organizing_team (id, name, role, category, photo_url, bio, email, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.name, t.role, t.cat, t.photo_url, t.bio, t.email, t.order]
    );
  }

  // News (Noticias)
  const initialNews = [
    {
      id: 'nw_1',
      title: 'Apertura oficial de inscripciones para BIMUN XXVII',
      slug: 'apertura-inscripciones-bimun-xxvii',
      excerpt: 'La Secretaría General abre la convocatoria para delegados individuales y delegaciones de colegios nacionales e internacionales.',
      content: 'Nos complace anunciar que a partir de la fecha quedan oficialmente habilitadas las inscripciones para la vigésimo séptima edición del Modelo de Naciones Unidas de la Fundación Colegio Bilingüe de Valledupar (BIMUN XXVII). Invitamos a las instituciones educativas de Colombia a postular a sus delegaciones para vivir una experiencia formativa del más alto estándar diplomático.',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
      category: 'Inscripciones',
      publish_date: '2026-09-01',
    },
    {
      id: 'nw_2',
      title: 'Publicación de las Guías de Estudio Oficiales',
      slug: 'publicacion-guias-estudio-oficiales',
      excerpt: 'El equipo académico presenta los documentos de investigación y contexto para las 8 comisiones del modelo.',
      content: 'La Dirección Académica de BIMUN XXVII pone a disposición de todos los delegados las Guías de Estudio oficiales preparadas por nuestras mesas directivas. Estos documentos contienen el marco histórico, análisis jurídico, preguntas guía y fuentes recomendadas para la preparación de los Position Papers.',
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      category: 'Académico',
      publish_date: '2026-09-05',
    },
    {
      id: 'nw_3',
      title: 'Taller de Capacitación en Oratoria y Debate Parlamentario',
      slug: 'taller-capacitacion-oratoria-debate',
      excerpt: 'Sesión virtual interactiva para delegados primerizos sobre protocolo THIMUN y redacción de enmiendas.',
      content: 'Con el propósito de nivelar conocimientos y brindar herramientas prácticas a quienes participan por primera vez en un modelo de naciones unidas, se llevará a cabo un taller magistral guiado por exsecretarios generales del BIMUN.',
      image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
      category: 'Capacitación',
      publish_date: '2026-09-09',
    },
  ];

  for (const n of initialNews) {
    db.run(
      `INSERT INTO news (id, title, slug, excerpt, content, image_url, category, publish_date, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [n.id, n.title, n.slug, n.excerpt, n.content, n.image_url, n.category, n.publish_date]
    );
  }

  // Registrations (Initial sample registrations)
  const initialRegs = [
    {
      id: 'reg_1',
      name: 'Gabriel Alfonso Daza',
      email: 'gabriel.daza@example.com',
      phone: '+57 315 789 4432',
      school: 'Colegio Colombo Inglés',
      del_type: 'individual',
      grade: '10°',
      com1: 'Asamblea General (DISEC)',
      com2: 'Consejo de Seguridad',
      cnt1: 'Reino Unido',
      cnt2: 'Alemania',
      exp: '2 modelos previos (ValleMUN, ColMUN)',
      med: 'Ninguna',
      emg: 'Alfonso Daza (+57 312 456 7890)',
      status: 'pending',
    },
    {
      id: 'reg_2',
      name: 'Isabella Martínez Cuello',
      email: 'isabella.martinez@example.com',
      phone: '+57 301 654 9988',
      school: 'Colegio San Fernando',
      del_type: 'individual',
      grade: '11°',
      com1: 'UN Women',
      com2: 'UNESCO',
      cnt1: 'Sudáfrica',
      cnt2: 'Francia',
      exp: '3 modelos previos como Mejor Delegada',
      med: 'Alergia a mariscos',
      emg: 'Patricia Cuello (+57 310 998 1234)',
      status: 'approved',
    }
  ];

  for (const r of initialRegs) {
    db.run(
      `INSERT INTO registrations (id, full_name, email, phone, school, delegation_type, grade, committee_preference_1, committee_preference_2, country_preference_1, country_preference_2, experience, dietary_medical, emergency_contact, status, assigned_committee_id, assigned_country_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', ?)`,
      [r.id, r.name, r.email, r.phone, r.school, r.del_type, r.grade, r.com1, r.com2, r.cnt1, r.cnt2, r.exp, r.med, r.emg, r.status, now]
    );
  }

  console.log('Seed completed successfully.');
}

export function clearDemoData(): { success: boolean; clearedCounts: Record<string, number> } {
  if (!dbInstance) throw new Error('Database not initialized');
  
  const tables = [
    'registrations',
    'delegations',
    'committees',
    'countries',
    'schedule',
    'documents',
    'gallery',
    'news',
    'organizing_team'
  ];

  const clearedCounts: Record<string, number> = {};

  for (const table of tables) {
    try {
      const countRow = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM ${table};`);
      clearedCounts[table] = countRow?.count || 0;
      runSql(`DELETE FROM ${table};`);
    } catch (err: any) {
      console.warn(`Could not clear table ${table}:`, err.message);
      clearedCounts[table] = 0;
    }
  }

  saveDb();
  return { success: true, clearedCounts };
}

export function reloadDemoData(): { success: boolean } {
  if (!dbInstance) throw new Error('Database not initialized');

  // First clear existing data to prevent duplicates
  clearDemoData();

  // Re-run seed on dbInstance
  seedInitialData(dbInstance);
  saveDb();

  return { success: true };
}

