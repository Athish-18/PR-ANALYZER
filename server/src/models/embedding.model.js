import { pool } from '../config/db.js';

export const getChunksToEmbed = async (repositoryId, limit = 50) => {
  const query = `
    SELECT c.id as chunk_id, c.chunk_text 
    FROM chunks c
    JOIN files f ON f.id = c.file_id
    LEFT JOIN chunk_embeddings ce ON ce.chunk_id = c.id
    WHERE f.repository_id = $1 
      AND ce.id IS NULL
    ORDER BY c.id ASC
    LIMIT $2
  `;
  const result = await pool.query(query, [repositoryId, limit]);
  return result.rows;
};

export const upsertEmbeddings = async (chunkIds, embeddings) => {
  if (!chunkIds || chunkIds.length === 0) return 0;

  // Convert array of floats to string representation like '[0.1, 0.2, ...]' 
  // so pgvector can cast it from text
  const stringEmbeddings = embeddings.map(emb => JSON.stringify(emb));

  const query = `
    INSERT INTO chunk_embeddings (chunk_id, embedding)
    SELECT unnest($1::integer[]), (unnest($2::text[]))::vector
    ON CONFLICT (chunk_id) DO NOTHING;
  `;

  const values = [chunkIds, stringEmbeddings];
  const result = await pool.query(query, values);
  return result.rowCount;
};
