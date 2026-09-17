const fs = require('fs');
let code = fs.readFileSync('server/dbManager.ts', 'utf8');

// Fix testConnection MySQL createPool
code = code.replace(
  `const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString, connectTimeout: 5000 }\n        : {`,
  `const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString, connectTimeout: 5000, ssl: { rejectUnauthorized: false } }\n        : {`
);

// Fix switchDatabaseEngine MySQL createPool
code = code.replace(
  `const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString }\n        : {`,
  `const poolOptions: PoolOptions = config.connectionString\n        ? { uri: config.connectionString, ssl: { rejectUnauthorized: false } }\n        : {`
);

// Fix migrateCurrentDataToTarget MySQL createPool
code = code.replace(
  `const poolOptions: PoolOptions = targetConfig.connectionString\n      ? { uri: targetConfig.connectionString }\n      : {`,
  `const poolOptions: PoolOptions = targetConfig.connectionString\n      ? { uri: targetConfig.connectionString, ssl: { rejectUnauthorized: false } }\n      : {`
);

// Fix migrateCurrentDataToTarget MySQL ON DUPLICATE KEY UPDATE syntax
// Original:
//           const updateSets = keys
//             .filter((k) => k !== 'id' && k !== 'key')
//             .map((k) => `\`${k}\` = VALUES(\`${k}\`)`)
//             .join(', ');
// 
//           const upsertSql = updateSets
//             ? `INSERT INTO \`${table}\` (${quotedKeys}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateSets};`
//             : `INSERT INTO \`${table}\` (${quotedKeys}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE \`${keys[0]}\` = \`${keys[0]}\`;`;
// 
//           await targetPool.query(upsertSql, values);
const originalMigrate = `          const updateSets = keys
            .filter((k) => k !== 'id' && k !== 'key')
            .map((k) => \\\`\\\\\\\`\\$\\{k\\}\\\\\\\` = VALUES(\\\\\\\`\\$\\{k\\}\\\\\\\`)\\\`)
            .join(', ');

          const upsertSql = updateSets
            ? \\\`INSERT INTO \\\\\\\`\\$\\{table\\}\\\\\\\` (\\$\\{quotedKeys\\}) VALUES (\\$\\{placeholders\\}) ON DUPLICATE KEY UPDATE \\$\\{updateSets\\};\\\`
            : \\\`INSERT INTO \\\\\\\`\\$\\{table\\}\\\\\\\` (\\$\\{quotedKeys\\}) VALUES (\\$\\{placeholders\\}) ON DUPLICATE KEY UPDATE \\\\\\\`\\$\\{keys[0]\\}\\\\\\\` = \\\\\\\`\\$\\{keys[0]\\}\\\\\\\`;\\\`;

          await targetPool.query(upsertSql, values);`;

const newMigrate = `          const updateKeys = keys.filter((k) => k !== 'id' && k !== 'key');
          const updateSets = updateKeys.map((k) => \\\`\\\\\\\`\\$\\{k\\}\\\\\\\` = ?\\\`).join(', ');
          const updateValues = updateKeys.map((k) => row[k]);
          
          const upsertSql = updateSets
            ? \\\`INSERT INTO \\\\\\\`\\$\\{table\\}\\\\\\\` (\\$\\{quotedKeys\\}) VALUES (\\$\\{placeholders\\}) ON DUPLICATE KEY UPDATE \\$\\{updateSets\\};\\\`
            : \\\`INSERT INTO \\\\\\\`\\$\\{table\\}\\\\\\\` (\\$\\{quotedKeys\\}) VALUES (\\$\\{placeholders\\}) ON DUPLICATE KEY UPDATE \\\\\\\`\\$\\{keys[0]\\}\\\\\\\` = \\\\\\\`\\$\\{keys[0]\\}\\\\\\\`;\\\`;

          await targetPool.query(upsertSql, [...values, ...updateValues]);`;

let newCode = code.replace(
          /const updateSets = keys\s*\.filter\(\(k\) => k !== 'id' && k !== 'key'\)\s*\.map\(\(k\) => `\\`\$\{k\}\\` = VALUES\(\\`\$\{k\}\\`\)`\)\s*\.join\(', '\);\s*const upsertSql = updateSets\s*\? `INSERT INTO \\`\$\{table\}\\` \(\$\{quotedKeys\}\) VALUES \(\$\{placeholders\}\) ON DUPLICATE KEY UPDATE \$\{updateSets\};`\s*: `INSERT INTO \\`\$\{table\}\\` \(\$\{quotedKeys\}\) VALUES \(\$\{placeholders\}\) ON DUPLICATE KEY UPDATE \\`\$\{keys\[0\]\}\\` = \\`\$\{keys\[0\]\}\\`;`;\s*await targetPool\.query\(upsertSql, values\);/m,
          newMigrate.replace(/\\`/g, '`').replace(/\\\$/g, '$').replace(/\\\\`/g, '\\`')
);

if (code === newCode) {
  console.log("Regex replacement failed, using simple string split");
  const parts = code.split('const updateSets = keys');
  if (parts.length > 1) {
    const p1 = parts[0];
    const p2 = parts[1].split('await targetPool.query(upsertSql, values);');
    if (p2.length > 1) {
       newCode = p1 + `          const updateKeys = keys.filter((k) => k !== 'id' && k !== 'key');
          const updateSets = updateKeys.map((k) => \\\`\\\\\\\`\${k}\\\\\\\` = ?\\\`).join(', ');
          const updateValues = updateKeys.map((k) => row[k]);
          
          const upsertSql = updateSets
            ? \\\`INSERT INTO \\\\\\\`\${table}\\\\\\\` (\${quotedKeys}) VALUES (\${placeholders}) ON DUPLICATE KEY UPDATE \${updateSets};\\\`
            : \\\`INSERT INTO \\\\\\\`\${table}\\\\\\\` (\${quotedKeys}) VALUES (\${placeholders}) ON DUPLICATE KEY UPDATE \\\\\\\`\${keys[0]}\\\\\\\` = \\\\\\\`\${keys[0]}\\\\\\\`;\\\`;

          await targetPool.query(upsertSql, [...values, ...updateValues]);`.replace(/\\\\`/g, "\\`").replace(/\\\`/g, "`") + p2[1];
    }
  }
}

fs.writeFileSync('server/dbManager.ts', newCode);
console.log('dbManager.ts fixed');
