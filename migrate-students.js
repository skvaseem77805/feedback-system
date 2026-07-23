const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Load environment variables specifically for Railway production if present
function loadEnv() {
  const envPaths = ['.env.production', '.env.railway', '.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.join(__dirname, envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        if (!line || line.trim().startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          // Do not overwrite existing process.env variables passed explicitly
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log(`Loaded environment variables from ${envPath}`);
      break;
    }
  }
}

loadEnv();

function cleanValue(val) {
  if (!val) return '';
  return val.trim().replace(/^<|>$/g, '');
}

function getConfig() {
  let rawUrl = (
    process.env.RAILWAY_DATABASE_URL ||
    process.env.PRODUCTION_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL
  )?.trim();

  if (rawUrl) {
    rawUrl = cleanValue(rawUrl);
    if (rawUrl.startsWith('mysql://')) {
      try {
        const u = new URL(rawUrl);
        let host = decodeURIComponent(u.hostname);
        if (host === 'mysql.railway.internal') {
          host = 'hayabusa.proxy.rlwy.net';
        }
        return {
          host,
          port: parseInt(u.port || '47765', 10),
          user: decodeURIComponent(u.username),
          password: decodeURIComponent(u.password),
          database: decodeURIComponent(u.pathname?.replace(/^\//, '') || 'feedback_system'),
        };
      } catch (err) {
        // fallback
      }
    }
  }

  let host = cleanValue(
    process.env.RAILWAY_HOST ||
    process.env.MYSQL_PRODUCTION_HOST ||
    process.env.MYSQLHOST ||
    process.env.MYSQL_HOST ||
    'hayabusa.proxy.rlwy.net'
  );
  if (host === 'mysql.railway.internal' || !host) {
    host = 'hayabusa.proxy.rlwy.net';
  }

  const portStr = cleanValue(
    process.env.RAILWAY_PORT ||
    process.env.MYSQLPORT ||
    process.env.MYSQL_PORT ||
    '47765'
  );
  const port = parseInt(portStr, 10);

  const user = cleanValue(
    process.env.RAILWAY_USER ||
    process.env.MYSQLUSER ||
    process.env.MYSQL_USER ||
    'root'
  );

  const password =
    process.env.RAILWAY_PASSWORD ||
    process.env.MYSQLPASSWORD ||
    process.env.MYSQL_PASSWORD ||
    '';

  const database =
    process.env.RAILWAY_DATABASE ||
    process.env.MYSQLDATABASE ||
    process.env.MYSQL_DATABASE ||
    'feedback_system';

  return {
    host,
    port: isNaN(port) ? 3306 : port,
    user,
    password,
    database,
  };
}

async function run() {
  const config = getConfig();

  console.log('--- Railway Target Connection Details ---');
  console.log(`Host: ${config.host || '(none)'}`);
  console.log(`Port: ${config.port}`);
  console.log(`User: ${config.user || '(none)'}`);
  console.log(`Database: ${config.database}`);
  console.log('-----------------------------------------');

  // Guard: If host is localhost or empty, stop immediately with an error
  if (!config.host || config.host.toLowerCase() === 'localhost' || config.host === '127.0.0.1') {
    console.error(`\n[ERROR] Target host resolved to '${config.host || 'empty'}'. Migration script is configured to ONLY connect to Railway production database.`);
    console.error('Please provide the Railway production database URL or host via environment variable, e.g.:');
    console.error('  RAILWAY_DATABASE_URL="mysql://user:pass@host:port/database" node migrate-students.js');
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('Successfully connected to Railway production database.');
  } catch (err) {
    console.error('Failed to connect to Railway production database:', err.message || err);
    process.exit(1);
  }

  try {
    // Read all students
    const [students] = await conn.query('SELECT id, registration_no, password_hash FROM students');
    
    let totalProcessed = students.length;
    let totalUpdated = 0;
    let totalSkipped = 0;

    console.log(`Starting migration for ${totalProcessed} students...`);

    for (const student of students) {
      const hash = student.password_hash;
      const regNo = student.registration_no;

      // Check if it's already a valid bcrypt hash
      const isValidBcrypt = typeof hash === 'string' && hash.startsWith('$2') && hash.length === 60;

      if (isValidBcrypt) {
        totalSkipped++;
        continue;
      }

      // Generate new bcrypt hash using registration_no as the plain text password
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(regNo, salt);

      // Update password_hash in the database
      await conn.query('UPDATE students SET password_hash = ? WHERE id = ?', [newHash, student.id]);
      totalUpdated++;
    }

    console.log('\nMigration completed successfully.');
    console.log(`Total students processed: ${totalProcessed}`);
    console.log(`Total hashes updated: ${totalUpdated}`);
    console.log(`Total skipped: ${totalSkipped}`);

    // Verification
    console.log('\nStarting verification...');
    const [records] = await conn.query('SELECT registration_no, LENGTH(password_hash) as len FROM students WHERE registration_no = ?', ['24B81A05U2']);
    if (records.length > 0) {
      console.log(`Verification result for 24B81A05U2: registration_no=${records[0].registration_no}, LENGTH(password_hash)=${records[0].len}`);
    } else {
      console.log('Student 24B81A05U2 not found in Railway database.');
    }

  } catch (err) {
    console.error('Migration execution error:', err.message || err);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

run();
