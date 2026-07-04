import express from 'express';
import fs from 'fs';
import path from 'path';

export const workspaceFS = express.Router();

workspaceFS.get('/tree', (req, res) => {
  try {
    const rootDir = process.cwd();
    const excludeList = ['node_modules', '.git', 'dist', '.cache', 'coverage'];
    
    function buildTree(dir: string, currentPath: string = ''): any[] {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      let arr = [];
      for (const entry of entries) {
        if (excludeList.includes(entry.name)) continue;
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          arr.push({
            name: entry.name,
            type: 'directory',
            path: relativePath,
            children: buildTree(fullPath, relativePath)
          });
        } else {
          arr.push({
            name: entry.name,
            type: 'file',
            path: relativePath
          });
        }
      }
      // sort dirs first
      return arr.sort((a,b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
      });
    }
    
    const tree = buildTree(rootDir);
    res.json({ success: true, tree });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workspaceFS.get('/file', (req, res) => {
  try {
    const { p } = req.query;
    if (!p || typeof p !== 'string') return res.status(400).json({ error: 'Missing path' });
    
    // MAXIMUM FILE SAFEGUARD: Prevents path traversal and illegal characters
    if (p.includes('..') || p.includes('\\')) {
       return res.status(403).json({ error: 'CRITICAL SECURITY: Invalid path structure detected.' });
    }
    
    const safePath = path.normalize(p).replace(/^(\.\.[\/\\])+/, '');
    const absolutePath = path.join(process.cwd(), safePath);
    
    if (!absolutePath.startsWith(process.cwd())) {
       return res.status(403).json({ error: 'CRITICAL SECURITY: Path traversal blocked.' });
    }
    
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(absolutePath, 'utf8');
    res.json({ success: true, content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

workspaceFS.post('/save', (req, res) => {
  try {
    const { p, content } = req.body;
    if (!p || typeof p !== 'string') return res.status(400).json({ error: 'Missing path' });
    
    // MAXIMUM FILE SAFEGUARD: Prevent any chance of overwriting core config or traversing out.
    if (p.includes('..') || p.includes('\\') || p === 'package.json' || p === 'server.ts') {
       return res.status(403).json({ error: 'CRITICAL SECURITY: Path format or core file mutation rejected by safeguard protocol.' });
    }
    
    const safePath = path.normalize(p).replace(/^(\.\.[\/\\])+/, '');
    const absolutePath = path.join(process.cwd(), safePath);
    
    if (!absolutePath.startsWith(process.cwd())) {
       return res.status(403).json({ error: 'CRITICAL SECURITY: Path traversal blocked.' });
    }
    
    // Create directory if it doesn't exist
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(absolutePath, content, 'utf8');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
