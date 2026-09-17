import mysql from 'mysql2/promise';

try {
  const p = mysql.createPool({ uri: 'mysql://invalid:invalid@invalid:9999/db' });
  console.log(p.pool.config.connectionConfig.host);
} catch(e) { console.error(e) }
