import { reviewDiff, reviewGithubPr } from '../services/review.service.js';

export const reviewDiffController = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { type = 'diff', diff, prUrl } = req.body;

    if (!repositoryId) {
      return res.status(400).json({ error: 'repositoryId is required' });
    }

    let result;

    if (type === 'github') {
      if (!prUrl || typeof prUrl !== 'string' || prUrl.trim().length === 0) {
        return res.status(400).json({ error: 'Valid GitHub PR URL is required' });
      }
      result = await reviewGithubPr(parseInt(repositoryId, 10), prUrl.trim());
    } else {
      // Default to diff paste
      if (!diff || typeof diff !== 'string' || diff.trim().length === 0) {
        return res.status(400).json({ error: 'Valid diff text is required' });
      }
      result = await reviewDiff(parseInt(repositoryId, 10), diff);
    }
    
    res.json(result);
  } catch (error) {
    console.error("reviewDiffController error:", error);
    res.status(500).json({ error: error.message || "Failed to generate review" });
  }
};
