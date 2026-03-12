import { Router } from 'express';
import { listStoryboards, getStoryboard } from '../db/index.js';

export const storyboardRouter = Router();

storyboardRouter.get('/', async (_req, res) => {
  try {
    const storyboards = await listStoryboards();
    res.json(storyboards);
  } catch (err) {
    console.error('[ListStoryboards] Error:', err);
    res.status(500).json({ error: 'Failed to list storyboards' });
  }
});

storyboardRouter.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Invalid storyboard ID' });
    return;
  }
  try {
    const storyboard = await getStoryboard(id);
    if (!storyboard) {
      res.status(404).json({ error: 'Storyboard not found' });
      return;
    }
    res.json(storyboard);
  } catch (err) {
    console.error('[GetStoryboard] Error:', err);
    res.status(500).json({ error: 'Failed to fetch storyboard' });
  }
});
