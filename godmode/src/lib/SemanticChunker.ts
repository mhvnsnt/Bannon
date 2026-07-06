export class SemanticChunker {
  static chunk(content: string): string[] {
    console.log(`[SemanticChunker] Chunking content`);
    return [content];
  }
}
