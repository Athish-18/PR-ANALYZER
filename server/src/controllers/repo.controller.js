import { getRepoDetails, fetchFileContent } from '../github/github.service.js';
import { upsertRepository, getAllRepositories, updateRepositoryStatus } from '../models/repository.model.js';
import { runChunkingPipeline } from '../services/chunking.service.js';
import { runEmbeddingPipeline } from '../services/embedding.service.js';
import { upsertFiles } from '../models/file.model.js';
import { getFilesWithoutContent, upsertFileContent } from '../models/fileContent.model.js';
import { pool } from '../config/db.js';

const VALID_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'go', 'rb', 'php', 'cs', 'cpp', 'c', 'h', 'hpp', 'rs', 'md', 'json', 'yml', 'yaml', 'toml', 'sh', 'sql', 'html', 'css'];

export const fetchRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'repoUrl is required' });
    }

    // 1. Fetch metadata from GitHub
    const githubData = await getRepoDetails(repoUrl);
    
    // 2. Store repository in PostgreSQL
    const dbRecord = await upsertRepository({
      ...githubData,
      repoUrl
    });

    // 3. Store file metadata in PostgreSQL
    await upsertFiles(dbRecord.id, githubData.files);

    // 4. Fetch missing file contents and store them continuously
    let totalContentsStored = 0;
    let batchNumber = 1;
    let remainingFiles = await pool.query('SELECT COUNT(*) FROM files f LEFT JOIN file_contents fc ON f.id = fc.file_id WHERE f.repository_id = $1 AND fc.id IS NULL', [dbRecord.id]).then(res => parseInt(res.rows[0].count, 10));

    while (true) {
      const filesToProcess = await getFilesWithoutContent(dbRecord.id, 250);
      
      if (filesToProcess.length === 0) {
        console.log(`[INGESTION] Complete`);
        break;
      }
      
      console.log(`[INGESTION] Processing batch ${batchNumber}`);
      let contentsStoredThisBatch = 0;
      
      for (const file of filesToProcess) {
        // Mark invalid files as processed with empty content to prevent infinite loop
        if (!VALID_EXTENSIONS.includes(file.file_type)) {
          await upsertFileContent(file.id, "");
          continue;
        }

        try {
          const content = await fetchFileContent(dbRecord.owner, dbRecord.repo, dbRecord.defaultBranch, file.file_path);
          
          if (Buffer.byteLength(content, 'utf8') > 1000000) {
            await upsertFileContent(file.id, "");
            continue;
          }

          const inserted = await upsertFileContent(file.id, content);
          if (inserted) contentsStoredThisBatch++;
        } catch (err) {
          console.error(`Failed to process ${file.file_path}:`, err.message);
          await upsertFileContent(file.id, ""); // Mark as processed even on error
        }
      }
      
      console.log(`[INGESTION] Downloaded ${contentsStoredThisBatch} files`);
      totalContentsStored += contentsStoredThisBatch;
      
      // Update remaining files estimate
      remainingFiles = await pool.query('SELECT COUNT(*) FROM files f LEFT JOIN file_contents fc ON f.id = fc.file_id WHERE f.repository_id = $1 AND fc.id IS NULL', [dbRecord.id]).then(res => parseInt(res.rows[0].count, 10));
      console.log(`[INGESTION] Remaining files ${remainingFiles}`);
      
      batchNumber++;
    }

    try {
      await updateRepositoryStatus(dbRecord.id, 'Chunking');
      await runChunkingPipeline(dbRecord.id);

      await updateRepositoryStatus(dbRecord.id, 'Embedding');
      await runEmbeddingPipeline(dbRecord.id);

      await updateRepositoryStatus(dbRecord.id, 'Indexed');
    } catch (err) {
      console.error("Pipeline error:", err);
      await updateRepositoryStatus(dbRecord.id, 'Failed');
      return res.status(500).json({ error: err.message });
    }

    // 5. Return response
    res.json({
      repositoryId: dbRecord.id,
      filesProcessed: totalContentsStored, // Total real contents downloaded
      contentsStored: totalContentsStored,
      status: 'Indexed'
    });
  } catch (error) {
    console.error("fetchRepo error:", error);
    res.status(400).json({ error: error.message });
  }
};

export const getRepoProgress = async (req, res) => {
  try {
    const { repositoryId } = req.params;

    if (!repositoryId) {
      return res.status(400).json({ error: 'repositoryId is required' });
    }

    const query = `
      SELECT
        status,
        (SELECT COUNT(*) FROM files WHERE repository_id = $1) as total_files,
        (SELECT COUNT(*) FROM file_contents fc JOIN files f ON f.id = fc.file_id WHERE f.repository_id = $1) as contents_stored,
        (SELECT COUNT(*) FROM chunks c JOIN files f ON f.id = c.file_id WHERE f.repository_id = $1) as chunks_created,
        (SELECT COUNT(*) FROM chunk_embeddings ce JOIN chunks c ON ce.chunk_id = c.id JOIN files f ON f.id = c.file_id WHERE f.repository_id = $1) as embeddings_created
      FROM repositories WHERE id = $1
    `;

    const result = await pool.query(query, [repositoryId]);
    const row = result.rows[0];

    res.json({
      repositoryId: parseInt(repositoryId, 10),
      status: row.status,
      totalFiles: parseInt(row.total_files, 10),
      contentsStored: parseInt(row.contents_stored, 10),
      chunksCreated: parseInt(row.chunks_created, 10),
      embeddingsCreated: parseInt(row.embeddings_created, 10)
    });
  } catch (error) {
    console.error("getRepoProgress error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getRepositories = async (req, res) => {
  try {
    const repos = await getAllRepositories();
    res.json(repos);
  } catch (error) {
    console.error("getRepositories error:", error);
    res.status(500).json({ error: error.message });
  }
};
