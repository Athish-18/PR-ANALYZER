import { runEmbeddingPipeline } from '../services/embedding.service.js';

export const processEmbeddings = async (req, res) => {
  try {
    const { repositoryId } = req.params;

    if (!repositoryId) {
      return res.status(400).json({ error: 'repositoryId is required' });
    }

    const totalEmbeddingsCreated = await runEmbeddingPipeline(repositoryId);

    res.json({
      repositoryId: parseInt(repositoryId, 10),
      embeddingsCreated: totalEmbeddingsCreated
    });
  } catch (error) {
    console.error("processEmbeddings error:", error);
    res.status(400).json({ error: error.message });
  }
};
