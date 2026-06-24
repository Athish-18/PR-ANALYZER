import { pool } from '../config/db.js';

export const getFilesWithoutContent = async (repositoryId, limit = 50) => {
  const query = `
    SELECT f.id, f.file_path, f.file_type 
    FROM files f
    LEFT JOIN file_contents fc ON f.id = fc.file_id
    WHERE f.repository_id = $1 
      AND fc.id IS NULL
      AND f.file_path NOT LIKE '.github/%'
      AND f.file_path NOT LIKE '.claude/%'
      AND f.file_path NOT LIKE 'compiler/.claude/%'
      AND f.file_path NOT LIKE '%node_modules/%'
      AND f.file_path NOT LIKE '%dist/%'
      AND f.file_path NOT LIKE '%build/%'
    ORDER BY 
      CASE
        WHEN f.file_type IN ('js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rs', 'cpp', 'c') THEN 1
        WHEN f.file_type = 'md' THEN 2
        WHEN f.file_type IN ('json', 'yml', 'yaml', 'toml') THEN 3
        ELSE 4
      END ASC,
      f.id ASC
    LIMIT $2
  `;
  const result = await pool.query(query, [repositoryId, limit]);
  return result.rows;
};

export const upsertFileContent = async (fileId, content) => {
  const size = Buffer.byteLength(content, 'utf8');
  
  const query = `
    INSERT INTO file_contents (file_id, content, content_size)
    VALUES ($1, $2, $3)
    ON CONFLICT (file_id) DO NOTHING
    RETURNING id;
  `;
  
  const result = await pool.query(query, [fileId, content, size]);
  return result.rowCount > 0; // returns true if it was newly inserted
};
