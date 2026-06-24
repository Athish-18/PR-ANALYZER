import { pool } from './src/config/db.js';

async function checkState() {
  try {
    const repos = await pool.query("SELECT id, owner, repo_name FROM repositories WHERE repo_name LIKE '%zustand%';");
    console.log("Repositories:", repos.rows);

    if (repos.rows.length > 0) {
      const repoId = repos.rows[0].id;
      
      const files = await pool.query("SELECT COUNT(*) FROM files WHERE repository_id = $1", [repoId]);
      console.log("Files:", files.rows[0].count);

      const contents = await pool.query("SELECT COUNT(*) FROM file_contents fc JOIN files f ON fc.file_id = f.id WHERE f.repository_id = $1", [repoId]);
      console.log("Contents:", contents.rows[0].count);

      const chunks = await pool.query("SELECT COUNT(*) FROM chunks c JOIN files f ON c.file_id = f.id WHERE f.repository_id = $1", [repoId]);
      console.log("Chunks:", chunks.rows[0].count);

      const embeddings = await pool.query("SELECT COUNT(*) FROM chunk_embeddings ce JOIN chunks c ON ce.chunk_id = c.id JOIN files f ON c.file_id = f.id WHERE f.repository_id = $1", [repoId]);
      console.log("Embeddings:", embeddings.rows[0].count);
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkState();
