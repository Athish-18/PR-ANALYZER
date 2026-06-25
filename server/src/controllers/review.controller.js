import { reviewDiff } from '../services/review.service.js';

export const reviewDiffController = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { diff } = req.body;

    if (!repositoryId) {
      return res.status(400).json({ error: 'repositoryId is required' });
    }

    if (!diff || typeof diff !== 'string' || diff.trim().length === 0) {
      return res.status(400).json({ error: 'Valid diff text is required' });
    }

    const result = await reviewDiff(parseInt(repositoryId, 10), diff);
    
    res.json(result);
  } catch (error) {
    console.error("reviewDiffController error:", error);
    res.status(500).json({ error: error.message || "Failed to generate review" });
  }
};
