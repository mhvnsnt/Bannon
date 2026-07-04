import express from 'express';
import { QuantumFileEngine } from './quantumFileEngine';
import { QuantumContextManager } from './quantumContextManager';
import { memoryVault } from './db';
import { ModelRouter } from './modelRouter';

export const quantumRoutes = express.Router();
const modelRouter = new ModelRouter();

quantumRoutes.post('/upload', (req, res) => {
  try {
    const { filename, content } = req.body;
    const fileId = QuantumFileEngine.storeFile(filename, content, 'Initial Upload');
    res.json({ success: true, fileId, filename, versionNumber: 1, tokenCount: Math.ceil(content.length / 4) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

quantumRoutes.get('/file/:fileId', (req, res) => {
  try {
    const current = QuantumFileEngine.getCurrentFile(req.params.fileId);
    if (!current) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, content: current.content, filename: current.filename, version_number: current.version_number });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

quantumRoutes.get('/versions/:fileId', (req, res) => {
  try {
    const versions = QuantumFileEngine.getVersionHistory(req.params.fileId);
    res.json({ success: true, versions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

quantumRoutes.get('/session/:sessionId/:fileId', (req, res) => {
  try {
    const session = QuantumContextManager.getSession(req.params.sessionId, req.params.fileId);
    res.json({ success: true, messages: session.messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

quantumRoutes.post('/rollback', (req, res) => {
  try {
    const { fileId, versionNumber } = req.body;
    const content = QuantumFileEngine.getVersion(fileId, versionNumber);
    if (!content) return res.status(404).json({ error: 'Version not found' });
    
    const original = QuantumFileEngine.getCurrentFile(fileId);
    const newId = QuantumFileEngine.storeFile(original ? original.filename : 'unknown', content, 'Rollback to v' + versionNumber, fileId);
    
    res.json({ success: true, currentVersionNumber: versionNumber });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

quantumRoutes.get('/pending/:sessionId', (req, res) => {
  res.json({ success: true, pending: [] });
});

quantumRoutes.post('/resolve', (req, res) => {
  res.json({ success: true });
});

quantumRoutes.post('/config', (req, res) => {
  res.json({ success: true });
});

quantumRoutes.post('/message', async (req, res) => {
  try {
    const { sessionId, fileId, message, directiveContext, useRazor, taskIntent } = req.body;
    
    QuantumContextManager.saveMessage(sessionId, fileId, 'user', message);
    
    const { prompt, tokenCount, razorMap } = await QuantumContextManager.buildPrompt(sessionId, fileId, message, taskIntent, useRazor);
    
    // Attempt actual model routing depending on available routes
    const aiResponseText = await modelRouter.route({
      prompt: prompt,
      taskType: 'CODE_EDIT',
      context: { razorMap }
    });

    QuantumContextManager.saveMessage(sessionId, fileId, 'assistant', aiResponseText);

    let fileUpdated = false;
    let newVersionNumber = 0;
    let diffPayload = '';

    // If there is DIFF output
    if (aiResponseText.includes('<<<<<<< SEARCH')) {
      const parts = aiResponseText.split(/<<<<<<< SEARCH|>>>>>>>/);
      diffPayload = aiResponseText; // pass Raw diff
      const newFileId = QuantumFileEngine.applyDiff(fileId, diffPayload, message.slice(0, 50));
      if (newFileId) {
        fileUpdated = true;
        const current = QuantumFileEngine.getCurrentFile(newFileId);
        newVersionNumber = current ? current.version_number : 0;
      }
    } else if (aiResponseText.includes('<!DOCTYPE html>') || aiResponseText.includes('export function')) {
      // Crude full file extraction for small files
      const match = aiResponseText.match(/```[a-z]*([\s\S]*?)```/);
      let content = match ? match[1].trim() : aiResponseText.trim();
      const current = QuantumFileEngine.getCurrentFile(fileId);
      if (current) {
        QuantumFileEngine.storeFile(current.filename, content, 'Full rewrite: ' + message.slice(0, 30), fileId);
        fileUpdated = true;
        newVersionNumber = current.version_number + 1;
      }
    }

    res.json({ 
      success: true, 
      fileId, 
      reply: aiResponseText, 
      fileUpdated, 
      newVersionNumber, 
      diffPayload,
      compressionStatus: 'STANDARD'
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
