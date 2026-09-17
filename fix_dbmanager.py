import re

with open('server/dbManager.ts', 'r') as f:
    code = f.read()

# Add translation functions
translations = """
function convertSqlForMySql(sql: string, params: any[]): { sql: string, params: any[] } {
  let outSql = sql;
  let outParams = [...params];
  
  outSql = outSql.replace(/WHERE key =/g, 'WHERE `key` =');
  outSql = outSql.replace(/\\(key, value, updated_at\\)/g, '(`key`, value, updated_at)');
  outSql = outSql.replace(/ON CONFLICT\\(key\\)/g, 'ON CONFLICT(`key`)');
  
  if (outSql.includes('INSERT OR REPLACE INTO settings')) {
     outSql = outSql.replace(/INSERT OR REPLACE INTO settings \\(`key`, value, updated_at\\) VALUES \\(\\?, \\?, \\?\\);?/g,
      'INSERT INTO settings (`key`, value, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?, updated_at = ?;');
     outParams = [...params, params[1], params[2]];
  }
  
  if (outSql.includes('ON CONFLICT(`key`) DO UPDATE')) {
     outSql = outSql.replace(/ON CONFLICT\\(`key`\\) DO UPDATE SET value = excluded\\.value, updated_at = excluded\\.updated_at;?/g, 
     'ON DUPLICATE KEY UPDATE value = ?, updated_at = ?;');
     outParams = [...params, params[1], params[2]];
  }
  return { sql: outSql, params: outParams };
}

function convertSqlForPgAdvanced(sql: string, params: any[]): { sql: string, params: any[] } {
  let outSql = sql;
  if (outSql.includes('INSERT OR REPLACE INTO settings')) {
     outSql = outSql.replace(/INSERT OR REPLACE INTO settings \\(key, value, updated_at\\) VALUES \\(\\?, \\?, \\?\\);?/g,
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;');
  }
  // Remove SQLite's excluded. (lowercase) with EXCLUDED.
  outSql = outSql.replace(/excluded\\.value/g, 'EXCLUDED.value').replace(/excluded\\.updated_at/g, 'EXCLUDED.updated_at');
  
  let paramIndex = 1;
  outSql = outSql.replace(/\\?/g, () => `$${paramIndex++}`);
  return { sql: outSql, params };
}
"""

if "convertSqlForMySql" not in code:
    code = code.replace("function convertPlaceholdersForPg", translations + "\nfunction convertPlaceholdersForPg")

# Update executeRunSql
execute_run_sql = """export async function executeRunSql(sql: string, params: any[] = []): Promise<void> {
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
}"""

code = re.sub(r'export async function executeRunSql[\s\S]*?saveSqliteDisk\(\);\s*\}', execute_run_sql, code)

# Update executeQueryAll
execute_query_all = """export async function executeQueryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
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
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows as T[];
}"""

code = re.sub(r'export async function executeQueryAll[\s\S]*?return rows as T\[\];\s*\}', execute_query_all, code)

# Update executeQueryOne
execute_query_one = """export async function executeQueryOne<T>(sql: string, params: any[] = []): Promise<T | null> {
  if (!isInitialized) {
    await initializeDatabaseManager();
  }
  if (activeDatabaseType === 'postgres' && pgPool) {
    try {
      const { sql: pgSql, params: pgParams } = convertSqlForPgAdvanced(sql, params);
      const res = await pgPool.query(pgSql, pgParams);
      return res.rows.length > 0 ? (res.rows[0] as T) : null;
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
      const arr = rows as T[];
      return arr.length > 0 ? arr[0] : null;
    } catch (err: any) {
      console.error('[MySQL Query Error, falling back to SQLite]', err.message);
      lastErrorMessage = `MySQL: ${err.message}`;
      activeDatabaseType = 'sqlite';
    }
  }
  const db = await getSqliteDb();
  const stmt = db.prepare(sql);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row as T | null;
}"""

code = re.sub(r'export async function executeQueryOne[\s\S]*?return row as T \| null;\s*\}', execute_query_one, code)


with open('server/dbManager.ts', 'w') as f:
    f.write(code)

print("Updated dbManager.ts with dialect translations")
