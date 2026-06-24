import { performSemanticSearch } from './search.service.js';
import { generateCompletion } from './langchain.service.js';
import { SYSTEM_PROMPT } from '../prompts/rag.prompt.js';

export const generateAnswer = async (repositoryId, question, debug = false) => {
  // 1. Semantic Retrieval (Top 20 chunks)
  const searchResults = await performSemanticSearch(repositoryId, question, 20);
  
  if (searchResults.length === 0) {
    return {
      answer: "No relevant context found in the repository to answer this question.",
      sources: []
    };
  }

  // 2. Context Assembly & Budget Optimization
  const MAX_CHUNK_CHARS = 1200;
  const MAX_CONTEXT_CHARS = 8000;
  const MAX_CONTEXT_CHUNKS = 8;

  // Step 1 - Deduplicate Chunks
  const uniqueChunks = [];
  const seenText = new Set();
  for (const chunk of searchResults) {
    const preview = chunk.chunk_text.slice(0, 150).trim();
    if (!seenText.has(preview)) {
      seenText.add(preview);
      uniqueChunks.push(chunk);
    }
  }

  const isTraceQuery = /(trace|call chain|execution flow|how does|how is|flow of|walk through)/i.test(question);
  const retrievalMode = isTraceQuery ? "trace" : "standard";

  // Step 2 - File Diversity
  const fileCounts = {};
  for (const chunk of uniqueChunks) {
    fileCounts[chunk.file_path] = (fileCounts[chunk.file_path] || 0) + 1;
    if (!isTraceQuery) {
      chunk.adjusted_score = chunk.final_score * Math.pow(0.8, fileCounts[chunk.file_path] - 1);
    } else {
      chunk.adjusted_score = chunk.final_score;
    }
  }
  uniqueChunks.sort((a, b) => b.adjusted_score - a.adjusted_score);

  // Step 3 & 4 - Chunk Trimming & Hard Limits
  let totalCharacters = 0;
  const finalChunks = [];
  const uniqueFilePaths = new Set();

  for (const chunk of uniqueChunks) {
    if (finalChunks.length >= MAX_CONTEXT_CHUNKS) break;
    
    let text = chunk.chunk_text;
    if (text.length > MAX_CHUNK_CHARS) {
      text = text.slice(0, MAX_CHUNK_CHARS) + "\n...[TRUNCATED]";
    }
    
    if (totalCharacters + text.length > MAX_CONTEXT_CHARS) {
      if (finalChunks.length === 0) {
        text = text.slice(0, MAX_CONTEXT_CHARS - 50) + "\n...[TRUNCATED]";
      } else {
        break;
      }
    }
    
    chunk.trimmed_text = text;
    finalChunks.push(chunk);
    uniqueFilePaths.add(chunk.file_path);
    totalCharacters += text.length;
  }

  // Step 5 - Format Context & Log Statistics
  const statistics = {
    initialChunks: searchResults.length,
    afterDedup: uniqueChunks.length,
    afterDiversity: uniqueChunks.length,
    finalChunks: finalChunks.length,
    uniqueFiles: uniqueFilePaths.size,
    totalCharacters,
    estimatedTokens: Math.ceil(totalCharacters / 4)
  };
  console.log("[CONTEXT BUDGET]", statistics);

  let contextText = `Retrieved Repository Context:\n\n`;
  finalChunks.forEach((result) => {
    contextText += `--- File: ${result.file_path} ---\n`;
    contextText += `${result.trimmed_text}\n\n`;
  });

  const sources = Array.from(uniqueFilePaths).map(path => ({ filePath: path }));

  // 3. & 4. System Prompt and Call LangChain LLM
  let answerText;
  try {
    answerText = await generateCompletion({
      systemPrompt: SYSTEM_PROMPT,
      question,
      context: contextText
    });
  } catch (err) {
    console.error("LangChain Error:", err);
  }

  const response = {
    answer: answerText || "Failed to generate answer.",
    sources: sources
  };

  if (debug) {
    response.diagnostics = {
      retrievalSummary: {
        method: "Hybrid RAG",
        retrievalMode: retrievalMode,
        chunksRetrieved: finalChunks.length,
        uniqueFiles: uniqueFilePaths.size,
        confidence: finalChunks.length > 0 && finalChunks[0].adjusted_score > 0.05 ? "High" : "Low",
        topSources: Array.from(uniqueFilePaths).slice(0, 3)
      },
      statistics,
      detailedDiagnostics: finalChunks.map(r => ({
        filePath: r.file_path,
        score: r.adjusted_score.toFixed(4),
        similarity: r.similarity.toFixed(4),
        chunkText: r.trimmed_text,
        source: r.similarity > 0 ? (r.keyword_score > 0 ? 'hybrid' : 'vector') : 'keyword'
      }))
    };
  }

  return response;
};
