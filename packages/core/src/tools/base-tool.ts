import { z } from 'zod';
import { Tool, AgentContext } from '../types';
import { Logger } from '../utils/logger';

export abstract class BaseTool {
  protected logger: Logger;
  protected schema: z.ZodSchema<any>;

  constructor(
    protected config: Tool,
    schema: z.ZodSchema<any>
  ) {
    this.logger = new Logger(`Tool:${config.name}`);
    this.schema = schema;
  }

  getName(): string {
    return this.config.name;
  }

  getDescription(): string {
    return this.config.description;
  }

  getSecurityConfig() {
    return this.config.security;
  }

  async execute(parameters: any, context: AgentContext): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Exécution de ${this.config.name} avec les paramètres:`, parameters);

      // Valider les paramètres
      const validatedParams = this.schema.parse(parameters);

      // Vérifier les autorisations de sécurité
      await this.checkSecurityPermissions(context);

      // Exécuter l'outil
      const result = await this.executeTool(validatedParams, context);

      const duration = Date.now() - startTime;
      this.logger.info(`${this.config.name} exécuté en ${duration}ms`);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Erreur lors de l'exécution de ${this.config.name}:`, error);
      throw error;
    }
  }

  protected abstract executeTool(parameters: any, context: AgentContext): Promise<any>;

  protected async checkSecurityPermissions(context: AgentContext): Promise<void> {
    const { security } = this.config;

    // Vérifier les autorisations réseau
    if (security.requiresNetwork) {
      // Cette vérification sera faite au niveau de l'agent
      this.logger.debug('Outil nécessite des autorisations réseau');
    }

    // Vérifier les autorisations fichiers
    if (security.requiresFilesystem) {
      // Cette vérification sera faite au niveau de l'agent
      this.logger.debug('Outil nécessite des autorisations fichiers');
    }

    // Vérifier si l'outil est dangereux
    if (security.dangerous) {
      this.logger.warn('Outil dangereux détecté - exécution avec précaution');
    }
  }

  protected validateFilePath(path: string, allowedDirectories: string[]): string {
    const normalizedPath = path.replace(/\\/g, '/');
    
    // Vérifier que le chemin est dans les répertoires autorisés
    const isAllowed = allowedDirectories.some(dir => 
      normalizedPath.startsWith(dir.replace(/\\/g, '/'))
    );

    if (!isAllowed) {
      throw new Error(`Accès refusé au chemin: ${path}`);
    }

    return normalizedPath;
  }

  protected sanitizeInput(input: string): string {
    // Nettoyer les entrées utilisateur pour éviter les injections
    return input
      .replace(/[<>]/g, '') // Supprimer les balises HTML
      .replace(/javascript:/gi, '') // Supprimer les protocoles dangereux
      .trim();
  }
}
