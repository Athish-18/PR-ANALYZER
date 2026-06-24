import { pool } from './src/config/db.js';
import { generateChunks } from './src/services/chunking.service.js';
import { upsertChunks } from './src/models/chunk.model.js';

async function forceChunk() {
  try {
    const q1 = `SELECT file_id, content FROM file_contents WHERE file_id = 6349;`;
    const res1 = await pool.query(q1);
    const file = res1.rows[0];
    
    console.log("Generating chunks for ReactFiberHooks...");
    const chunks = generateChunks(file.content, 1000, 200);
    console.log(`Generated ${chunks.length} chunks`);
    
    await upsertChunks(file.file_id, chunks);
    console.log("Upserted successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
forceChunk();
