import * as fs from 'fs';
import * as path from 'path';
import { DocumentProcessor, DocumentProcessorOptions } from './document-processor';
import { Document, DocumentMetadata } from '../types';

export class TextProcessor extends DocumentProcessor {
  private supportedExtensions = ['.txt', '.md', '.markdown', '.rst', '.html', '.htm'];

  constructor(options: DocumentProcessorOptions = {}) {
    super(options);
  }

  canProcess(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedExtensions.includes(ext);
  }

  async process(filePath: string, metadata?: Partial<DocumentMetadata>): Promise<Document[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(filePath).toLowerCase();
      
      const baseMetadata: Partial<DocumentMetadata> = {
        source: filePath,
        title: metadata?.title || path.basename(filePath, ext),
        language: this.options.language,
        tags: [...(this.options.tags || []), ext.substring(1), ...(metadata?.tags || [])],
        ...metadata,
      };

      // Traitement spécial pour Markdown
      if (ext === '.md' || ext === '.markdown') {
        return this.processMarkdown(content, baseMetadata);
      }

      // Traitement spécial pour HTML
      if (ext === '.html' || ext === '.htm') {
        return this.processHTML(content, baseMetadata);
      }

      // Traitement standard pour les fichiers texte
      return this.processPlainText(content, baseMetadata);
    } catch (error) {
      throw new Error(`Erreur lors du traitement du fichier texte ${filePath}: ${error}`);
    }
  }

  private processMarkdown(content: string, metadata: Partial<DocumentMetadata>): Document[] {
    // Extraction du titre depuis le frontmatter ou la première ligne
    let title = metadata.title;
    let processedContent = content;

    // Vérifier le frontmatter YAML
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/title:\s*(.+)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      processedContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    }

    // Si pas de titre dans le frontmatter, prendre le premier h1
    if (!title) {
      const h1Match = processedContent.match(/^#\s+(.+)$/m);
      if (h1Match) {
        title = h1Match[1].trim();
      }
    }

    const chunks = this.chunkText(processedContent);
    return chunks.map((chunk, index) =>
      this.createDocument(chunk, {
        ...metadata,
        title,
        chunkIndex: index,
        totalChunks: chunks.length,
      })
    );
  }

  private processHTML(content: string, metadata: Partial<DocumentMetadata>): Document[] {
    // Extraction du titre depuis les balises title ou h1
    let title = metadata.title;
    
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        title = h1Match[1].trim();
      }
    }

    // Suppression des balises HTML et extraction du texte
    const textContent = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const chunks = this.chunkText(textContent);
    return chunks.map((chunk, index) =>
      this.createDocument(chunk, {
        ...metadata,
        title,
        chunkIndex: index,
        totalChunks: chunks.length,
      })
    );
  }

  private processPlainText(content: string, metadata: Partial<DocumentMetadata>): Document[] {
    const chunks = this.chunkText(content);
    return chunks.map((chunk, index) =>
      this.createDocument(chunk, {
        ...metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      })
    );
  }
}
