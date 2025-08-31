import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { DocumentProcessor, DocumentProcessorOptions } from './document-processor';
import { Document, DocumentMetadata } from '../types';

export class DOCXProcessor extends DocumentProcessor {
  constructor(options: DocumentProcessorOptions = {}) {
    super(options);
  }

  canProcess(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.docx';
  }

  async process(filePath: string, metadata?: Partial<DocumentMetadata>): Promise<Document[]> {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages.length > 0) {
        console.warn(`Avertissements lors du traitement du DOCX ${filePath}:`, result.messages);
      }

      const baseMetadata: Partial<DocumentMetadata> = {
        source: filePath,
        title: metadata?.title || path.basename(filePath, '.docx'),
        language: this.options.language,
        tags: [...(this.options.tags || []), 'docx', ...(metadata?.tags || [])],
        ...metadata,
      };

      if (!result.value) {
        throw new Error('Impossible d\'extraire le texte du fichier DOCX');
      }

      const chunks = this.chunkText(result.value);
      return chunks.map((chunk, index) =>
        this.createDocument(chunk, {
          ...baseMetadata,
          chunkIndex: index,
          totalChunks: chunks.length,
        })
      );
    } catch (error) {
      throw new Error(`Erreur lors du traitement du DOCX ${filePath}: ${error}`);
    }
  }
}
