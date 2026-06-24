import { pool } from '../config/db.js';

export const searchKeywordChunks = async (repositoryId, queryText, limit = 10) => {
  const query = `
    SELECT 
      c.id AS chunk_id,
      f.file_path, 
      c.chunk_text, 
      ts_rank(to_tsvector('english', c.chunk_text), plainto_tsquery('english', $1)) AS keyword_score
    FROM chunks c
    JOIN files f ON f.id = c.file_id
    WHERE f.repository_id = $2
      AND to_tsvector('english', c.chunk_text) @@ plainto_tsquery('english', $1)
      AND f.file_path NOT ILIKE '%CHANGELOG.md'
      AND f.file_path NOT ILIKE '%README.md'
      AND f.file_path NOT LIKE '.github/%'
      AND f.file_path NOT LIKE '.claude/%'
      AND f.file_path NOT LIKE 'compiler/.claude/%'
      AND f.file_path NOT LIKE 'docs/%'
      AND f.file_path NOT LIKE '%node_modules/%'
      AND f.file_path NOT LIKE '%dist/%'
      AND f.file_path NOT LIKE '%build/%'
    ORDER BY keyword_score DESC
    LIMIT $3;
  `;

  const values = [queryText, repositoryId, limit];
  const result = await pool.query(query, values);
  return result.rows;
};
