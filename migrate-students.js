const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Load environment variables from .env or .env.local if present
function loadEnv() {
  const envPaths = ['.env.local', '.env'];
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
          process.env[key] = value;
        }
      });
      console.log(`Loaded environment variables from ${envPath}`);
      break;
    }
  }
}

loadEnv();

function getConfig() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (rawUrl && rawUrl.startsWith('mysql://')) {
    try {
      const u = new URL(rawUrl);
      return {
        host: decodeURIComponent(u.hostname),
        port: parseInt(u.port || '3306', 10),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: decodeURIComponent(u.pathname?.replace(/^\//, '') || 'feedback_system'),
      };
    } catch (err) {
      // fallback
    }
  }

  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: isNaN(port) ? 3306 : port,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'feedback_system',
  };
}

async function run() {
  const config = getConfig();
  console.log('Connecting to database with user:', config.user, 'host:', config.host, 'database:', config.database);
  
  let conn;
  try {
    conn = await mysql.createConnection(config);
  } catch (err) {
    console.error('Failed to connect to the database:', err.message || err);
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

    console.log('Migration completed successfully.');
    console.log(`Total students processed: ${totalProcessed}`);
    console.log(`Total hashes updated: ${totalUpdated}`);
    console.log(`Total skipped: ${totalSkipped}`);

    // Verification
    console.log('Starting verification...');
    const [records] = await conn.query('SELECT id, registration_no, password_hash FROM students');
    let verifiedCount = 0;
    let failedCount = 0;
    for (const record of records) {
      const hash = record.password_hash;
      if (typeof hash === 'string' && hash.startsWith('$2') && hash.length === 60) {
        verifiedCount++;
      } else {
        failedCount++;
        console.error(`Verification FAILED for student ${record.registration_no}: password_hash is ${hash}`);
      }
    }
    console.log(`Verification completed: ${verifiedCount} records verified successfully, ${failedCount} failed.`);

  } catch (err) {
    console.error('Migration failed:', err.message || err);
  } finally {
    if (conn) {
      await conn.end();
    }
  }
}

run();
