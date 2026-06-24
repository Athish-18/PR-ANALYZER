import { pool } from './src/config/db.js';
import { generateEmbeddings } from './src/services/embedding.service.js';
import { upsertEmbeddings } from './src/models/embedding.model.js';

async function forceEmbed() {
  try {
    const q1 = `
      SELECT c.id as chunk_id, c.chunk_text 
      FROM chunks c 
      JOIN files f ON f.id = c.file_id 
      LEFT JOIN chunk_embeddings ce ON ce.chunk_id = c.id
      WHERE f.file_path = 'packages/react-reconciler/src/ReactFiberHooks.js'
        AND ce.id IS NULL
    `;
    const res1 = await pool.query(q1);
    const chunks = res1.rows;
    
    console.log(`Generating embeddings for ${chunks.length} chunks of ReactFiberHooks...`);
    if (chunks.length === 0) {
      console.log("No chunks to embed!");
      return;
    }

    // Process in smaller batches of 50 just to be safe
    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50);
      const chunkTexts = batch.map(c => c.chunk_text);
      const chunkIds = batch.map(c => c.chunk_id);
      
      const embeddings = await generateEmbeddings(chunkTexts);
      const insertedCount = await upsertEmbeddings(chunkIds, embeddings);
      console.log(`Embedded ${insertedCount} chunks`);
    }
    console.log("Upserted successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
forceEmbed();
