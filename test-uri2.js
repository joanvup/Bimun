import mysql from 'mysql2/promise';

async function run() {
  try {
    const pool = mysql.createPool({ uri: 'mysql://fakeuser:fakepass@127.0.0.1:9999/db' });
    await pool.query('SELECT 1');
  } catch (e) {
    console.log('Error 1:', e.message);
  }
}
run();
