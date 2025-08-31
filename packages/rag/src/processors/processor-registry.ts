import { DocumentProcessor, DocumentProcessorOptions } from './document-processor';
import { PDFProcessor } from './pdf-processor';
import { TextProcessor } from './text-processor';
import { DOCXProcessor } from './docx-processor';
import { Document, DocumentMetadata } from '../types';

export class ProcessorRegistry {
  private processors: DocumentProcessor[] = [];

  constructor(options: DocumentProcessorOptions = {}) {
    // Enregistrer les processeurs par défaut
    this.register(new PDFProcessor(options));
    this.register(new TextProcessor(options));
    this.register(new DOCXProcessor(options));
  }

  register(processor: DocumentProcessor): void {
    this.processors.push(processor);
  }

  getProcessor(filePath: string): DocumentProcessor | null {
    return this.processors.find(processor => processor.canProcess(filePath)) || null;
  }

  async processFile(filePath: string, metadata?: Partial<DocumentMetadata>): Promise<Document[]> {
    const processor = this.getProcessor(filePath);
    if (!processor) {
      throw new Error(`Aucun processeur disponible pour le fichier: ${filePath}`);
    }

    return processor.process(filePath, metadata);
  }

  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    
    // Simuler les extensions supportées pour chaque processeur
    extensions.add('.pdf'); // PDFProcessor
    extensions.add('.txt'); // TextProcessor
    extensions.add('.md'); // TextProcessor
    extensions.add('.markdown'); // TextProcessor
    extensions.add('.rst'); // TextProcessor
    extensions.add('.html'); // TextProcessor
    extensions.add('.htm'); // TextProcessor
    extensions.add('.docx'); // DOCXProcessor

    return Array.from(extensions).sort();
  }

  listProcessors(): { name: string; extensions: string[] }[] {
    return [
      { name: 'PDF', extensions: ['.pdf'] },
      { name: 'DOCX', extensions: ['.docx'] },
      { name: 'Text', extensions: ['.txt', '.md', '.markdown', '.rst', '.html', '.htm'] },
    ];
  }
}
