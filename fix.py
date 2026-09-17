import re

with open('server/dbManager.ts', 'r') as f:
    code = f.read()

code = code.replace(
  "const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString, connectTimeout: 5000 }\n        : {",
  "const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString, connectTimeout: 5000, ssl: { rejectUnauthorized: false } }\n        : {"
)
code = code.replace(
  "const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString }\n        : {",
  "const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString, ssl: { rejectUnauthorized: false } }\n        : {"
)
code = code.replace(
  "const poolOptions: PoolOptions = targetConfig.connectionString\n      ? { uri: targetConfig.connectionString }\n      : {",
  "const poolOptions: PoolOptions = targetConfig.connectionString\n      ? { uri: targetConfig.connectionString, ssl: { rejectUnauthorized: false } }\n      : {"
)

parts = code.split("const updateSets = keys")
if len(parts) > 1:
    p1 = parts[0]
    p2_parts = parts[1].split("await targetPool.query(upsertSql, values);")
    if len(p2_parts) > 1:
        new_migration = """          const updateKeys = keys.filter((k) => k !== 'id' && k !== 'key');
          const updateSets = updateKeys.map((k) => `\\`${k}\\` = ?`).join(', ');
          const updateValues = updateKeys.map((k) => row[k]);
          
          const upsertSql = updateSets
            ? `INSERT INTO \\`${table}\\` (${quotedKeys}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateSets};`
            : `INSERT INTO \\`${table}\\` (${quotedKeys}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE \\`${keys[0]}\\` = \\`${keys[0]}\\`;`;

          await targetPool.query(upsertSql, [...values, ...updateValues]);"""
        code = p1 + new_migration + p2_parts[1]

with open('server/dbManager.ts', 'w') as f:
    f.write(code)
print("Fixed dbManager")
