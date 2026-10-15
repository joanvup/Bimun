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
  // 1. First Priority: Environment Variables (Twelve-Factor App Pattern for Cloud Run / Production)
  if (process.env.DATABASE_TYPE) {
    const envType = process.env.DATABASE_TYPE.trim().toLowerCase();
    if (envType === 'sqlite' || envType === 'postgres' || envType === 'mysql') {
      const config: DatabaseConnectionConfig = {
        type: envType as DatabaseType,
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : undefined,
        database: process.env.DATABASE_NAME || process.env.DATABASE_DATABASE,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        ssl: process.env.DATABASE_SSL === 'true',
        connectionString: process.env.DATABASE_URL,
      };
      currentConfig = config;
      console.log(`[DB-Manager] Configuración de base de datos cargada desde variables de entorno. Tipo activo: ${envType}`);
      return currentConfig;
    }
  }

  // 2. Second Priority: database-config.json file
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
export async function getSqliteDb(): Promise<SqlJsDatabase> {
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

export function getSqliteDbSync(): SqlJsDatabase | null {
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
      copresident_name TEXT,
      copresident_photo TEXT,
      vicepresident_name TEXT,
      vicepresident_photo TEXT,
      president_welcome TEXT,
      copresident_welcome TEXT,
      study_guide_url TEXT,
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
// Canonical Schema & Universal Column Auto-Migration
// -------------------------------------------------------------
export interface ColumnDef {
  name: string;
  mysqlType: string;
  postgresType: string;
  sqliteType: string;
}

export interface TableDef {
  tableName: string;
  columns: ColumnDef[];
}

export interface SchemaRepairResult {
  success: boolean;
  databaseType: 'sqlite' | 'postgres' | 'mysql';
  checkedTables: number;
  addedColumns: Array<{ table: string; column: string; type: string }>;
  verifiedColumns: number;
  message: string;
}

export const CANONICAL_TABLE_SCHEMAS: TableDef[] = [
  {
    tableName: 'settings',
    columns: [
      { name: 'key', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'value', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'updated_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
  {
    tableName: 'about_sections',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'section_key', mysqlType: 'VARCHAR(191)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'title', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'subtitle', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'content', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'icon', mysqlType: 'VARCHAR(191)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'sort_order', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'is_active', mysqlType: 'INT DEFAULT 1', postgresType: 'INTEGER DEFAULT 1', sqliteType: 'INTEGER DEFAULT 1' },
    ],
  },
  {
    tableName: 'committees',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'code', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'name', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'abbreviation', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'description', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'image_url', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'language', mysqlType: "VARCHAR(100) DEFAULT 'Español'", postgresType: "VARCHAR(100) DEFAULT 'Español'", sqliteType: "TEXT DEFAULT 'Español'" },
      { name: 'topic_a', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'topic_b', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'topic_c', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'president_name', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'president_photo', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'copresident_name', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'copresident_photo', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'vicepresident_name', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'vicepresident_photo', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'president_welcome', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'copresident_welcome', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'study_guide_url', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'status', mysqlType: "VARCHAR(50) DEFAULT 'active'", postgresType: "VARCHAR(50) DEFAULT 'active'", sqliteType: "TEXT DEFAULT 'active'" },
      { name: 'sort_order', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'created_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
  {
    tableName: 'countries',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'name', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'official_name', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'code', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'flag_emoji', mysqlType: 'VARCHAR(50)', postgresType: 'VARCHAR(50)', sqliteType: 'TEXT' },
      { name: 'flag_url', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'additional_info', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'status', mysqlType: "VARCHAR(50) DEFAULT 'active'", postgresType: "VARCHAR(50) DEFAULT 'active'", sqliteType: "TEXT DEFAULT 'active'" },
    ],
  },
  {
    tableName: 'delegations',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'committee_id', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'country_id', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'delegate_name', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'delegate_school', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'delegate_email', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'delegate_phone', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'status', mysqlType: "VARCHAR(50) DEFAULT 'available'", postgresType: "VARCHAR(50) DEFAULT 'available'", sqliteType: "TEXT DEFAULT 'available'" },
      { name: 'notes', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'created_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
  {
    tableName: 'schedule',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'day_label', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'date', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'time_start', mysqlType: 'VARCHAR(100) NOT NULL', postgresType: 'VARCHAR(100) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'time_end', mysqlType: 'VARCHAR(100) NOT NULL', postgresType: 'VARCHAR(100) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'activity', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'description', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'location', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'audience', mysqlType: "VARCHAR(255) DEFAULT 'Todos los participantes'", postgresType: "VARCHAR(255) DEFAULT 'Todos los participantes'", sqliteType: "TEXT DEFAULT 'Todos los participantes'" },
      { name: 'sort_order', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
    ],
  },
  {
    tableName: 'documents',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'title', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'category', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'file_url', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'description', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'file_size', mysqlType: 'VARCHAR(100)', postgresType: 'VARCHAR(100)', sqliteType: 'TEXT' },
      { name: 'is_featured', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'sort_order', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'created_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
  {
    tableName: 'gallery',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'title', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'caption', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'image_url', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'category', mysqlType: "VARCHAR(191) DEFAULT 'Debate'", postgresType: "VARCHAR(255) DEFAULT 'Debate'", sqliteType: "TEXT DEFAULT 'Debate'" },
      { name: 'edition', mysqlType: "VARCHAR(191) DEFAULT 'BIMUN XXVI'", postgresType: "VARCHAR(255) DEFAULT 'BIMUN XXVI'", sqliteType: "TEXT DEFAULT 'BIMUN XXVI'" },
      { name: 'sort_order', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'created_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
  {
    tableName: 'organizing_team',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'name', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'role', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'category', mysqlType: "VARCHAR(191) DEFAULT ''", postgresType: "VARCHAR(255) DEFAULT ''", sqliteType: "TEXT DEFAULT ''" },
      { name: 'photo_url', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'bio', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'email', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'sort_order', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
    ],
  },
  {
    tableName: 'news',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'title', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'slug', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'excerpt', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'content', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'image_url', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'category', mysqlType: "VARCHAR(191) DEFAULT 'General'", postgresType: "VARCHAR(255) DEFAULT 'General'", sqliteType: "TEXT DEFAULT 'General'" },
      { name: 'publish_date', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'is_published', mysqlType: 'INT DEFAULT 1', postgresType: 'INTEGER DEFAULT 1', sqliteType: 'INTEGER DEFAULT 1' },
    ],
  },
  {
    tableName: 'registrations',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'full_name', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'email', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'phone', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'school', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'delegation_type', mysqlType: 'VARCHAR(100) NOT NULL', postgresType: 'VARCHAR(100) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'grade', mysqlType: 'VARCHAR(100)', postgresType: 'VARCHAR(100)', sqliteType: 'TEXT' },
      { name: 'committee_preference_1', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'committee_preference_2', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'country_preference_1', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'country_preference_2', mysqlType: 'VARCHAR(255)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'experience', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'dietary_medical', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'emergency_contact', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'status', mysqlType: "VARCHAR(50) DEFAULT 'pending'", postgresType: "VARCHAR(50) DEFAULT 'pending'", sqliteType: "TEXT DEFAULT 'pending'" },
      { name: 'assigned_committee_id', mysqlType: 'VARCHAR(191)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'assigned_country_id', mysqlType: 'VARCHAR(191)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'notes', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'payment_receipt', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'created_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
  {
    tableName: 'users',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'username', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'password_hash', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'display_name', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'role', mysqlType: "VARCHAR(100) DEFAULT 'admin'", postgresType: "VARCHAR(100) DEFAULT 'admin'", sqliteType: "TEXT DEFAULT 'admin'" },
      { name: 'created_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
  {
    tableName: 'edition_archives',
    columns: [
      { name: 'id', mysqlType: 'VARCHAR(191) PRIMARY KEY', postgresType: 'VARCHAR(255) PRIMARY KEY', sqliteType: 'TEXT PRIMARY KEY' },
      { name: 'edition_name', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'edition_year', mysqlType: 'VARCHAR(50) NOT NULL', postgresType: 'VARCHAR(50) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'title', mysqlType: 'VARCHAR(255) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'description', mysqlType: 'LONGTEXT', postgresType: 'TEXT', sqliteType: 'TEXT' },
      { name: 'snapshot_json', mysqlType: 'LONGTEXT NOT NULL', postgresType: 'TEXT NOT NULL', sqliteType: 'TEXT NOT NULL' },
      { name: 'total_delegates', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'total_committees', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'total_photos', mysqlType: 'INT DEFAULT 0', postgresType: 'INTEGER DEFAULT 0', sqliteType: 'INTEGER DEFAULT 0' },
      { name: 'created_by', mysqlType: 'VARCHAR(191)', postgresType: 'VARCHAR(255)', sqliteType: 'TEXT' },
      { name: 'created_at', mysqlType: 'VARCHAR(191) NOT NULL', postgresType: 'VARCHAR(255) NOT NULL', sqliteType: 'TEXT NOT NULL' },
    ],
  },
];

export async function ensureAllTableColumns(
  customPool?: any,
  customType?: 'mysql' | 'postgres' | 'sqlite'
): Promise<SchemaRepairResult> {
  const targetType = customType || activeDatabaseType;
  const addedColumns: Array<{ table: string; column: string; type: string }> = [];
  let checkedTables = 0;
  let verifiedColumns = 0;

  try {
    if (targetType === 'mysql') {
      const pool: MySqlPool = customPool || mysqlPool;
      if (!pool) {
        return {
          success: false,
          databaseType: 'mysql',
          checkedTables: 0,
          addedColumns: [],
          verifiedColumns: 0,
          message: 'No hay conexión activa a MySQL para verificar columnas.',
        };
      }

      for (const tableDef of CANONICAL_TABLE_SCHEMAS) {
        checkedTables++;
        const tableName = tableDef.tableName;

        // Fetch existing columns in this table
        let existingCols = new Set<string>();
        try {
          const [rows]: any = await pool.query(`SHOW COLUMNS FROM \`${tableName}\`;`);
          if (Array.isArray(rows)) {
            for (const r of rows) {
              const fieldName = r.Field || r.COLUMN_NAME || '';
              if (fieldName) existingCols.add(fieldName.toLowerCase());
            }
          }
        } catch (tableErr: any) {
          console.warn(`[Schema Check] Tabla ${tableName} no existe en MySQL, continuando...`);
          continue;
        }

        for (const col of tableDef.columns) {
          verifiedColumns++;
          if (!existingCols.has(col.name.toLowerCase())) {
            const cleanType = col.mysqlType.replace(/PRIMARY\s+KEY/gi, '').replace(/UNIQUE/gi, '').trim();
            console.log(`[Schema Migration] Agregando columna faltante en MySQL: ${tableName}.${col.name} ${cleanType}`);
            try {
              await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${col.name}\` ${cleanType};`);
              addedColumns.push({ table: tableName, column: col.name, type: cleanType });
            } catch (alterErr: any) {
              if (!alterErr.message?.includes('Duplicate column') && !alterErr.message?.includes('already exists')) {
                console.warn(`[Schema Migration] Advertencia al añadir columna ${tableName}.${col.name}:`, alterErr.message);
              }
            }
          }
        }

        // Specific migrations for committees table: sync copresident and vicepresident
        if (tableName === 'committees') {
          try {
            await pool.query(`UPDATE committees SET copresident_name = vicepresident_name WHERE (copresident_name IS NULL OR copresident_name = '') AND vicepresident_name IS NOT NULL AND vicepresident_name != '';`);
            await pool.query(`UPDATE committees SET copresident_photo = vicepresident_photo WHERE (copresident_photo IS NULL OR copresident_photo = '') AND vicepresident_photo IS NOT NULL AND vicepresident_photo != '';`);
            await pool.query(`UPDATE committees SET vicepresident_name = copresident_name WHERE (vicepresident_name IS NULL OR vicepresident_name = '') AND copresident_name IS NOT NULL AND copresident_name != '';`);
            await pool.query(`UPDATE committees SET vicepresident_photo = copresident_photo WHERE (vicepresident_photo IS NULL OR copresident_photo = '') AND copresident_photo IS NOT NULL AND copresident_photo != '';`);
          } catch {}
        }
      }

      const summaryMsg = addedColumns.length > 0
        ? `Se agregaron exitosamente ${addedColumns.length} columna(s) faltante(s) en MySQL: ${addedColumns.map(c => `${c.table}.${c.column}`).join(', ')}.`
        : `Todas las tablas (${checkedTables}) y columnas (${verifiedColumns}) en MySQL están completamente sincronizadas y al día.`;

      console.log(`[DB-Manager] Verificación de esquema MySQL completada. ${summaryMsg}`);

      return {
        success: true,
        databaseType: 'mysql',
        checkedTables,
        addedColumns,
        verifiedColumns,
        message: summaryMsg,
      };
    }

    if (targetType === 'postgres') {
      const pool: Pool = customPool || pgPool;
      if (!pool) {
        return {
          success: false,
          databaseType: 'postgres',
          checkedTables: 0,
          addedColumns: [],
          verifiedColumns: 0,
          message: 'No hay conexión activa a PostgreSQL.',
        };
      }

      for (const tableDef of CANONICAL_TABLE_SCHEMAS) {
        checkedTables++;
        const tableName = tableDef.tableName;
        let existingCols = new Set<string>();

        try {
          const res = await pool.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1;`,
            [tableName]
          );
          for (const row of res.rows) {
            if (row.column_name) existingCols.add(String(row.column_name).toLowerCase());
          }
        } catch (tableErr: any) {
          continue;
        }

        for (const col of tableDef.columns) {
          verifiedColumns++;
          if (!existingCols.has(col.name.toLowerCase())) {
            const cleanType = col.postgresType.replace(/PRIMARY\s+KEY/gi, '').replace(/UNIQUE/gi, '').trim();
            console.log(`[Schema Migration] Agregando columna en PostgreSQL: ${tableName}.${col.name}`);
            try {
              await pool.query(`ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col.name}" ${cleanType};`);
              addedColumns.push({ table: tableName, column: col.name, type: cleanType });
            } catch (err: any) {
              console.warn(`[Schema Migration] PostgreSQL alter warning:`, err.message);
            }
          }
        }
      }

      const summaryMsg = addedColumns.length > 0
        ? `Se agregaron ${addedColumns.length} columna(s) en PostgreSQL: ${addedColumns.map(c => `${c.table}.${c.column}`).join(', ')}.`
        : `Esquema de PostgreSQL verificado y al día (${checkedTables} tablas).`;

      return {
        success: true,
        databaseType: 'postgres',
        checkedTables,
        addedColumns,
        verifiedColumns,
        message: summaryMsg,
      };
    }

    // SQLite
    const db = await getSqliteDb();
    for (const tableDef of CANONICAL_TABLE_SCHEMAS) {
      checkedTables++;
      const tableName = tableDef.tableName;
      let existingCols = new Set<string>();

      try {
        const res = db.exec(`PRAGMA table_info("${tableName}");`);
        if (res && res[0] && res[0].values) {
          for (const row of res[0].values) {
            existingCols.add(String(row[1]).toLowerCase());
          }
        }
      } catch (e) {
        continue;
      }

      for (const col of tableDef.columns) {
        verifiedColumns++;
        if (!existingCols.has(col.name.toLowerCase())) {
          const cleanType = col.sqliteType.replace(/PRIMARY\s+KEY/gi, '').replace(/UNIQUE/gi, '').trim();
          try {
            db.run(`ALTER TABLE "${tableName}" ADD COLUMN "${col.name}" ${cleanType};`);
            addedColumns.push({ table: tableName, column: col.name, type: cleanType });
          } catch (err: any) {}
        }
      }
    }
    saveSqliteDisk();

    const summaryMsg = addedColumns.length > 0
      ? `Se agregaron ${addedColumns.length} columna(s) en SQLite: ${addedColumns.map(c => `${c.table}.${c.column}`).join(', ')}.`
      : `Esquema SQLite verificado (${checkedTables} tablas).`;

    return {
      success: true,
      databaseType: 'sqlite',
      checkedTables,
      addedColumns,
      verifiedColumns,
      message: summaryMsg,
    };
  } catch (err: any) {
    console.error('[Schema Migration Error]', err);
    return {
      success: false,
      databaseType: targetType,
      checkedTables,
      addedColumns,
      verifiedColumns,
      message: `Error durante la verificación de esquema: ${err.message}`,
    };
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
      copresident_name VARCHAR(255),
      copresident_photo TEXT,
      vicepresident_name VARCHAR(255),
      vicepresident_photo TEXT,
      president_welcome TEXT,
      copresident_welcome TEXT,
      study_guide_url TEXT,
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
      category VARCHAR(255) DEFAULT '',
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
    CREATE TABLE IF NOT EXISTS edition_archives (
      id VARCHAR(255) PRIMARY KEY,
      edition_name VARCHAR(255) NOT NULL,
      edition_year VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      snapshot_json TEXT NOT NULL,
      total_delegates INTEGER DEFAULT 0,
      total_committees INTEGER DEFAULT 0,
      total_photos INTEGER DEFAULT 0,
      created_by VARCHAR(255),
      created_at VARCHAR(255) NOT NULL
    );
  `);
  await ensureAllTableColumns(pool, 'postgres');
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
      copresident_name VARCHAR(255),
      copresident_photo LONGTEXT,
      vicepresident_name VARCHAR(255),
      vicepresident_photo LONGTEXT,
      president_welcome LONGTEXT,
      copresident_welcome LONGTEXT,
      study_guide_url LONGTEXT,
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
      category VARCHAR(191) DEFAULT '',
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
    `CREATE TABLE IF NOT EXISTS edition_archives (
      id VARCHAR(191) PRIMARY KEY,
      edition_name VARCHAR(191) NOT NULL,
      edition_year VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description LONGTEXT,
      snapshot_json LONGTEXT NOT NULL,
      total_delegates INT DEFAULT 0,
      total_committees INT DEFAULT 0,
      total_photos INT DEFAULT 0,
      created_by VARCHAR(191),
      created_at VARCHAR(191) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  ];

  for (const sql of tables) {
    await pool.query(sql);
  }
  await ensureAllTableColumns(pool, 'mysql');
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
      await ensureDefaultAdmin();
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
      await ensureDefaultAdmin();
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
 * Guarantees that an initial superadmin exists ONLY if the users table is completely empty (clean database setup).
 * If users already exist (e.g. administrator created their own personal accounts and deleted 'admin'),
 * this function will respect their configuration and will NOT recreate 'admin'.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const userCheck = await executeQueryOne<any>('SELECT COUNT(*) as count FROM users;');
    const userCount = userCheck ? Number(userCheck.count ?? userCheck['COUNT(*)'] ?? 0) : 0;

    if (userCount === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('bimun2026', salt);
      const now = new Date().toISOString();

      await executeRunSql(
        'INSERT INTO users (id, username, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?);',
        ['usr_admin_1', 'admin', hash, 'Secretaría General BIMUN', 'superadmin', now]
      );
      console.log('✅ Base de datos inicializada: Se creó superadmin inicial (admin / bimun2026).');
    }
  } catch (err: any) {
    console.error('Error in ensureDefaultAdmin:', err.message);
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
  const outParams = [...params];
  
  // 1. Reserved keyword `key` escaping in MySQL (KEY is a reserved keyword in MySQL)
  outSql = outSql.replace(/\bWHERE\s+key\s*=/gi, 'WHERE `key` =');
  outSql = outSql.replace(/\bSELECT\s+key\s*,/gi, 'SELECT `key`,');
  outSql = outSql.replace(/([(\s,])key([)\s,])/gi, '$1`key`$2');
  
  // 2. Convert SQLite "INSERT OR REPLACE INTO settings" to standard MySQL ON DUPLICATE KEY UPDATE
  if (/INSERT\s+OR\s+REPLACE\s+INTO\s+settings/i.test(outSql)) {
    outSql = outSql.replace(/INSERT\s+OR\s+REPLACE\s+INTO\s+settings/gi, 'INSERT INTO settings');
    if (!/ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(outSql)) {
      outSql = outSql.replace(/;?\s*$/, ' ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = VALUES(`updated_at`);');
    }
    return { sql: outSql, params: outParams };
  }
  
  // 3. Convert PostgreSQL / SQLite "ON CONFLICT(...) DO UPDATE..." to MySQL "ON DUPLICATE KEY UPDATE"
  if (/ON\s+CONFLICT\s*\(?.*?\)?\s+DO\s+UPDATE/is.test(outSql)) {
    outSql = outSql.replace(
      /ON\s+CONFLICT\s*\(?.*?\)?\s+DO\s+UPDATE\s+SET\s+.*?(?:;|\s*$)/is,
      'ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = VALUES(`updated_at`);'
    );
    return { sql: outSql, params: outParams };
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
      console.error('[PostgreSQL Write Error]', err.message);
      const isMissingCol =
        String(err?.message || '').toLowerCase().includes('does not exist') ||
        String(err?.message || '').toLowerCase().includes('no existe la columna');

      if (isMissingCol) {
        console.warn('[PostgreSQL Auto-Repair] Columna ausente detectada en tiempo de ejecución. Reparando esquema...');
        try {
          await ensureAllTableColumns(pgPool, 'postgres');
          const { sql: retrySql, params: retryParams } = convertSqlForPgAdvanced(sql, params);
          await pgPool.query(retrySql, retryParams);
          console.log('[PostgreSQL Auto-Repair] Consulta reintentada y ejecutada exitosamente.');
          return;
        } catch (retryErr: any) {
          console.error('[PostgreSQL Auto-Repair] Fallo en reintento tras autoreparación:', retryErr.message);
        }
      }

      lastErrorMessage = `PostgreSQL: ${err.message}`;
      if (currentConfig.type === 'postgres') {
        throw new Error(`Error de persistencia en PostgreSQL: ${err.message}`);
      }
      activeDatabaseType = 'sqlite';
    }
  }
  if (activeDatabaseType === 'mysql' && mysqlPool) {
    try {
      const { sql: mysqlSql, params: mysqlParams } = convertSqlForMySql(sql, params);
      await mysqlPool.query(mysqlSql, mysqlParams);
      return;
    } catch (err: any) {
      console.error('[MySQL Write Error]', err.message);
      const isMissingCol =
        err?.code === 'ER_BAD_FIELD_ERROR' ||
        err?.errno === 1054 ||
        String(err?.message || '').toLowerCase().includes('unknown column');

      if (isMissingCol) {
        console.warn('[MySQL Auto-Repair] Columna ausente detectada en tiempo de ejecución. Reparando esquema...');
        try {
          await ensureAllTableColumns(mysqlPool, 'mysql');
          const { sql: retrySql, params: retryParams } = convertSqlForMySql(sql, params);
          await mysqlPool.query(retrySql, retryParams);
          console.log('[MySQL Auto-Repair] Consulta reintentada y ejecutada con éxito tras autoreparación.');
          return;
        } catch (retryErr: any) {
          console.error('[MySQL Auto-Repair] Fallo en reintento tras autoreparación:', retryErr.message);
        }
      }

      lastErrorMessage = `MySQL: ${err.message}`;
      if (currentConfig.type === 'mysql') {
        throw new Error(`Error de persistencia en MySQL: ${err.message}`);
      }
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
