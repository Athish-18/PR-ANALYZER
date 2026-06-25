import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';

import repoRoutes from './routes/repo.routes.js';

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/repos', repoRoutes);

export default app;
