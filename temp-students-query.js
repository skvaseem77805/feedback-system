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
      password: process.env.MYSQL_PASSWORD?.trim(),
      database: process.env.MYSQL_DATABASE,
    };
    console.log('Using config', config);
    const conn = await mysql.createConnection(config);
    const sql = `
      SELECT
        s.*,
        ss.projects_uploaded,
        ss.connections,
        ss.collaborations
      FROM students s
      LEFT JOIN student_stats ss
      ON s.id = ss.student_id
      WHERE 1=1
      ORDER BY s.name LIMIT ?`;
    const params = [5];
    console.log('SQL:', sql);
    console.log('params:', params);
    const [rows] = await conn.execute(sql, params);
    console.log('rows length:', rows.length);
    console.log('first row:', rows[0]);
    await conn.end();
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
})();
