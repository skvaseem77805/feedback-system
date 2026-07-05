const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    envFile.split(/\r?\n/).forEach(line => {
      if (!line || line.trim().startsWith('#')) return;
      const idx = line.indexOf('=');
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1);
        process.env[key] = value;
      }
    });
    const config = {
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT, 10),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    };
    console.log('Using config', config);
    const conn = await mysql.createConnection(config);
    const [tbls] = await conn.query('SHOW TABLES');
    console.log('Tables count', tbls.length);
    const [students] = await conn.query('DESCRIBE students');
    console.log('Students fields', students.map(r => r.Field));
    const [stats] = await conn.query('DESCRIBE student_stats');
    console.log('Student_stats fields', stats.map(r => r.Field));
    const [rows] = await conn.query('SELECT s.id, ss.projects_uploaded FROM students s LEFT JOIN student_stats ss ON s.id = ss.student_id LIMIT 1');
    console.log('Sample row', rows[0]);
    await conn.end();
  } catch (err) {
    console.error('DB check failed:', err.message || err);
    process.exit(1);
  }
})();
