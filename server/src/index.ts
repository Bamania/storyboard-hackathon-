/**
 * Express server — mounts route modules for script, debate & storyboard APIs.
 */

import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import { scriptRouter, storyboardRouter, debateRouter } from './routes/index.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Mount route modules
app.use('/api', scriptRouter);
app.use('/api/storyboards', storyboardRouter);
app.use('/api/debate', debateRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
