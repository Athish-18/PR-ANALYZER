import { pool } from './src/config/db.js';

async function fixTimestamps() {
  try {
    await pool.query(`
      ALTER TABLE conversations 
      ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at AT TIME ZONE 'UTC'
    `);
    
    await pool.query(`
      ALTER TABLE messages 
      ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC'
    `);
    console.log('Timestamps altered to WITH TIME ZONE');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

fixTimestamps();
