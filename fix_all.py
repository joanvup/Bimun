import re

with open('server/dbManager.ts', 'r') as f:
    code = f.read()

# 1. Fix Postgres migration
pg_migration_start = code.find("          // UPSERT pattern for Postgres")
pg_migration_end = code.find("          await targetPool.query(upsertSql", pg_migration_start)

if pg_migration_start != -1 and pg_migration_end != -1:
    correct_pg = """          // UPSERT pattern for Postgres
          const primaryKey = keys.includes('key') ? 'key' : 'id';
          const updateSets = keys
            .filter((k) => k !== primaryKey)
            .map((k) => `"${k}" = EXCLUDED."${k}"`)
            .join(', ');
          const upsertSql = updateSets
            ? `INSERT INTO ${table} (${quotedKeys}) VALUES (${placeholders}) ON CONFLICT ("${primaryKey}") DO UPDATE SET ${updateSets};`
            : `INSERT INTO ${table} (${quotedKeys}) VALUES (${placeholders}) ON CONFLICT ("${primaryKey}") DO NOTHING;`;
"""
    code = code[:pg_migration_start] + correct_pg + code[pg_migration_end:]

# 2. Fix mangled executeQueryAll / executeQueryOne
code = re.sub(
    r'stmt\.free\(\);\s*return rows as T\[\];\s*\}\s*catch \(err: any\) \{[\s\S]*?stmt\.free\(\);\s*return results;\s*\}\s*export async function executeQueryOne',
    r"""stmt.free();
  return rows as T[];
}

export async function executeQueryOne""",
    code
)

with open('server/dbManager.ts', 'w') as f:
    f.write(code)

print("Fixed dbManager syntax and Postgres migration.")
