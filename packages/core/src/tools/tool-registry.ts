import { Tool } from '@elavira/config';
import { BaseTool } from './base-tool';
import { Logger } from '../utils/logger';

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ToolRegistry');
  }

  registerTool(tool: BaseTool): void {
    const toolName = tool.getName();
    
    if (this.tools.has(toolName)) {
      this.logger.warn(`Outil ${toolName} déjà enregistré, remplacement en cours`);
    }

    this.tools.set(toolName, tool);
    this.logger.info(`Outil ${toolName} enregistré`);
  }

  getTool(toolName: string): BaseTool | undefined {
    return this.tools.get(toolName);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getToolConfig(toolName: string): Tool | undefined {
    const tool = this.getTool(toolName);
    return tool ? {
      name: tool.getName(),
      description: tool.getDescription(),
      parameters: {}, // À implémenter selon les besoins
      security: tool.getSecurityConfig(),
    } : undefined;
  }

  listAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  async executeTool(
    toolName: string,
    parameters: any,
    context: any
  ): Promise<any> {
    const tool = this.getTool(toolName);
    
    if (!tool) {
      throw new Error(`Outil ${toolName} non trouvé`);
    }

    return await tool.execute(parameters, context);
  }

  removeTool(toolName: string): boolean {
    const removed = this.tools.delete(toolName);
    if (removed) {
      this.logger.info(`Outil ${toolName} supprimé`);
    }
    return removed;
  }

  getToolStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [toolName, tool] of this.tools) {
      const security = tool.getSecurityConfig();
      stats[toolName] = {
        description: tool.getDescription(),
        requiresNetwork: security.requiresNetwork,
        requiresFilesystem: security.requiresFilesystem,
        dangerous: security.dangerous,
      };
    }

    return stats;
  }

  validateToolPermissions(toolName: string, agentPermissions: any): boolean {
    const tool = this.getTool(toolName);
    if (!tool) return false;

    const security = tool.getSecurityConfig();

    // Vérifier les autorisations réseau
    if (security.requiresNetwork && !agentPermissions.network) {
      return false;
    }

    // Vérifier les autorisations fichiers
    if (security.requiresFilesystem && !agentPermissions.filesystem) {
      return false;
    }

    return true;
  }
}
