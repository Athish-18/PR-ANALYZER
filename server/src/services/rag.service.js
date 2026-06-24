import Groq from "groq-sdk";
import { performSemanticSearch } from './search.service.js';

export const generateAnswer = async (repositoryId, question, debug = false) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
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

  // 3. System Prompt
  const systemPrompt = `You are an expert developer analyzing source code.
You will be provided with retrieved snippets from the codebase.
Use the retrieved context as your primary source.
If a complete answer exists, provide it normally.

When answering implementation questions:
1. Combine evidence from ALL retrieved chunks.
2. Prefer explaining visible code over stating information is missing.
3. If multiple chunks reveal different parts of a function, merge them into one explanation.
4. Describe:
   - Purpose
   - Inputs
   - Outputs
   - Internal state changes
   - Related functions
5. Only say information is missing when no retrieved snippet supports the claim.
6. Avoid generic statements such as "implementation not shown" or "not enough context" unless absolutely necessary.
7. When possible, reconstruct the execution flow using retrieved evidence.

If only partial evidence exists for general queries:
- summarize the strongest evidence available
- mention relevant files
- explain what can be inferred
- explain what information is missing
Only output "I cannot answer this based on the retrieved codebase context." when no useful evidence exists at all.
Keep your responses grounded in the retrieved context. Do not invent code that is not present.
Mention the file paths when relevant to help the user understand where the code lives.`;

  // 4. Call Groq LLM
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context:\n${contextText}\n\nQuestion: ${question}` }
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
  });

  const response = {
    answer: chatCompletion.choices[0]?.message?.content || "Failed to generate answer.",
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
