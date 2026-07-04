import { Pinecone } from '@pinecone-database/pinecone';

export function getNexusMemory() {
    if (!process.env.PINECONE_API_KEY) return null;
    return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
}
