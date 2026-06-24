import { performSemanticSearch } from '../services/search.service.js';

export const searchRepository = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query string is required in request body' });
    }

    const results = await performSemanticSearch(repositoryId, query, 5);

    res.json({
      repositoryId: parseInt(repositoryId, 10),
      query: query,
      results: results.map(r => ({
        filePath: r.file_path,
        // Ensure similarity is formatted as a neat float
        similarity: parseFloat(parseFloat(r.similarity).toFixed(4)),
        chunkText: r.chunk_text
      }))
    });
  } catch (error) {
    console.error("searchRepository error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const debugSearchRepository = async (req, res) => {
  try {
    const { repositoryId } = req.params;
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query string is required in request body' });
    }

    // Call existing semantic search but with limit 20
    const results = await performSemanticSearch(repositoryId, query, 20);

    res.json({
      repositoryId: parseInt(repositoryId, 10),
      query: query,
      results: results.map(r => ({
        filePath: r.file_path,
        similarity: parseFloat(parseFloat(r.similarity).toFixed(4)),
        finalScore: parseFloat(r.final_score.toFixed(4)),
        chunkText: r.chunk_text.substring(0, 200)
      }))
    });
  } catch (error) {
    console.error("debugSearchRepository error:", error);
    res.status(500).json({ error: error.message });
  }
};
