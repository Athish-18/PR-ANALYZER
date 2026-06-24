import { runChunkingPipeline } from '../services/chunking.service.js';

export const processChunks = async (req, res) => {
  try {
    const { repositoryId } = req.params;

    if (!repositoryId) {
      return res.status(400).json({ error: 'repositoryId is required' });
    }

    const totalChunksCreated = await runChunkingPipeline(repositoryId);

    res.json({
      repositoryId: parseInt(repositoryId, 10),
      chunksCreated: totalChunksCreated
    });
  } catch (error) {
    console.error("processChunks error:", error);
    res.status(400).json({ error: error.message });
  }
};
