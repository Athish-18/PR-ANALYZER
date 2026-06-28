import { generateAnswer } from '../services/rag.service.js';
import { createConversation, updateConversationTimestamp } from '../models/conversation.model.js';
import { createMessage } from '../models/message.model.js';

export const chatNode = async (state) => {
  const { repositoryId, payload } = state;
  const { question, debug, reqConversationId } = payload;
  
  let conversationId = reqConversationId;
  if (!conversationId) {
    const title = question.length > 50 ? question.slice(0, 50) + '...' : question;
    const conversation = await createConversation(repositoryId, title);
    conversationId = conversation.id;
  } else {
    await updateConversationTimestamp(conversationId);
  }

  await createMessage(conversationId, 'user', question);

  const { answer, sources, diagnostics } = await generateAnswer(repositoryId, question, debug);

  await createMessage(conversationId, 'assistant', answer, diagnostics || null);
  
  return {
    result: {
      conversationId,
      question,
      answer,
      sources,
      ...(diagnostics && { diagnostics })
    }
  };
};
