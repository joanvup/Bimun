import mysql from 'mysql2/promise';

try {
  const pool = mysql.createPool({ uri: 'mysql://user:pass@localhost:3306/db' });
  console.log('Success');
} catch (e) {
  console.error('Error:', e.message);
}
