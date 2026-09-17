import fs from 'fs';
import path from 'path';
import { Pool, PoolConfig } from 'pg';
import mysql, { Pool as MySqlPool, PoolOptions } from 'mysql2/promise';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import bcrypt from 'bcryptjs';

export type DatabaseType = 'sqlite' | 'postgres' | 'mysql';

export interface DatabaseConnectionConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
}

export interface DatabaseStatus {
  activeType: DatabaseType;
  configuredType: DatabaseType;
  isConnected: boolean;
  host?: string;
  database?: string;
  error?: string | null;
  sqliteFallback: boolean;
}

const CONFIG_FILE = path.join(process.cwd(), 'database-config.json');
const SQLITE_FILE = path.join(process.cwd(), 'bimun_database.sqlite');

let currentConfig: DatabaseConnectionConfig = {
  type: 'sqlite',
};

// Database clients
let sqliteDb: SqlJsDatabase | null = null;
let pgPool: Pool | null = null;
let mysqlPool: MySqlPool | null = null;
let isInitialized = false;
let activeDatabaseType: DatabaseType = 'sqlite';
let lastErrorMessage: string | null = null;

// Read saved config on startup
export function loadSavedConfig(): DatabaseConnectionConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.type === 'sqlite' || parsed.type === 'postgres' || parsed.type === 'mysql')) {
        currentConfig = parsed;
        return currentConfig;
      }
    }
  } catch (err) {
    console.error('Error loading database-config.json:', err);
  }
  return { type: 'sqlite' };
}

export function saveConfigToFile(config: DatabaseConnectionConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    currentConfig = { ...config };
  } catch (err) {
    console.error('Failed to save database-config.json:', err);
  }
}

// -------------------------------------------------------------
// SQLite Helpers
// -------------------------------------------------------------
async function getSqliteDb(): Promise<SqlJsDatabase> {
  if (sqliteDb) return sqliteDb;

  const SQL = await initSqlJs();
  if (fs.existsSync(SQLITE_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(SQLITE_FILE);
      sqliteDb = new SQL.Database(fileBuffer);
      console.log('[SQLite] Loaded existing database from', SQLITE_FILE);
    } catch (err) {
      console.error('[SQLite] Error reading existing file, creating new:', err);
      sqliteDb = new SQL.Database();
    }
  } else {
    console.log('[SQLite] Creating new database file...');
    sqliteDb = new SQL.Database();
  }

  initSqliteSchemaAndSeed(sqliteDb);
  saveSqliteDisk();
  return sqliteDb;
}

export function saveSqliteDisk(): void {
  if (!sqliteDb) return;
  try {
    const data = sqliteDb.export();
    fs.writeFileSync(SQLITE_FILE, Buffer.from(data));
  } catch (err) {
    console.error('[SQLite] Failed to write database to disk:', err);
  }
}

function initSqliteSchemaAndSeed(db: SqlJsDatabase): void {
  // Schema creation
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
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
    CREATE TABLE IF NOT EXISTS delegations (
      id TEXT PRIMARY KEY,
      committee_id TEXT NOT NULL,
      country_id TEXT NOT NULL,
      delegate_name TEXT,
      delegate_school TEXT,
      delegate_email TEXT,
      delegate_phone TEXT,
      status TEXT DEFAULT 'available',
      notes TEXT,
      created_at TEXT NOT NULL
    );
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
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      school TEXT NOT NULL,
      delegation_type TEXT NOT NULL,
      grade TEXT,
      committee_preference_1 TEXT,
      committee_preference_2 TEXT,
      country_preference_1 TEXT,
      country_preference_2 TEXT,
      experience TEXT,
      dietary_medical TEXT,
      emergency_contact TEXT,
      status TEXT DEFAULT 'pending',
      assigned_committee_id TEXT,
      assigned_country_id TEXT,
      notes TEXT,
      payment_receipt TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
  `);

  // Default admin user check
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
  }
}

// -------------------------------------------------------------
// PostgreSQL & MySQL Schema Initialization
// -------------------------------------------------------------
async function initPgSchema(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS about_sections (
      id VARCHAR(255) PRIMARY KEY,
      section_key VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT,
      content TEXT NOT NULL,
      icon VARCHAR(255),
      sort_order INT DEFAULT 0,
      is_active INT DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS committees (
      id VARCHAR(255) PRIMARY KEY,
      code VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      abbreviation VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      language VARCHAR(100) DEFAULT 'Español',
      topic_a TEXT NOT NULL,
      topic_b TEXT,
      topic_c TEXT,
      president_name VARCHAR(255),
      president_photo TEXT,
      vicepresident_name VARCHAR(255),
      vicepresident_photo TEXT,
      status VARCHAR(50) DEFAULT 'active',
      sort_order INT DEFAULT 0,
      created_at VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS countries (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      official_name VARCHAR(255),
      code VARCHAR(100) UNIQUE NOT NULL,
      flag_emoji VARCHAR(50),
      flag_url TEXT,
      additional_info TEXT,
      status VARCHAR(50) DEFAULT 'active'
    );
    CREATE TABLE IF NOT EXISTS delegations (
      id VARCHAR(255) PRIMARY KEY,
      committee_id VARCHAR(255) NOT NULL,
      country_id VARCHAR(255) NOT NULL,
      delegate_name VARCHAR(255),
      delegate_school VARCHAR(255),
      delegate_email VARCHAR(255),
      delegate_phone VARCHAR(255),
      status VARCHAR(50) DEFAULT 'available',
      notes TEXT,
      created_at VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schedule (
      id VARCHAR(255) PRIMARY KEY,
      day_label VARCHAR(255) NOT NULL,
      date VARCHAR(255) NOT NULL,
      time_start VARCHAR(100) NOT NULL,
      time_end VARCHAR(100) NOT NULL,
      activity VARCHAR(255) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      audience VARCHAR(255) DEFAULT 'Todos los participantes',
      sort_order INT DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      description TEXT,
      file_size VARCHAR(100),
      is_featured INT DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gallery (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      caption TEXT,
      image_url TEXT NOT NULL,
      category VARCHAR(255) DEFAULT 'Debate',
      edition VARCHAR(255) DEFAULT 'BIMUN XXVI',
      sort_order INT DEFAULT 0,
      created_at VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS organizing_team (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      category VARCHAR(255) DEFAULT 'Secretaría',
      photo_url TEXT,
      bio TEXT,
      email VARCHAR(255),
      sort_order INT DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS news (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      category VARCHAR(255) DEFAULT 'General',
      publish_date VARCHAR(255) NOT NULL,
      is_published INT DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS registrations (
      id VARCHAR(255) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NOT NULL,
      school VARCHAR(255) NOT NULL,
      delegation_type VARCHAR(100) NOT NULL,
      grade VARCHAR(100),
      committee_preference_1 VARCHAR(255),
      committee_preference_2 VARCHAR(255),
      country_preference_1 VARCHAR(255),
      country_preference_2 VARCHAR(255),
      experience TEXT,
      dietary_medical TEXT,
      emergency_contact TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      assigned_committee_id VARCHAR(255),
      assigned_country_id VARCHAR(255),
      notes TEXT,
      payment_receipt TEXT,
      created_at VARCHAR(255) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      role VARCHAR(100) DEFAULT 'admin',
      created_at VARCHAR(255) NOT NULL
    );
  `);
}

async function initMySqlSchema(pool: MySqlPool): Promise<void> {
  const tables = [
    `CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(191) PRIMARY KEY,
      value LONGTEXT NOT NULL,
      updated_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS about_sections (
      id VARCHAR(191) PRIMARY KEY,
      section_key VARCHAR(191) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT,
      content LONGTEXT NOT NULL,
      icon VARCHAR(191),
      sort_order INT DEFAULT 0,
      is_active INT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS committees (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(191) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      abbreviation VARCHAR(191) NOT NULL,
      description LONGTEXT NOT NULL,
      image_url LONGTEXT,
      language VARCHAR(100) DEFAULT 'Español',
      topic_a LONGTEXT NOT NULL,
      topic_b LONGTEXT,
      topic_c LONGTEXT,
      president_name VARCHAR(255),
      president_photo LONGTEXT,
      vicepresident_name VARCHAR(255),
      vicepresident_photo LONGTEXT,
      status VARCHAR(50) DEFAULT 'active',
      sort_order INT DEFAULT 0,
      created_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS countries (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      official_name VARCHAR(255),
      code VARCHAR(191) UNIQUE NOT NULL,
      flag_emoji VARCHAR(50),
      flag_url LONGTEXT,
      additional_info LONGTEXT,
      status VARCHAR(50) DEFAULT 'active'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS delegations (
      id VARCHAR(191) PRIMARY KEY,
      committee_id VARCHAR(191) NOT NULL,
      country_id VARCHAR(191) NOT NULL,
      delegate_name VARCHAR(255),
      delegate_school VARCHAR(255),
      delegate_email VARCHAR(255),
      delegate_phone VARCHAR(255),
      status VARCHAR(50) DEFAULT 'available',
      notes LONGTEXT,
      created_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS schedule (
      id VARCHAR(191) PRIMARY KEY,
      day_label VARCHAR(191) NOT NULL,
      date VARCHAR(191) NOT NULL,
      time_start VARCHAR(100) NOT NULL,
      time_end VARCHAR(100) NOT NULL,
      activity VARCHAR(255) NOT NULL,
      description LONGTEXT,
      location VARCHAR(255),
      audience VARCHAR(255) DEFAULT 'Todos los participantes',
      sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(191) NOT NULL,
      file_url LONGTEXT NOT NULL,
      description LONGTEXT,
      file_size VARCHAR(100),
      is_featured INT DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS gallery (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      caption LONGTEXT,
      image_url LONGTEXT NOT NULL,
      category VARCHAR(191) DEFAULT 'Debate',
      edition VARCHAR(191) DEFAULT 'BIMUN XXVI',
      sort_order INT DEFAULT 0,
      created_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS organizing_team (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      category VARCHAR(191) DEFAULT 'Secretaría',
      photo_url LONGTEXT,
      bio LONGTEXT,
      email VARCHAR(255),
      sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS news (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(191) UNIQUE NOT NULL,
      excerpt LONGTEXT NOT NULL,
      content LONGTEXT NOT NULL,
      image_url LONGTEXT,
      category VARCHAR(191) DEFAULT 'General',
      publish_date VARCHAR(191) NOT NULL,
      is_published INT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS registrations (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NOT NULL,
      school VARCHAR(255) NOT NULL,
      delegation_type VARCHAR(100) NOT NULL,
      grade VARCHAR(100),
      committee_preference_1 VARCHAR(255),
      committee_preference_2 VARCHAR(255),
      country_preference_1 VARCHAR(255),
      country_preference_2 VARCHAR(255),
      experience LONGTEXT,
      dietary_medical LONGTEXT,
      emergency_contact LONGTEXT,
      status VARCHAR(50) DEFAULT 'pending',
      assigned_committee_id VARCHAR(191),
      assigned_country_id VARCHAR(191),
      notes LONGTEXT,
      payment_receipt LONGTEXT,
      created_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      username VARCHAR(191) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      role VARCHAR(100) DEFAULT 'admin',
      created_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  ];

  for (const sql of tables) {
    await pool.query(sql);
  }
}

// -------------------------------------------------------------
// Connection Testing
// -------------------------------------------------------------
export async function testConnection(config: DatabaseConnectionConfig): Promise<{ success: boolean; message: string }> {
  if (config.type === 'sqlite') {
    return { success: true, message: 'Base de datos local SQLite lista y disponible en bimun_database.sqlite.' };
  }

  if (config.type === 'postgres') {
    let testPool: Pool | null = null;
    try {
      const poolConfig: PoolConfig = config.connectionString
        ? { connectionString: config.connectionString, connectionTimeoutMillis: 5000 }
        : {
            host: config.host || 'localhost',
            port: Number(config.port) || 5432,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
            connectionTimeoutMillis: 5000,
          };

      testPool = new Pool(poolConfig);
      const res = await testPool.query('SELECT NOW() as now, version() as version;');
      await testPool.end();
      return {
        success: true,
        message: `¡Conexión exitosa a PostgreSQL! Versión: ${res.rows[0]?.version?.split(' ')[0] || 'PostgreSQL'}`,
      };
    } catch (err: any) {
      if (testPool) {
        try { await testPool.end(); } catch {}
      }
      return {
        success: false,
        message: `Fallo de conexión PostgreSQL: ${err.message}`,
      };
    }
  }

  if (config.type === 'mysql') {
    let testPool: MySqlPool | null = null;
    try {
      const poolOptions: PoolOptions = config.connectionString
        ? { uri: config.connectionString, connectTimeout: 5000, ssl: { rejectUnauthorized: false } }
        : {
            host: config.host || 'localhost',
            port: Number(config.port) || 3306,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
            connectTimeout: 5000,
          };

      testPool = mysql.createPool(poolOptions);
      const [rows] = await testPool.query('SELECT NOW() as now, VERSION() as version;');
      await testPool.end();
      const firstRow: any = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
      return {
        success: true,
        message: `¡Conexión exitosa a MySQL! Versión: ${firstRow.version || 'MySQL'}`,
      };
    } catch (err: any) {
      if (testPool) {
        try { await testPool.end(); } catch {}
      }
      return {
        success: false,
        message: `Fallo de conexión MySQL: ${err.message}`,
      };
    }
  }

  return { success: false, message: 'Tipo de base de datos no soportado.' };
}

// -------------------------------------------------------------
// Database Initialization with Fallback
// -------------------------------------------------------------
export async function initializeDatabaseManager(): Promise<void> {
  loadSavedConfig();
  await getSqliteDb(); // SQLite is always pre-initialized for seamless fallback

  if (currentConfig.type === 'sqlite') {
    activeDatabaseType = 'sqlite';
    lastErrorMessage = null;
    isInitialized = true;
    console.log('[DB-Manager] Active database: SQLite Local.');
    return;
  }

  if (currentConfig.type === 'postgres') {
    try {
      console.log('[DB-Manager] Connecting to PostgreSQL...');
      const poolConfig: PoolConfig = currentConfig.connectionString
        ? { connectionString: currentConfig.connectionString }
        : {
            host: currentConfig.host,
            port: Number(currentConfig.port) || 5432,
            database: currentConfig.database,
            user: currentConfig.user,
            password: currentConfig.password,
            ssl: currentConfig.ssl ? { rejectUnauthorized: false } : undefined,
          };

      const pool = new Pool(poolConfig);
      await pool.query('SELECT 1;');
      await initPgSchema(pool);
      pgPool = pool;
      activeDatabaseType = 'postgres';
      lastErrorMessage = null;
      isInitialized = true;
      console.log('[DB-Manager] Connected to PostgreSQL successfully.');
      return;
    } catch (err: any) {
      console.error('[DB-Manager] PostgreSQL connection failed, falling back to SQLite:', err.message);
      lastErrorMessage = `PostgreSQL: ${err.message}. Operando en modo seguro sobre SQLite local.`;
      activeDatabaseType = 'sqlite';
      isInitialized = true;
      return;
    }
  }

  if (currentConfig.type === 'mysql') {
    try {
      console.log('[DB-Manager] Connecting to MySQL...');
      const poolOptions: PoolOptions = currentConfig.connectionString
        ? { uri: currentConfig.connectionString }
        : {
            host: currentConfig.host,
            port: Number(currentConfig.port) || 3306,
            database: currentConfig.database,
            user: currentConfig.user,
            password: currentConfig.password,
            ssl: currentConfig.ssl ? { rejectUnauthorized: false } : undefined,
          };

      const pool = mysql.createPool(poolOptions);
      await pool.query('SELECT 1;');
      await initMySqlSchema(pool);
      mysqlPool = pool;
      activeDatabaseType = 'mysql';
      lastErrorMessage = null;
      isInitialized = true;
      console.log('[DB-Manager] Connected to MySQL successfully.');
      return;
    } catch (err: any) {
      console.error('[DB-Manager] MySQL connection failed, falling back to SQLite:', err.message);
      lastErrorMessage = `MySQL: ${err.message}. Operando en modo seguro sobre SQLite local.`;
      activeDatabaseType = 'sqlite';
      isInitialized = true;
    }
  }

  // Ensure default superadmin exists across all database engines
  await ensureDefaultAdmin();
}

/**
 * Guarantees that the default superadmin (admin / bimun2026) exists in the active database engine
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('bimun2026', salt);
    const now = new Date().toISOString();

    const existing = await executeQueryOne<any>(
      'SELECT id, username, password_hash FROM users WHERE LOWER(TRIM(username)) = ?;',
      ['admin']
    );

    if (!existing) {
      await executeRunSql(
        'INSERT INTO users (id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?);',
        ['usr_admin_1', 'admin', hash, 'Secretaría General BIMUN', 'superadmin', now]
      );
      console.log('✅ Default superadmin created/ensured: admin / bimun2026');
    }
  } catch (err: any) {
    console.error('Error ensuring default admin:', err.message);
  }
}

// -------------------------------------------------------------
// Switch Active Engine Dynamically
// -------------------------------------------------------------
export async function switchDatabaseEngine(config: DatabaseConnectionConfig): Promise<{ success: boolean; message: string }> {
  // 1. Test target connection first
  const testRes = await testConnection(config);
  if (!testRes.success) {
    return testRes;
  }

  // 2. Save config
  saveConfigToFile(config);

  // 3. Clean up existing pools if moving away
  if (pgPool && config.type !== 'postgres') {
    try { await pgPool.end(); } catch {}
    pgPool = null;
  }
  if (mysqlPool && config.type !== 'mysql') {
    try { await mysqlPool.end(); } catch {}
    mysqlPool = null;
  }

  // 4. Initialize new engine
  if (config.type === 'sqlite') {
    activeDatabaseType = 'sqlite';
    lastErrorMessage = null;
    return { success: true, message: 'Base de datos cambiada exitosamente a SQLite Local.' };
  }

  if (config.type === 'postgres') {
    try {
      const poolConfig: PoolConfig = config.connectionString
        ? { connectionString: config.connectionString }
        : {
            host: config.host,
            port: Number(config.port) || 5432,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
          };
      const pool = new Pool(poolConfig);
      await pool.query('SELECT 1;');
      await initPgSchema(pool);
      pgPool = pool;
      activeDatabaseType = 'postgres';
      lastErrorMessage = null;
      return { success: true, message: 'Conexión activada exitosamente a PostgreSQL.' };
    } catch (err: any) {
      activeDatabaseType = 'sqlite';
      lastErrorMessage = err.message;
      return { success: false, message: `Error activando PostgreSQL: ${err.message}` };
    }
  }

  if (config.type === 'mysql') {
    try {
      const poolOptions: PoolOptions = config.connectionString
        ? { uri: config.connectionString, ssl: { rejectUnauthorized: false } }
        : {
            host: config.host,
            port: Number(config.port) || 3306,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
          };
      const pool = mysql.createPool(poolOptions);
      await pool.query('SELECT 1;');
      await initMySqlSchema(pool);
      mysqlPool = pool;
      activeDatabaseType = 'mysql';
      lastErrorMessage = null;
      return { success: true, message: 'Conexión activada exitosamente a MySQL.' };
    } catch (err: any) {
      activeDatabaseType = 'sqlite';
      lastErrorMessage = err.message;
      return { success: false, message: `Error activando MySQL: ${err.message}` };
    }
  }

  return { success: false, message: 'Tipo de base de datos no reconocido.' };
}

// -------------------------------------------------------------
// Get Status
// -------------------------------------------------------------
export function getDatabaseStatus(): DatabaseStatus {
  return {
    activeType: activeDatabaseType,
    configuredType: currentConfig.type,
    isConnected: activeDatabaseType === currentConfig.type,
    host: currentConfig.host || (currentConfig.connectionString ? 'URI' : 'Localhost / Archivo'),
    database: currentConfig.database || (currentConfig.type === 'sqlite' ? 'bimun_database.sqlite' : ''),
    error: lastErrorMessage,
    sqliteFallback: currentConfig.type !== 'sqlite' && activeDatabaseType === 'sqlite',
  };
}

export function getCurrentConfigSafe(): DatabaseConnectionConfig {
  return {
    ...currentConfig,
    password: currentConfig.password ? '••••••••' : '',
  };
}

// -------------------------------------------------------------
// Unified SQL Execution Layer (Universal Driver)
// -------------------------------------------------------------

function convertSqlForMySql(sql: string, params: any[]): { sql: string, params: any[] } {
  let outSql = sql;
  let outParams = [...params];
  
  outSql = outSql.replace(/WHERE key =/g, 'WHERE `key` =');
  outSql = outSql.replace(/\(key, value, updated_at\)/g, '(`key`, value, updated_at)');
  outSql = outSql.replace(/ON CONFLICT\(key\)/g, 'ON CONFLICT(`key`)');
  
  if (outSql.includes('INSERT OR REPLACE INTO settings')) {
     outSql = outSql.replace(/INSERT OR REPLACE INTO settings \(`key`, value, updated_at\) VALUES \(\?, \?, \?\);?/g,
      'INSERT INTO settings (`key`, value, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?, updated_at = ?;');
     outParams = [...params, params[1], params[2]];
  }
  
  if (outSql.includes('ON CONFLICT(`key`) DO UPDATE')) {
     outSql = outSql.replace(/ON CONFLICT\(`key`\) DO UPDATE SET value = excluded\.value, updated_at = excluded\.updated_at;?/g, 
     'ON DUPLICATE KEY UPDATE value = ?, updated_at = ?;');
     outParams = [...params, params[1], params[2]];
  }
  return { sql: outSql, params: outParams };
}

function convertSqlForPgAdvanced(sql: string, params: any[]): { sql: string, params: any[] } {
  let outSql = sql;
  if (outSql.includes('INSERT OR REPLACE INTO settings')) {
     outSql = outSql.replace(/INSERT OR REPLACE INTO settings \(key, value, updated_at\) VALUES \(\?, \?, \?\);?/g,
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;');
  }
  // Remove SQLite's excluded. (lowercase) with EXCLUDED.
  outSql = outSql.replace(/excluded\.value/g, 'EXCLUDED.value').replace(/excluded\.updated_at/g, 'EXCLUDED.updated_at');
  
  let paramIndex = 1;
  outSql = outSql.replace(/\?/g, () => `$${paramIndex++}`);
  return { sql: outSql, params };
}

function convertPlaceholdersForPg(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export async function executeQueryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  if (!isInitialized) {
    await initializeDatabaseManager();
  }
  if (activeDatabaseType === 'postgres' && pgPool) {
    try {
      const { sql: pgSql, params: pgParams } = convertSqlForPgAdvanced(sql, params);
      const res = await pgPool.query(pgSql, pgParams);
      return res.rows as T[];
    } catch (err: any) {
      console.error('[PostgreSQL Query Error, falling back to SQLite]', err.message);
      lastErrorMessage = `PostgreSQL: ${err.message}`;
      activeDatabaseType = 'sqlite';
    }
  }
  if (activeDatabaseType === 'mysql' && mysqlPool) {
    try {
      const { sql: mysqlSql, params: mysqlParams } = convertSqlForMySql(sql, params);
      const [rows] = await mysqlPool.query(mysqlSql, mysqlParams);
      return rows as T[];
    } catch (err: any) {
      console.error('[MySQL Query Error, falling back to SQLite]', err.message);
      lastErrorMessage = `MySQL: ${err.message}`;
      activeDatabaseType = 'sqlite';
    }
  }
  const db = await getSqliteDb();
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows as T[];
}

export async function executeQueryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await executeQueryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function executeRunSql(sql: string, params: any[] = []): Promise<void> {
  if (!isInitialized) {
    await initializeDatabaseManager();
  }
  if (activeDatabaseType === 'postgres' && pgPool) {
    try {
      const { sql: pgSql, params: pgParams } = convertSqlForPgAdvanced(sql, params);
      await pgPool.query(pgSql, pgParams);
      return;
    } catch (err: any) {
      console.error('[PostgreSQL Write Error, falling back to SQLite]', err.message);
      lastErrorMessage = `PostgreSQL: ${err.message}`;
      activeDatabaseType = 'sqlite';
    }
  }
  if (activeDatabaseType === 'mysql' && mysqlPool) {
    try {
      const { sql: mysqlSql, params: mysqlParams } = convertSqlForMySql(sql, params);
      await mysqlPool.query(mysqlSql, mysqlParams);
      return;
    } catch (err: any) {
      console.error('[MySQL Write Error, falling back to SQLite]', err.message);
      lastErrorMessage = `MySQL: ${err.message}`;
      activeDatabaseType = 'sqlite';
    }
  }
  const db = await getSqliteDb();
  db.run(sql, params);
  saveSqliteDisk();
}

// -------------------------------------------------------------
// Data Migration Tool (SQLite -> Target DB)
// -------------------------------------------------------------
export async function migrateCurrentDataToTarget(targetConfig: DatabaseConnectionConfig): Promise<{ success: boolean; message: string; rowsMigrated: number }> {
  // Ensure SQLite source data is ready
  const db = await getSqliteDb();

  let rowsMigrated = 0;

  // Extract from SQLite
  const tables = [
    'settings',
    'about_sections',
    'committees',
    'countries',
    'delegations',
    'schedule',
    'documents',
    'gallery',
    'organizing_team',
    'news',
    'registrations',
    'users',
  ];

  if (targetConfig.type === 'postgres') {
    const poolConfig: PoolConfig = targetConfig.connectionString
      ? { connectionString: targetConfig.connectionString }
      : {
          host: targetConfig.host,
          port: Number(targetConfig.port) || 5432,
          database: targetConfig.database,
          user: targetConfig.user,
          password: targetConfig.password,
          ssl: targetConfig.ssl ? { rejectUnauthorized: false } : undefined,
        };

    const targetPool = new Pool(poolConfig);
    try {
      await initPgSchema(targetPool);

      for (const table of tables) {
        const stmt = db.prepare(`SELECT * FROM ${table};`);
        const rows: any[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();

        for (const row of rows) {
          const keys = Object.keys(row);
          if (keys.length === 0) continue;
          const values = Object.values(row);
          const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
          const quotedKeys = keys.map((k) => `"${k}"`).join(', ');

          // UPSERT pattern for Postgres
          const primaryKey = keys.includes('key') ? 'key' : 'id';
          const updateSets = keys
            .filter((k) => k !== primaryKey)
            .map((k) => `"${k}" = EXCLUDED."${k}"`)
            .join(', ');
          const upsertSql = updateSets
            ? `INSERT INTO ${table} (${quotedKeys}) VALUES (${placeholders}) ON CONFLICT ("${primaryKey}") DO UPDATE SET ${updateSets};`
            : `INSERT INTO ${table} (${quotedKeys}) VALUES (${placeholders}) ON CONFLICT ("${primaryKey}") DO NOTHING;`;
          await targetPool.query(upsertSql, values);
          rowsMigrated++;
        }
      }

      await targetPool.end();
      return {
        success: true,
        message: `¡Migración completada con éxito! Se sincronizaron ${rowsMigrated} registros hacia PostgreSQL.`,
        rowsMigrated,
      };
    } catch (err: any) {
      await targetPool.end();
      return {
        success: false,
        message: `Error durante la migración a PostgreSQL: ${err.message}`,
        rowsMigrated,
      };
    }
  }

  if (targetConfig.type === 'mysql') {
    const poolOptions: PoolOptions = targetConfig.connectionString
      ? { uri: targetConfig.connectionString, ssl: { rejectUnauthorized: false } }
      : {
          host: targetConfig.host,
          port: Number(targetConfig.port) || 3306,
          database: targetConfig.database,
          user: targetConfig.user,
          password: targetConfig.password,
          ssl: targetConfig.ssl ? { rejectUnauthorized: false } : undefined,
        };

    const targetPool = mysql.createPool(poolOptions);
    try {
      await initMySqlSchema(targetPool);

      for (const table of tables) {
        const stmt = db.prepare(`SELECT * FROM ${table};`);
        const rows: any[] = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();

        for (const row of rows) {
          const keys = Object.keys(row);
          if (keys.length === 0) continue;
          const values = Object.values(row);
          const placeholders = keys.map(() => '?').join(', ');
          const quotedKeys = keys.map((k) => `\`${k}\``).join(', ');

                    const updateKeys = keys.filter((k) => k !== 'id' && k !== 'key');
          const updateSets = updateKeys.map((k) => `\`${k}\` = ?`).join(', ');
          const updateValues = updateKeys.map((k) => row[k]);
          
          const upsertSql = updateSets
            ? `INSERT INTO \`${table}\` (${quotedKeys}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateSets};`
            : `INSERT INTO \`${table}\` (${quotedKeys}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE \`${keys[0]}\` = \`${keys[0]}\`;`;

          await targetPool.query(upsertSql, [...values, ...updateValues]);
          rowsMigrated++;
        }
      }

      await targetPool.end();
      return {
        success: true,
        message: `¡Migración completada con éxito! Se sincronizaron ${rowsMigrated} registros hacia MySQL.`,
        rowsMigrated,
      };
    } catch (err: any) {
      await targetPool.end();
      return {
        success: false,
        message: `Error durante la migración a MySQL: ${err.message}`,
        rowsMigrated,
      };
    }
  }

  return {
    success: false,
    message: 'El destino de migración debe ser PostgreSQL o MySQL.',
    rowsMigrated: 0,
  };
}
