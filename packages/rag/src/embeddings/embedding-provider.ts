import { EmbeddingResult } from '../types';

export abstract class EmbeddingProvider {
  abstract name: string;
  abstract model: string;
  abstract dimension: number;

  abstract embedText(text: string): Promise<number[] | null>;
  abstract embedTexts(texts: string[]): Promise<EmbeddingResult>;
  
  abstract isAvailable(): Promise<boolean>;
  abstract getModelInfo(): Promise<{ name: string; dimension: number; maxTokens: number }>;
}
