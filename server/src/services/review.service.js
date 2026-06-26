import { performSemanticSearch } from './search.service.js';
import { generateCompletion } from './langchain.service.js';
import { REVIEW_SYSTEM_PROMPT } from '../prompts/review.prompt.js';
import { fetchPullRequestDiff } from '../github/github.service.js';
import { getRepositoryById } from '../models/repository.model.js';

function parseDiffForQueries(diffText) {
  const queries = [];
  
  const lines = diffText.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      const filename = line.slice(6).trim();
      if (filename) queries.push(filename);
    }
    
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const functionMatch = line.match(/(?:function|const|let|var)\s+([a-zA-Z0-9_]+)\s*(?:=|\()/);
      if (functionMatch && functionMatch[1]) {
        queries.push(functionMatch[1]);
      }
    }
    
    if (line.startsWith('-') && !line.startsWith('---')) {
      const functionMatch = line.match(/(?:function|const|let|var)\s+([a-zA-Z0-9_]+)\s*(?:=|\()/);
      if (functionMatch && functionMatch[1]) {
        queries.push(functionMatch[1]);
      }
    }
  }
  
  const uniqueQueries = [...new Set(queries)].filter(q => q.trim().length > 0);
  return uniqueQueries.slice(0, 3);
}

export const reviewDiff = async (repositoryId, diffText) => {
  const queries = parseDiffForQueries(diffText);
  
  // If no queries could be parsed, fallback to a general search based on diff text length
  if (queries.length === 0) {
    const fallbackQuery = diffText.slice(0, 500).trim();
    if (fallbackQuery) queries.push(fallbackQuery);
  }

  let allSearchResults = [];
  
  for (const query of queries) {
    try {
      const results = await performSemanticSearch(repositoryId, query, 5);
      allSearchResults.push(...results);
    } catch (err) {
      console.error(`Search failed for query "${query}":`, err);
    }
  }
  
  const uniqueChunks = [];
  const chunkIds = new Set();
  
  for (const chunk of allSearchResults) {
    if (!chunkIds.has(chunk.id)) {
      chunkIds.add(chunk.id);
      uniqueChunks.push(chunk);
    }
  }
  
  const topChunks = uniqueChunks.slice(0, 15);
  
  const contextText = topChunks.map(chunk => 
    `File: ${chunk.filePath}\nContent:\n${chunk.content}`
  ).join('\n\n');
  
  let reviewContent;
  try {
    reviewContent = await generateCompletion({
      systemPrompt: REVIEW_SYSTEM_PROMPT,
      question: `Here is the Git Diff:\n\n${diffText}`,
      context: contextText
    });
  } catch (err) {
    console.error("Review Generation Error:", err);
  }
  
  const uniqueFiles = new Set(topChunks.map(c => c.filePath));
  
  const diagnostics = {
    method: "Hybrid RAG PR Review",
    filesDetected: queries.filter(q => q.includes('/') || q.includes('.')).length,
    symbolsDetected: queries.filter(q => !q.includes('/') && !q.includes('.')).length,
    retrievalQueries: queries,
    chunksRetrieved: topChunks.length,
    uniqueFiles: uniqueFiles.size
  };
  
  return {
    review: reviewContent || "Failed to generate review.",
    diagnostics
  };
};

export const reviewGithubPr = async (repositoryId, prUrl) => {
  const currentRepo = await getRepositoryById(repositoryId);
  if (!currentRepo) {
    throw new Error('Repository not found in database.');
  }

  const githubData = await fetchPullRequestDiff(prUrl);
  
  if (currentRepo.owner.toLowerCase() !== githubData.owner.toLowerCase() || 
      currentRepo.repo.toLowerCase() !== githubData.repo.toLowerCase()) {
    throw new Error(`This PR belongs to ${githubData.owner}/${githubData.repo}.\n\nYour currently indexed repository is ${currentRepo.owner}/${currentRepo.repo}.\n\nPlease switch repositories before reviewing this PR.`);
  }

  const reviewResponse = await reviewDiff(repositoryId, githubData.diff);

  return {
    source: "github",
    repository: `${currentRepo.owner}/${currentRepo.repo}`,
    pullNumber: githubData.pullNumber,
    review: reviewResponse.review,
    diagnostics: reviewResponse.diagnostics
  };
};
