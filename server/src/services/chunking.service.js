import { getFilesToChunk, upsertChunks } from '../models/chunk.model.js';
import { pool } from '../config/db.js';

export const generateChunks = (text, chunkSize = 1000, overlap = 200) => {
  if (!text) return [];
  
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += (chunkSize - overlap);
  }
  
  return chunks;
};

export const runChunkingPipeline = async (repositoryId) => {
  let totalChunksCreated = 0;
  let batchNumber = 1;

  while (true) {
    const filesToChunk = await getFilesToChunk(repositoryId, 50);
    
    if (filesToChunk.length === 0) {
      console.log(`[CHUNKING] Complete`);
      break;
    }
    
    console.log(`[CHUNKING] Processing batch ${batchNumber}`);
    
    let chunksCreatedThisBatch = 0;
    let chunkedFilesCount = 0;
    let skippedFilesCount = 0;
    
    for (const file of filesToChunk) {
      if (!file.content || file.content.trim() === '') {
        await upsertChunks(file.file_id, [""]); // Mark as processed
        skippedFilesCount++;
        continue;
      }

      const chunks = generateChunks(file.content, 1000, 200);
      
      if (chunks.length === 0) {
        await upsertChunks(file.file_id, [""]); // Mark as processed
        skippedFilesCount++;
        continue;
      }

      const insertedCount = await upsertChunks(file.file_id, chunks);
      chunksCreatedThisBatch += insertedCount;
      chunkedFilesCount++;
    }

    console.log(`[CHUNKING] Chunked ${chunkedFilesCount} files`);
    console.log(`[CHUNKING] Skipped ${skippedFilesCount} empty files`);
    
    totalChunksCreated += chunksCreatedThisBatch;
    
    const remainingRes = await pool.query(`
      SELECT COUNT(*)
      FROM file_contents fc
      JOIN files f ON f.id = fc.file_id
      LEFT JOIN chunks c ON fc.file_id = c.file_id
      WHERE f.repository_id = $1 AND c.file_id IS NULL
    `, [repositoryId]);
    
    console.log(`[CHUNKING] Remaining files ${remainingRes.rows[0].count}`);
    batchNumber++;
  }

  return totalChunksCreated;
};
