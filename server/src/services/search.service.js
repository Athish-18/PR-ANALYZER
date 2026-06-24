import { generateEmbeddings } from './embedding.service.js';
import { searchSimilarChunks } from '../models/search.model.js';
import { searchKeywordChunks } from '../models/keywordSearch.model.js';
import { pool } from '../config/db.js';

function extractKeywordQuery(question) {
  const stopwords = ['where', 'is', 'defined', 'how', 'implemented', 'what', 'file', 'contains', 'explain', 'in', 'the', 'code', 'can', 'i', 'find', '?', 'are', 'they'];
  
  const words = question.split(/[\s?]+/);
  
  const keywords = words.filter(word => {
    if (!word) return false;
    return !stopwords.includes(word.toLowerCase());
  });
  
  const keywordQuery = keywords.length > 0 ? keywords.join(' ') : question;
  
  console.log(`\n[QUERY]\nOriginal:\n${question}\n\nKeyword Query:\n${keywordQuery}\n`);
  
  return keywordQuery;
}

function isNoiseFile(filePath) {
  return filePath.includes('__tests__') ||
         filePath.includes('.test.') ||
         filePath.includes('.spec.') ||
         filePath.includes('fixtures/') ||
         filePath.includes('__fixtures__') ||
         filePath.includes('examples/') ||
         filePath.includes('scripts/') ||
         filePath.includes('benchmark/');
}

export const performSemanticSearch = async (repositoryId, queryText, limit = 5) => {

  // 3. Exact File Lookup Intent
  const fileIntentRegex = /\b(what file contains|which file contains|show me the file path for|file path for|locate file|path of)\b/i;

  if (fileIntentRegex.test(queryText)) {
    const keywordQuery = extractKeywordQuery(queryText);
    const searchTerm = `%${keywordQuery.split(' ').join('%')}%`;

    const res = await pool.query(
      `
      SELECT file_path
      FROM files
      WHERE repository_id = $1
        AND file_path ILIKE $2
      LIMIT $3
      `,
      [repositoryId, searchTerm, limit]
    );

    return res.rows.map(row => ({
      file_path: row.file_path,
      source: 'file_lookup',
      similarity: 1.0,
      final_score: 1.0,
      chunk_text: `Exact file path: ${row.file_path}`
    }));
  }

  // Generate embedding for the natural language query
  const embeddings = await generateEmbeddings([queryText]);
  const queryEmbedding = embeddings[0];
  
  const keywordQuery = extractKeywordQuery(queryText);



  // Fetch top 50 from vector search and 20 from keyword search to ensure we retrieve implementations
  const [vectorResults, keywordResults] = await Promise.all([
    searchSimilarChunks(repositoryId, queryEmbedding, 50),
    searchKeywordChunks(repositoryId, keywordQuery, 20)
  ]);

  const chunkMap = new Map();


  // Process Vector Results
  vectorResults.forEach((result, index) => {
    const rank = index + 1;
    let rrfScore = 1 / (60 + rank);
    
    if (chunkMap.has(result.chunk_id)) {
      chunkMap.get(result.chunk_id).final_score += rrfScore;
    } else {
      chunkMap.set(result.chunk_id, {
        chunk_id: result.chunk_id,
        file_path: result.file_path,
        chunk_text: result.chunk_text,
        vector_similarity: parseFloat(result.similarity),
        keyword_score: 0,
        final_score: rrfScore
      });
    }
  });

  // Process Keyword Results
  keywordResults.forEach((result, index) => {
    const rank = index + 1;
    let rrfScore = 1 / (60 + rank);
    
    if (chunkMap.has(result.chunk_id)) {
      const existing = chunkMap.get(result.chunk_id);
      existing.keyword_score = parseFloat(result.keyword_score);
      existing.final_score += rrfScore; // Boost chunk appearing in both
    } else {
      chunkMap.set(result.chunk_id, {
        chunk_id: result.chunk_id,
        file_path: result.file_path,
        chunk_text: result.chunk_text,
        vector_similarity: 0,
        keyword_score: parseFloat(result.keyword_score),
        final_score: rrfScore
      });
    }
  });

  const finalResultsArray = Array.from(chunkMap.values());
  
  // Apply implementation boost and log
  finalResultsArray.forEach(r => {
    const baseScore = r.final_score;
    const isNoise = isNoiseFile(r.file_path);
    
    if (!isNoise) {
      r.final_score *= 1.5; // Smallest effective boost
    }
    
    console.log(`[RANKING] file: ${r.file_path} | type: ${isNoise ? 'noise' : 'implementation'} | base_score: ${baseScore.toFixed(4)} | adjusted_score: ${r.final_score.toFixed(4)}`);
  });

  // Convert to array, sort by final_score DESC, and take top 'limit'
  const finalResults = finalResultsArray
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, limit);

  // Return formatted results compatible with existing endpoints
  return finalResults.map(r => ({
    file_path: r.file_path,
    similarity: r.vector_similarity || r.keyword_score,
    final_score: r.final_score,
    chunk_text: r.chunk_text
  }));
};
