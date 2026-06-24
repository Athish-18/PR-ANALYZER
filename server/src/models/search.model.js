import { pool } from '../config/db.js';

export const searchSimilarChunks = async (repositoryId, queryEmbedding, limit = 5) => {
  // Convert embedding array to string for pgvector
  const embeddingString = JSON.stringify(queryEmbedding);

  // We use <=> which is cosine distance in pgvector.
  // Cosine similarity is 1 - cosine distance.
  const query = `
    SELECT 
      c.id AS chunk_id,
      f.file_path, 
      c.chunk_text, 
      1 - (ce.embedding <=> $1::vector) AS similarity
    FROM chunk_embeddings ce
    JOIN chunks c ON c.id = ce.chunk_id
    JOIN files f ON f.id = c.file_id
    WHERE f.repository_id = $2
      AND f.file_path NOT ILIKE '%CHANGELOG.md'
      AND f.file_path NOT ILIKE '%README.md'
      AND f.file_path NOT LIKE '.github/%'
      AND f.file_path NOT LIKE '.claude/%'
      AND f.file_path NOT LIKE 'docs/%'
    ORDER BY ce.embedding <=> $1::vector ASC
    LIMIT $3;
  `;

  const values = [embeddingString, repositoryId, limit];
  const result = await pool.query(query, values);
  return result.rows;
};
