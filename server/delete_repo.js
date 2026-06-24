import { pool } from './src/config/db.js';

async function deleteRepo() {
  try {
    await pool.query("DELETE FROM repositories WHERE repo_name LIKE '%zustand%'");
    console.log("Deleted old zustand");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

deleteRepo();
