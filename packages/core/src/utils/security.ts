import { Logger } from './logger';

export class SecurityManager {
  private logger: Logger;
  private allowedDomains: string[];
  private allowNetwork: boolean;

  constructor() {
    this.logger = new Logger('SecurityManager');
    this.allowedDomains = process.env.ALLOWED_DOMAINS?.split(',').map(d => d.trim()) || [];
    this.allowNetwork = process.env.ALLOW_NETWORK === 'true';
  }

  canAccessNetwork(): boolean {
    return this.allowNetwork;
  }

  canAccessDomain(domain: string): boolean {
    if (!this.allowNetwork) {
      return false;
    }

    return this.allowedDomains.some(allowed => 
      domain.endsWith(allowed) || domain === allowed
    );
  }

  canAccessFileSystem(): boolean {
    return true; // Par défaut autorisé, contrôlé au niveau des agents
  }

  validateFilePath(path: string, allowedDirectories: string[]): boolean {
    const normalizedPath = path.replace(/\\/g, '/');
    
    return allowedDirectories.some(dir => 
      normalizedPath.startsWith(dir.replace(/\\/g, '/'))
    );
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Supprimer les balises HTML
      .replace(/javascript:/gi, '') // Supprimer les protocoles dangereux
      .replace(/data:/gi, '') // Supprimer les protocoles data
      .trim();
  }

  validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.canAccessDomain(urlObj.hostname);
    } catch {
      return false;
    }
  }

  logSecurityEvent(event: string, details: any): void {
    this.logger.warn(`Événement de sécurité: ${event}`, details);
  }
}
