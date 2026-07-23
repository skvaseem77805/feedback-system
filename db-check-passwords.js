const { getPool } = require('./lib/db');

(async () => {
  try {
    const p = getPool();
    const [rows] = await p.query('SELECT registration_no, password_hash FROM students LIMIT 10');
    console.log('Students in database:');
    console.log(rows);
    await p.end();
  } catch (err) {
    console.error('Error:', err);
  }
})();
