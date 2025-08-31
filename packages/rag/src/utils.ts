import * as fs from 'fs';
import * as path from 'path';
import { Document, DocumentMetadata } from './types';

export class RAGUtils {
  /**
   * Calcule la taille d'un fichier en octets
   */
  static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calcule la taille totale d'un répertoire
   */
  static getDirectorySize(directoryPath: string): number {
    let totalSize = 0;
    
    const processDirectory = (dir: string) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          processDirectory(fullPath);
        } else {
          totalSize += stat.size;
        }
      }
    };

    try {
      processDirectory(directoryPath);
    } catch (error) {
      console.error('Erreur lors du calcul de la taille du répertoire:', error);
    }

    return totalSize;
  }

  /**
   * Formate une taille en octets en format lisible
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Extrait le titre d'un fichier ou d'un document
   */
  static extractTitle(filePath: string, content?: string): string {
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Si on a du contenu, essayer d'extraire un titre
    if (content) {
      // Chercher un titre dans le contenu (première ligne non vide, H1, etc.)
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // Si la première ligne ressemble à un titre (pas trop long, pas de ponctuation excessive)
        if (firstLine.length > 0 && firstLine.length < 100 && !firstLine.includes('.')) {
          return firstLine;
        }
      }
    }
    
    // Sinon, utiliser le nom du fichier
    return fileName.replace(/[-_]/g, ' ');
  }

  /**
   * Nettoie et normalise le texte pour l'indexation
   */
  static normalizeText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul espace
      .replace(/\n\s*\n/g, '\n') // Supprimer les lignes vides multiples
      .trim();
  }

  /**
   * Calcule la similarité cosinus entre deux vecteurs
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Les vecteurs doivent avoir la même dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Génère un résumé d'un document basé sur ses premiers caractères
   */
  static generateSummary(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Essayer de couper à une phrase complète
    const truncated = content.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');
    
    const cutPoint = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (cutPoint > maxLength * 0.7) {
      return truncated.substring(0, cutPoint + 1);
    }

    return truncated + '...';
  }

  /**
   * Valide les métadonnées d'un document
   */
  static validateMetadata(metadata: Partial<DocumentMetadata>): Partial<DocumentMetadata> {
    const validated: Partial<DocumentMetadata> = { ...metadata };

    // S'assurer que les dates sont valides
    if (validated.createdAt && !(validated.createdAt instanceof Date)) {
      validated.createdAt = new Date(validated.createdAt);
    }
    if (validated.updatedAt && !(validated.updatedAt instanceof Date)) {
      validated.updatedAt = new Date(validated.updatedAt);
    }

    // S'assurer que les tags sont un tableau
    if (validated.tags && !Array.isArray(validated.tags)) {
      validated.tags = [validated.tags as string];
    }

    // Normaliser la langue
    if (validated.language) {
      validated.language = validated.language.toLowerCase().substring(0, 2);
    }

    return validated;
  }

  /**
   * Crée un identifiant unique basé sur le contenu et les métadonnées
   */
  static createContentHash(content: string, metadata: Partial<DocumentMetadata>): string {
    const data = JSON.stringify({
      content: content.substring(0, 1000), // Limiter la taille pour la performance
      source: metadata.source,
      title: metadata.title,
      author: metadata.author,
    });

    // Hash simple (pour un vrai projet, utiliser crypto)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir en 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Vérifie si un fichier est accessible et lisible
   */
  static isFileAccessible(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Liste tous les fichiers d'un répertoire avec leurs métadonnées
   */
  static listDirectoryFiles(directoryPath: string): Array<{
    path: string;
    name: string;
    size: number;
    modified: Date;
    isDirectory: boolean;
  }> {
    const files: Array<{
      path: string;
      name: string;
      size: number;
      modified: Date;
      isDirectory: boolean;
    }> = [];

    try {
      const items = fs.readdirSync(directoryPath);
      
      for (const item of items) {
        const fullPath = path.join(directoryPath, item);
        const stat = fs.statSync(fullPath);
        
        files.push({
          path: fullPath,
          name: item,
          size: stat.size,
          modified: stat.mtime,
          isDirectory: stat.isDirectory(),
        });
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du répertoire:', error);
    }

    return files.sort((a, b) => {
      // D'abord les répertoires, puis les fichiers
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }
}
