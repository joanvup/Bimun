import { readFileSync } from 'fs';
const code = readFileSync('server/dbManager.ts', 'utf8');
const lines = code.split('\n');
const mysqlFn = lines.slice(lines.findIndex(l => l.includes('function convertSqlForMySql')), lines.findIndex(l => l.includes('function convertSqlForPgAdvanced'))).join('\n');
console.log(mysqlFn);
