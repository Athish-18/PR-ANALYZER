import { pipeline, env } from '@xenova/transformers';
import { getChunksToEmbed, upsertEmbeddings } from '../models/embedding.model.js';
import { pool } from '../config/db.js';

// Bypass ISP blocks by using the Hugging Face Mirror
env.remoteHost = 'https://hf-mirror.com';
env.localModelPath = './.cache/models';
env.allowLocalModels = true;

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/bge-small-en-v1.5';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

export const generateEmbeddings = async (texts) => {
  const extractor = await PipelineSingleton.getInstance();
  
  // Extract features (embeddings)
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  
  // Convert Tensor back to standard JavaScript arrays
  return output.tolist();
};

export const runEmbeddingPipeline = async (repositoryId) => {
  let totalEmbeddingsCreated = 0;
  let batchNumber = 1;

  while (true) {
    const chunksToEmbed = await getChunksToEmbed(repositoryId, 50);
    
    if (chunksToEmbed.length === 0) {
      console.log(`[EMBEDDING] Complete`);
      break;
    }

    console.log(`[EMBEDDING] Processing batch ${batchNumber}`);

    const chunkTexts = chunksToEmbed.map(c => c.chunk_text);
    const chunkIds = chunksToEmbed.map(c => c.chunk_id);
    
    const embeddings = await generateEmbeddings(chunkTexts);
    const insertedCount = await upsertEmbeddings(chunkIds, embeddings);
    
    console.log(`[EMBEDDING] Embedded ${insertedCount} chunks`);
    totalEmbeddingsCreated += insertedCount;

    const remainingRes = await pool.query(`
      SELECT COUNT(*)
      FROM chunks c
      JOIN files f ON f.id = c.file_id
      LEFT JOIN chunk_embeddings ce ON ce.chunk_id = c.id
      WHERE f.repository_id = $1 AND ce.id IS NULL
    `, [repositoryId]);
    
    console.log(`[EMBEDDING] Remaining chunks ${remainingRes.rows[0].count}`);
    batchNumber++;
  }

  return totalEmbeddingsCreated;
};
