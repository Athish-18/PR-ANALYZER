import express from 'express';
import { fetchRepo, getRepoProgress, getRepositories } from '../controllers/repo.controller.js';
import { processChunks } from '../controllers/chunk.controller.js';
import { processEmbeddings } from '../controllers/embedding.controller.js';
import { searchRepository, debugSearchRepository } from '../controllers/search.controller.js';
import { askRepository } from '../controllers/rag.controller.js';
import { getConversations, getConversationMessages } from '../controllers/chat.controller.js';
import { reviewDiffController } from '../controllers/review.controller.js';

const router = express.Router();

router.get('/', getRepositories);
router.post('/fetch', fetchRepo);
router.get('/:repositoryId/progress', getRepoProgress);
router.post('/:repositoryId/chunk', processChunks);
router.post('/:repositoryId/embed', processEmbeddings);
router.post('/:repositoryId/search', searchRepository);
router.post('/:repositoryId/debug-search', debugSearchRepository);
router.post('/:repositoryId/ask', askRepository);
router.post('/:repositoryId/review', reviewDiffController);

// Chat & Conversation Routes
router.get('/:repositoryId/conversations', getConversations);
router.get('/:repositoryId/conversations/:conversationId/messages', getConversationMessages);

export default router;
