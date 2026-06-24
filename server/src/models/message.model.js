import { pool } from '../config/db.js';

export const createMessage = async (conversationId, role, content, diagnostics = null) => {
  const result = await pool.query(
    `INSERT INTO messages (conversation_id, role, content, diagnostics)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [conversationId, role, content, diagnostics]
  );
  return result.rows[0];
};

export const getMessagesByConversation = async (conversationId) => {
  const result = await pool.query(
    `SELECT * FROM messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
};
