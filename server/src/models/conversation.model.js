import { pool } from '../config/db.js';

export const createConversation = async (repositoryId, title) => {
  const result = await pool.query(
    `INSERT INTO conversations (repository_id, title)
     VALUES ($1, $2)
     RETURNING *`,
    [repositoryId, title]
  );
  return result.rows[0];
};

export const getConversation = async (conversationId) => {
  const result = await pool.query(
    `SELECT * FROM conversations WHERE id = $1`,
    [conversationId]
  );
  return result.rows[0];
};

export const listConversations = async (repositoryId, limit = 20) => {
  const result = await pool.query(
    `SELECT * FROM conversations 
     WHERE repository_id = $1 
     ORDER BY updated_at DESC 
     LIMIT $2`,
    [repositoryId, limit]
  );
  return result.rows;
};

export const updateConversationTimestamp = async (conversationId) => {
  await pool.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );
};
