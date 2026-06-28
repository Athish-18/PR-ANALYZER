import { appGraph } from '../graph/workflow.graph.js';

export const reviewDiffController = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { type = 'diff', diff, prUrl } = req.body;

    if (!repositoryId) {
      return res.status(400).json({ error: 'repositoryId is required' });
    }

    if (type === 'github') {
      if (!prUrl || typeof prUrl !== 'string' || prUrl.trim().length === 0) {
        return res.status(400).json({ error: 'Valid GitHub PR URL is required' });
      }
    } else {
      if (!diff || typeof diff !== 'string' || diff.trim().length === 0) {
        return res.status(400).json({ error: 'Valid diff text is required' });
      }
      if (diff.trim().startsWith('http://') || diff.trim().startsWith('https://')) {
        return res.status(400).json({ error: 'Please use the "GitHub Pull Request" option to analyze URLs.' });
      }
    }

    const state = await appGraph.invoke({
      workflow: 'review',
      repositoryId: parseInt(repositoryId, 10),
      payload: { type, diff, prUrl },
      context: {},
      metadata: {}
    });
    
    res.json(state.result);
  } catch (error) {
    console.error("reviewDiffController error:", error);
    res.status(500).json({ error: error.message || "Failed to generate review" });
  }
};
