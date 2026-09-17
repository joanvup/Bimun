import mysql from 'mysql2/promise';

try {
  const p = mysql.createPool('mysql://user:pass@127.0.0.1:3306/db');
  console.log("String works");
} catch(e) { console.error(e) }

try {
  const p2 = mysql.createPool({ uri: 'mysql://user:pass@127.0.0.1:3306/db' });
  console.log("Object with uri works");
} catch(e) { console.error(e) }
