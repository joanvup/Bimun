import { readFileSync } from 'fs';
const code = readFileSync('server/dbManager.ts', 'utf8');
const lines = code.split('\n');
const pgFn = lines.slice(lines.findIndex(l => l.includes('function convertSqlForPgAdvanced')), lines.findIndex(l => l.includes('export async function executeRunSql'))).join('\n');
console.log(pgFn);
