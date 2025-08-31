import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { DocumentProcessor, DocumentProcessorOptions } from './document-processor';
import { Document, DocumentMetadata } from '../types';

export class PDFProcessor extends DocumentProcessor {
  constructor(options: DocumentProcessorOptions = {}) {
    super(options);
  }

  canProcess(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.pdf';
  }

  async process(filePath: string, metadata?: Partial<DocumentMetadata>): Promise<Document[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      
      const baseMetadata: Partial<DocumentMetadata> = {
        source: filePath,
        title: metadata?.title || path.basename(filePath, '.pdf'),
        author: data.info?.Author || metadata?.author,
        language: this.options.language,
        tags: [...(this.options.tags || []), 'pdf', ...(metadata?.tags || [])],
        ...metadata,
      };

      // Traitement du texte par pages
      const documents: Document[] = [];
      
      if (data.text) {
        const chunks = this.chunkText(data.text);
        
        chunks.forEach((chunk, index) => {
          const doc = this.createDocument(
            chunk,
            {
              ...baseMetadata,
              page: metadata?.page,
              chunkIndex: index,
              totalChunks: chunks.length,
            }
          );
          documents.push(doc);
        });
      }

      return documents;
    } catch (error) {
      throw new Error(`Erreur lors du traitement du PDF ${filePath}: ${error}`);
    }
  }
}
