import express from 'express';
import { PromptQueueEngine } from './promptQueueEngine';
import { memoryVault } from './db';

export const queueRoutes = express.Router();

queueRoutes.get('/history', (req, res) => {
  try {
    const history = memoryVault.prepare(`SELECT queue_id, COUNT(*) as count, MAX(created_at) as created_at FROM prompt_queue GROUP BY queue_id ORDER BY created_at DESC LIMIT 50`).all();
    res.json({ success: true, history });
  } catch (err: any) {
    if (err.message.includes('no such table')) {
       res.json({ success: true, history: [] });
    } else {
       res.status(500).json({ error: err.message });
    }
  }
});

queueRoutes.get('/active', (req, res) => {
  try {
    const { runningQueues } = PromptQueueEngine as any;
    res.json({ success: true, active: runningQueues ? Array.from(runningQueues) : [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

queueRoutes.post('/create', async (req, res) => {
  try {
    const { prompts, options } = req.body;
    const queueId = await PromptQueueEngine.createQueue(prompts, options);
    
    // Automatically trigger execution if options.autoAdvance is mostly true
    PromptQueueEngine.executeQueue(queueId, options);
    
    res.json({ success: true, queueId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

queueRoutes.get('/status/:id', (req, res) => {
  try {
    const queueId = req.params.id;
    const items = memoryVault.prepare(`SELECT * FROM prompt_queue WHERE queue_id = ? ORDER BY position ASC`).all(queueId);
    
    const { runningQueues, pausedQueues } = PromptQueueEngine as any;
    const state = runningQueues?.has(queueId) ? 'RUNNING' : pausedQueues?.has(queueId) ? 'PAUSED' : 'IDLE';

    res.json({ success: true, status: { id: queueId, state, items } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

queueRoutes.post('/execute', async (req, res) => {
  try {
    const { queueId } = req.body;
    PromptQueueEngine.resumeQueue(queueId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

queueRoutes.post('/pause', (req, res) => {
  try {
    const { queueId } = req.body;
    PromptQueueEngine.pauseQueue(queueId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

queueRoutes.post('/resume', (req, res) => {
  try {
    const { queueId } = req.body;
    PromptQueueEngine.resumeQueue(queueId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

queueRoutes.post('/skip', (req, res) => {
  try {
    const { queueId, position } = req.body;
    PromptQueueEngine.skipPrompt(queueId, position);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

queueRoutes.post('/retry', (req, res) => {
  try {
    const { queueId, position } = req.body;
    PromptQueueEngine.retryPrompt(queueId, position);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
