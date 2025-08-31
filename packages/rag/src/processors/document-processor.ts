import { Document, DocumentMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentProcessorOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  language?: string;
  tags?: string[];
}

export abstract class DocumentProcessor {
  protected options: DocumentProcessorOptions;

  constructor(options: DocumentProcessorOptions = {}) {
    this.options = {
      chunkSize: 1000,
      chunkOverlap: 200,
      language: 'fr',
      tags: [],
      ...options,
    };
  }

  abstract canProcess(filePath: string): boolean;
  abstract process(filePath: string, metadata?: Partial<DocumentMetadata>): Promise<Document[]>;

  protected createDocument(
    content: string,
    metadata: Partial<DocumentMetadata>,
    chunkIndex?: number,
    totalChunks?: number
  ): Document {
    const now = new Date();
    return {
      id: uuidv4(),
      content,
      metadata: {
        source: metadata.source || '',
        title: metadata.title,
        author: metadata.author,
        page: metadata.page,
        chunkIndex,
        totalChunks,
        language: this.options.language,
        tags: [...(this.options.tags || []), ...(metadata.tags || [])],
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  protected chunkText(text: string): string[] {
    const chunks: string[] = [];
    const { chunkSize, chunkOverlap } = this.options;

    if (!chunkSize) return [text];

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);

      // Essayer de couper à un point ou une nouvelle ligne
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const cutPoint = Math.max(lastPeriod, lastNewline);
        
        if (cutPoint > start + chunkSize * 0.7) {
          chunk = chunk.slice(0, cutPoint + 1);
          start = start + cutPoint + 1;
        } else {
          start = end - (chunkOverlap || 0);
        }
      } else {
        start = end;
      }

      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }
}
