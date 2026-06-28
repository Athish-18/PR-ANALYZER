import { appGraph } from '../graph/workflow.graph.js';

export const askRepository = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { question, debug, conversationId: reqConversationId } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question string is required in request body' });
    }

    const state = await appGraph.invoke({
      workflow: 'chat',
      repositoryId: parseInt(repositoryId, 10),
      payload: {
        question,
        debug,
        reqConversationId
      },
      context: {},
      metadata: {}
    });

    res.json(state.result);
  } catch (error) {
    console.error("askRepository error:", error);
    res.status(500).json({ error: error.message });
  }
};

