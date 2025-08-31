import { ChunkingOptions } from '../types';

export class Chunker {
  private options: ChunkingOptions;

  constructor(options: ChunkingOptions) {
    this.options = {
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separator: options.separator || '\n',
    };
  }

  chunkText(text: string): string[] {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks: string[] = [];
    const { chunkSize, chunkOverlap, separator } = this.options;

    // Si le texte est plus court que la taille de chunk, le retourner tel quel
    if (text.length <= chunkSize) {
      return [text];
    }

    // Diviser le texte en paragraphes ou sections
    const sections = text.split(separator || '\n').filter(section => section.trim());

    let currentChunk = '';
    let currentLength = 0;

    for (const section of sections) {
      const sectionLength = section.length;

      // Si l'ajout de cette section dépasserait la taille de chunk
      if (currentLength + sectionLength > chunkSize && currentChunk.length > 0) {
        // Ajouter le chunk actuel
        chunks.push(currentChunk.trim());

        // Commencer un nouveau chunk avec le chevauchement
        if (chunkOverlap > 0) {
          const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
          currentChunk = overlapText + separator + section;
          currentLength = overlapText.length + sectionLength;
        } else {
          currentChunk = section;
          currentLength = sectionLength;
        }
      } else {
        // Ajouter la section au chunk actuel
        if (currentChunk.length > 0) {
          currentChunk += separator + section;
          currentLength += sectionLength;
        } else {
          currentChunk = section;
          currentLength = sectionLength;
        }
      }
    }

    // Ajouter le dernier chunk s'il n'est pas vide
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (overlapSize <= 0) return '';

    // Essayer de couper à un point ou une nouvelle ligne dans la zone de chevauchement
    const overlapStart = Math.max(0, text.length - overlapSize);
    const overlapText = text.slice(overlapStart);

    // Chercher le dernier point ou nouvelle ligne dans le texte de chevauchement
    const lastPeriod = overlapText.lastIndexOf('.');
    const lastNewline = overlapText.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastNewline);

    if (cutPoint > overlapSize * 0.3) {
      return overlapText.slice(cutPoint + 1).trim();
    }

    return overlapText.trim();
  }

  chunkBySentences(text: string): string[] {
    // Diviser le texte en phrases
    const sentences = text
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1|')
      .split('|')
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);

    return this.mergeSentencesIntoChunks(sentences);
  }

  chunkByParagraphs(text: string): string[] {
    // Diviser le texte en paragraphes
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0);

    return this.mergeSentencesIntoChunks(paragraphs);
  }

  private mergeSentencesIntoChunks(sentences: string[]): string[] {
    const chunks: string[] = [];
    const { chunkSize, chunkOverlap } = this.options;

    let currentChunk = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());

        // Gérer le chevauchement
        if (chunkOverlap > 0) {
          const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
          currentChunk = overlapText + ' ' + sentence;
          currentLength = overlapText.length + sentenceLength;
        } else {
          currentChunk = sentence;
          currentLength = sentenceLength;
        }
      } else {
        if (currentChunk.length > 0) {
          currentChunk += ' ' + sentence;
          currentLength += sentenceLength;
        } else {
          currentChunk = sentence;
          currentLength = sentenceLength;
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // Méthode pour chunker avec des métadonnées spécifiques (ex: pages PDF)
  chunkWithMetadata(
    text: string,
    metadata: Record<string, any> = {}
  ): Array<{ content: string; metadata: Record<string, any> }> {
    const chunks = this.chunkText(text);
    
    return chunks.map((chunk, index) => ({
      content: chunk,
      metadata: {
        ...metadata,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
    }));
  }
}
