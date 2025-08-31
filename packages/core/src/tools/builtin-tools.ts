import { z } from 'zod';
import { BaseTool } from './base-tool';
import { Tool } from '@elavira/config';
import * as fs from 'fs/promises';
import * as path from 'path';

// Outil de recherche RAG
export class RagSearchTool extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'rag.search',
      description: 'Recherche dans la base de connaissances RAG',
      parameters: {},
      security: {
        requiresNetwork: false,
        requiresFilesystem: false,
        dangerous: false,
      },
    };

    const schema = z.object({
      query: z.string().min(1),
      k: z.number().min(1).max(20).default(5),
      filters: z.record(z.any()).optional(),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: any): Promise<any> {
    const { query, k, filters } = parameters;
    
    // TODO: Implémenter la recherche RAG réelle
    // Pour l'instant, retourner des résultats simulés
    return {
      results: [
        {
          content: `Résultat simulé pour: ${query}`,
          source: 'document1.pdf',
          page: 1,
          score: 0.95,
        },
        {
          content: `Autre résultat pour: ${query}`,
          source: 'document2.txt',
          page: 1,
          score: 0.87,
        },
      ],
      query,
      totalResults: 2,
    };
  }
}

// Outil de réponse RAG
export class RagAnswerTool extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'rag.answer',
      description: 'Génère une réponse basée sur le contexte RAG',
      parameters: {},
      security: {
        requiresNetwork: false,
        requiresFilesystem: false,
        dangerous: false,
      },
    };

    const schema = z.object({
      query: z.string().min(1),
      contextDocs: z.array(z.any()),
      style: z.string().optional(),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: any): Promise<any> {
    const { query, contextDocs, style } = parameters;
    
    // TODO: Implémenter la génération de réponse RAG réelle
    return {
      answer: `Réponse générée pour: ${query} basée sur ${contextDocs.length} documents`,
      sources: contextDocs.map((doc: any) => doc.source),
      style: style || 'professionnel',
    };
  }
}

// Outil de lecture de fichiers
export class FileReadTool extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'fs.read',
      description: 'Lit le contenu d\'un fichier',
      parameters: {},
      security: {
        requiresNetwork: false,
        requiresFilesystem: true,
        dangerous: false,
      },
    };

    const schema = z.object({
      path: z.string().min(1),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: any): Promise<any> {
    const { path: filePath } = parameters;
    
    // Valider le chemin pour la sécurité
    const allowedDirs = ['./sandbox', './data/knowledge'];
    const validatedPath = this.validateFilePath(filePath, allowedDirs);
    
    try {
      const content = await fs.readFile(validatedPath, 'utf-8');
      return {
        content,
        path: validatedPath,
        size: content.length,
        encoding: 'utf-8',
      };
    } catch (error) {
      throw new Error(`Erreur lors de la lecture du fichier: ${error}`);
    }
  }
}

// Outil d'écriture de fichiers
export class FileWriteTool extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'fs.write',
      description: 'Écrit du contenu dans un fichier',
      parameters: {},
      security: {
        requiresNetwork: false,
        requiresFilesystem: true,
        dangerous: false,
      },
    };

    const schema = z.object({
      path: z.string().min(1),
      content: z.string(),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: any): Promise<any> {
    const { path: filePath, content } = parameters;
    
    // Valider le chemin pour la sécurité (seulement sandbox)
    const allowedDirs = ['./sandbox'];
    const validatedPath = this.validateFilePath(filePath, allowedDirs);
    
    // Nettoyer le contenu
    const sanitizedContent = this.sanitizeInput(content);
    
    try {
      // Créer le répertoire parent si nécessaire
      const dir = path.dirname(validatedPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(validatedPath, sanitizedContent, 'utf-8');
      return {
        success: true,
        path: validatedPath,
        size: sanitizedContent.length,
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'écriture du fichier: ${error}`);
    }
  }
}

// Outil de calcul mathématique
export class MathEvaluateTool extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'math.evaluate',
      description: 'Évalue une expression mathématique',
      parameters: {},
      security: {
        requiresNetwork: false,
        requiresFilesystem: false,
        dangerous: false,
      },
    };

    const schema = z.object({
      expression: z.string().min(1),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: any): Promise<any> {
    const { expression } = parameters;
    
    // Nettoyer l'expression pour la sécurité
    const sanitizedExpression = this.sanitizeMathExpression(expression);
    
    try {
      // Évaluation sécurisée (très basique pour l'exemple)
      const result = this.evaluateMathExpression(sanitizedExpression);
      return {
        expression: sanitizedExpression,
        result,
        type: typeof result,
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'évaluation mathématique: ${error}`);
    }
  }

  private sanitizeMathExpression(expression: string): string {
    // Supprimer les caractères dangereux
    return expression
      .replace(/[^0-9+\-*/()., ]/g, '')
      .trim();
  }

  private evaluateMathExpression(expression: string): number {
    // Évaluation très basique pour la sécurité
    // En production, utiliser une bibliothèque sécurisée
    try {
      // Vérifier que l'expression ne contient que des caractères autorisés
      if (!/^[0-9+\-*/()., ]+$/.test(expression)) {
        throw new Error('Expression non autorisée');
      }
      
      // Évaluation simple (à améliorer)
      return eval(expression);
    } catch (error) {
      throw new Error('Expression mathématique invalide');
    }
  }
}

// Outil de calendrier (factice)
export class CalendarTool extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'calendar.local',
      description: 'Accède au calendrier local',
      parameters: {},
      security: {
        requiresNetwork: false,
        requiresFilesystem: false,
        dangerous: false,
      },
    };

    const schema = z.object({
      action: z.enum(['get_events', 'add_event', 'get_date']),
      date: z.string().optional(),
      event: z.object({
        title: z.string(),
        description: z.string().optional(),
        start: z.string(),
        end: z.string().optional(),
      }).optional(),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: any): Promise<any> {
    const { action, date, event } = parameters;
    
    switch (action) {
      case 'get_date':
        return {
          currentDate: new Date().toISOString(),
          timezone: 'America/Montreal',
        };
        
      case 'get_events':
        return {
          events: [
            {
              title: 'Réunion équipe',
              start: new Date().toISOString(),
              end: new Date(Date.now() + 3600000).toISOString(),
            },
          ],
          date: date || new Date().toISOString(),
        };
        
      case 'add_event':
        if (!event) {
          throw new Error('Événement requis pour add_event');
        }
        return {
          success: true,
          event: {
            ...event,
            id: Math.random().toString(36).substr(2, 9),
          },
        };
        
      default:
        throw new Error(`Action non supportée: ${action}`);
    }
  }
}

// Outil de recherche web (optionnel, désactivé par défaut)
export class WebFetchTool extends BaseTool {
  constructor() {
    const config: Tool = {
      name: 'web.fetch',
      description: 'Récupère du contenu depuis le web',
      parameters: {},
      security: {
        requiresNetwork: true,
        requiresFilesystem: false,
        dangerous: false,
      },
    };

    const schema = z.object({
      url: z.string().url(),
    });

    super(config, schema);
  }

  protected async executeTool(parameters: any, context: any): Promise<any> {
    const { url } = parameters;
    
    // Vérifier les domaines autorisés
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname.endsWith(domain.trim())
    );
    
    if (!isAllowed) {
      throw new Error(`Domaine non autorisé: ${urlObj.hostname}`);
    }
    
    // TODO: Implémenter la récupération web réelle
    return {
      url,
      content: `Contenu simulé de ${url}`,
      status: 200,
      timestamp: new Date().toISOString(),
    };
  }
}

// Fonction pour enregistrer tous les outils intégrés
export function registerBuiltinTools(toolRegistry: any): void {
  const tools = [
    new RagSearchTool(),
    new RagAnswerTool(),
    new FileReadTool(),
    new FileWriteTool(),
    new MathEvaluateTool(),
    new CalendarTool(),
    new WebFetchTool(),
  ];

  tools.forEach(tool => toolRegistry.registerTool(tool));
}
