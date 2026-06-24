import { generateAnswer } from '../services/rag.service.js';
import { createConversation, updateConversationTimestamp } from '../models/conversation.model.js';
import { createMessage } from '../models/message.model.js';

export const askRepository = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { question, debug, conversationId: reqConversationId } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question string is required in request body' });
    }

    // Handle Conversation
    let conversationId = reqConversationId;
    if (!conversationId) {
      const title = question.length > 50 ? question.slice(0, 50) + '...' : question;
      const conversation = await createConversation(repositoryId, title);
      conversationId = conversation.id;
    } else {
      await updateConversationTimestamp(conversationId);
    }

    // Save User Message
    await createMessage(conversationId, 'user', question);

    // Generate Answer
    const { answer, sources, diagnostics } = await generateAnswer(repositoryId, question, debug);

    // Save Assistant Message
    await createMessage(conversationId, 'assistant', answer, diagnostics || null);

    res.json({
      conversationId,
      question,
      answer,
      sources,
      ...(diagnostics && { diagnostics })
    });
  } catch (error) {
    console.error("askRepository error:", error);
    res.status(500).json({ error: error.message });
  }
};
