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
        const value = line.slice(idx + 1).trim();
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
    const conn = await mysql.createConnection(config);
    
    console.log('--- SHOW TABLES ---');
    const [tables] = await conn.query('SHOW TABLES');
    console.log(tables);

    await conn.end();
  } catch (err) {
    console.error('DB check failed:', err.message || err);
    process.exit(1);
  }
})();
