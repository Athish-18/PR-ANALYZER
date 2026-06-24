import { pool } from '../src/config/db.js';

const resetRepo = async () => {
  const repositoryId = parseInt(process.argv[2], 10);
  if (!repositoryId || isNaN(repositoryId)) {
    console.error("Please provide a valid repository ID. Usage: node scripts/reset_repo_contents.js <repository_id>");
    process.exit(1);
  }

  console.log(`Starting reset for repository ID ${repositoryId}...`);

  try {
    // 1. Delete from chunk_embeddings first to prevent foreign key errors
    const resEmbeddings = await pool.query(`
      DELETE FROM chunk_embeddings 
      WHERE chunk_id IN (
        SELECT c.id FROM chunks c 
        JOIN files f ON c.file_id = f.id 
        WHERE f.repository_id = $1
      )
    `, [repositoryId]);
    console.log(`Deleted ${resEmbeddings.rowCount} chunk embeddings.`);

    // 2. Delete from chunks
    const resChunks = await pool.query(`
      DELETE FROM chunks 
      WHERE file_id IN (SELECT id FROM files WHERE repository_id = $1)
    `, [repositoryId]);
    console.log(`Deleted ${resChunks.rowCount} chunks.`);

    // 3. Delete from file_contents
    const resContents = await pool.query(`
      DELETE FROM file_contents 
      WHERE file_id IN (SELECT id FROM files WHERE repository_id = $1)
    `, [repositoryId]);
    console.log(`Deleted ${resContents.rowCount} file contents.`);

    console.log(`Repository ${repositoryId} reset successfully. Ready for clean ingestion!`);
  } catch (err) {
    console.error("Error during reset:", err);
  } finally {
    await pool.end();
  }
};

resetRepo();
