import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// This script chunks the codebase and uploads to Supabase pgvector
// Run this via tsx: npx tsx src/scripts/vector-indexer.ts

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in environment. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Dummy function for getting embeddings. Replace with actual API call to OpenAI or your Ollama endpoint
async function getEmbedding(text: string): Promise<number[]> {
  // Example: Hit your local Ollama or OpenAI for embeddings
  // const res = await fetch('http://localhost:11434/api/embeddings', { ... })
  return Array(1536).fill(0).map(() => Math.random()); 
}

function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks = [];
  let currentChunk = '';
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentChunk.length + line.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

async function indexFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const chunks = chunkText(content);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await getEmbedding(chunk);
    
    const { error } = await supabase.from('bannon_codebase').insert({
      file_path: filePath,
      content: chunk,
      embedding: embedding,
      metadata: { chunk_index: i, total_chunks: chunks.length }
    });
    
    if (error) {
      console.error(`Error inserting chunk for ${filePath}:`, error);
    } else {
      console.log(`Indexed ${filePath} chunk ${i + 1}/${chunks.length}`);
    }
  }
}

async function run() {
  console.log("Starting vector indexing...");
  // Example: Indexing a specific file (e.g. the BANNON engine file or server entry point)
  const targetFile = path.resolve(__dirname, '../../server.ts'); 
  if (fs.existsSync(targetFile)) {
    await indexFile(targetFile);
  } else {
    console.warn(`Target file ${targetFile} not found.`);
  }
  console.log("Indexing complete.");
}

run().catch(console.error);
