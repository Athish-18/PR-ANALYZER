import { pool } from '../config/db.js';

export const upsertRepository = async (repoData) => {
  const { owner, repo, repoUrl, defaultBranch, totalFiles } = repoData;

  const query = `
    INSERT INTO repositories (owner, repo_name, repo_url, default_branch, total_files, status)
    VALUES ($1, $2, $3, $4, $5, 'Downloading')
    ON CONFLICT (owner, repo_name)
    DO UPDATE SET 
      repo_url = EXCLUDED.repo_url,
      default_branch = EXCLUDED.default_branch,
      total_files = EXCLUDED.total_files,
      status = 'Downloading'
    RETURNING id, owner, repo_name as repo, default_branch as "defaultBranch", total_files as "totalFiles", status;
  `;

  const values = [owner, repo, repoUrl, defaultBranch, totalFiles];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateRepositoryStatus = async (id, status) => {
  const query = `
    UPDATE repositories 
    SET status = $2 
    WHERE id = $1
    RETURNING status;
  `;
  const result = await pool.query(query, [id, status]);
  return result.rows[0];
};

export const getAllRepositories = async () => {
  const query = `
    SELECT 
      r.id, 
      r.owner, 
      r.repo_name, 
      r.repo_url, 
      r.created_at,
      r.status,
      (SELECT COUNT(*) FROM files WHERE repository_id = r.id) as total_files,
      (SELECT COUNT(*) FROM file_contents fc JOIN files f ON f.id = fc.file_id WHERE f.repository_id = r.id) as contents_stored,
      (SELECT COUNT(*) FROM chunks c JOIN files f ON f.id = c.file_id WHERE f.repository_id = r.id) as chunks_created,
      (SELECT COUNT(*) FROM chunk_embeddings ce JOIN chunks c ON ce.chunk_id = c.id JOIN files f ON f.id = c.file_id WHERE f.repository_id = r.id) as embeddings_created
    FROM repositories r
    ORDER BY r.created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows.map(row => ({
    id: row.id,
    name: `${row.owner}/${row.repo_name}`,
    url: row.repo_url,
    createdAt: row.created_at,
    status: row.status,
    totalFiles: parseInt(row.total_files, 10),
    contentsStored: parseInt(row.contents_stored, 10),
    chunksCreated: parseInt(row.chunks_created, 10),
    embeddingsCreated: parseInt(row.embeddings_created, 10)
  }));
};
