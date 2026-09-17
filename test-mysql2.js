import mysql from 'mysql2/promise';

async function run() {
  try {
    const pool = mysql.createPool({ uri: 'mysql://fakeuser:fakepass@127.0.0.1:3306/db' });
    // If it ignores uri, it will try root@localhost
    await pool.query('SELECT 1');
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
