import { pool } from './src/config/db.js';

async function migrate() {
  try {
    await pool.query("ALTER TABLE repositories ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';");
    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

migrate();
