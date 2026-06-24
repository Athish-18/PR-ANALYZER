import { pool } from '../config/db.js';

export const upsertFiles = async (repositoryId, files) => {
  if (!files || files.length === 0) return 0;

  // Extract paths and determine a simple file type (extension)
  const filePaths = files.map(f => f.path);
  const fileTypes = files.map(f => {
    const parts = f.path.split('/');
    const filename = parts[parts.length - 1];
    const extParts = filename.split('.');
    return extParts.length > 1 ? extParts.pop() : 'unknown';
  });

  // Using Postgres unnest() is highly efficient for bulk inserts
  // and avoids the parameter limit (65535) since we only pass 3 array parameters.
  const query = `
    INSERT INTO files (repository_id, file_path, file_type)
    SELECT $1, unnest($2::text[]), unnest($3::text[])
    ON CONFLICT (repository_id, file_path) DO NOTHING;
  `;

  const values = [repositoryId, filePaths, fileTypes];
  await pool.query(query, values);
  
  return files.length;
};
