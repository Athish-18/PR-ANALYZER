import { listConversations, getConversation } from '../models/conversation.model.js';
import { getMessagesByConversation } from '../models/message.model.js';

export const getConversations = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!repositoryId) {
      return res.status(400).json({ error: 'repositoryId is required' });
    }

    const conversations = await listConversations(repositoryId, limit);
    res.json(conversations);
  } catch (error) {
    console.error("getConversations error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }

    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await getMessagesByConversation(conversationId);
    
    res.json({
      conversation,
      messages
    });
  } catch (error) {
    console.error("getConversationMessages error:", error);
    res.status(500).json({ error: error.message });
  }
};
