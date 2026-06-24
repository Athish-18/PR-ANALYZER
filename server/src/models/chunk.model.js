import { pool } from '../config/db.js';

export const getFilesToChunk = async (repositoryId, limit = 50) => {
  const query = `
    SELECT fc.file_id, fc.content 
    FROM file_contents fc
    JOIN files f ON f.id = fc.file_id
    LEFT JOIN chunks c ON c.file_id = fc.file_id
    WHERE f.repository_id = $1 
      AND c.id IS NULL
    ORDER BY f.id ASC
    LIMIT $2
  `;
  const result = await pool.query(query, [repositoryId, limit]);
  return result.rows;
};

export const upsertChunks = async (fileId, chunks) => {
  if (!chunks || chunks.length === 0) return 0;

  const chunkIndexes = chunks.map((_, i) => i);
  const chunkTexts = chunks;

  const query = `
    INSERT INTO chunks (file_id, chunk_index, chunk_text)
    SELECT $1, unnest($2::integer[]), unnest($3::text[])
    ON CONFLICT (file_id, chunk_index) DO NOTHING;
  `;

  const values = [fileId, chunkIndexes, chunkTexts];
  const result = await pool.query(query, values);
  return result.rowCount;
};
