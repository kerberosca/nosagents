import { PrismaClient } from '@prisma/client'

export interface SystemConfigData {
  ollama: {
    baseUrl: string
    defaultModel: string
    embedModel: string
    timeout: number
    maxTokens: number
    temperature: number
  }
  database: {
    postgresUrl: string
    redisUrl: string
    connectionPool: number
    timeout: number
  }
  security: {
    allowNetwork: boolean
    allowedDomains: string[]
    sandboxDir: string
    maxFileSize: number
    enableAudit: boolean
  }
  performance: {
    chunkSize: number
    chunkOverlap: number
    batchSize: number
    maxConcurrentJobs: number
    jobTimeout: number
    chatTimeout: number
    enableRateLimit: boolean
    rateLimitWindow: number
    rateLimitMax: number
  }
  logging: {
    level: string
    enableFileLogging: boolean
    logDir: string
    maxLogSize: number
    maxLogFiles: number
    enableDebug: boolean
  }
}

export class SystemConfigService {
  private prisma: PrismaClient
  private configCache: SystemConfigData | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 30000 // 30 seconds

  constructor() {
    this.prisma = new PrismaClient()
  }

  /**
   * Récupère la configuration système depuis la base de données
   */
  async getSystemConfig(): Promise<SystemConfigData> {
    // Vérifier le cache
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache
    }

    try {
      let config = await this.prisma.systemConfig.findUnique({
        where: { id: 'system' }
      })

      // Si aucune configuration n'existe, créer une configuration par défaut
      if (!config) {
        config = await this.createDefaultConfig()
      }

      // Parser la configuration JSON
      const systemConfig: SystemConfigData = {
        ollama: config.ollama as any,
        database: config.database as any,
        security: config.security as any,
        performance: config.performance as any,
        logging: config.logging as any
      }

      // Mettre en cache
      this.configCache = systemConfig
      this.cacheExpiry = Date.now() + this.CACHE_DURATION

      return systemConfig
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration système:', error)
      throw new Error('Impossible de récupérer la configuration système')
    }
  }

  /**
   * Met à jour la configuration système
   */
  async updateSystemConfig(updates: Partial<SystemConfigData>): Promise<SystemConfigData> {
    try {
      // Récupérer la configuration actuelle
      const currentConfig = await this.getSystemConfig()

      // Fusionner avec les mises à jour
      const updatedConfig: SystemConfigData = {
        ollama: { ...currentConfig.ollama, ...updates.ollama },
        database: { ...currentConfig.database, ...updates.database },
        security: { ...currentConfig.security, ...updates.security },
        performance: { ...currentConfig.performance, ...updates.performance },
        logging: { ...currentConfig.logging, ...updates.logging }
      }

      // Sauvegarder en base
      await this.prisma.systemConfig.upsert({
        where: { id: 'system' },
        update: {
          ollama: updatedConfig.ollama,
          database: updatedConfig.database,
          security: updatedConfig.security,
          performance: updatedConfig.performance,
          logging: updatedConfig.logging,
          updatedAt: new Date()
        },
        create: {
          id: 'system',
          ollama: updatedConfig.ollama,
          database: updatedConfig.database,
          security: updatedConfig.security,
          performance: updatedConfig.performance,
          logging: updatedConfig.logging
        }
      })

      // Invalider le cache
      this.configCache = null

      console.log('Configuration système mise à jour avec succès')
      return updatedConfig
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration système:', error)
      throw new Error('Impossible de mettre à jour la configuration système')
    }
  }

  /**
   * Récupère une section spécifique de la configuration
   */
  async getConfigSection<T extends keyof SystemConfigData>(section: T): Promise<SystemConfigData[T]> {
    const config = await this.getSystemConfig()
    return config[section]
  }

  /**
   * Met à jour une section spécifique de la configuration
   */
  async updateConfigSection<T extends keyof SystemConfigData>(
    section: T, 
    updates: Partial<SystemConfigData[T]>
  ): Promise<SystemConfigData[T]> {
    const currentConfig = await this.getSystemConfig()
    const updatedSection = { ...currentConfig[section], ...updates }
    
    await this.updateSystemConfig({ [section]: updatedSection } as Partial<SystemConfigData>)
    return updatedSection
  }

  /**
   * Crée une configuration par défaut
   */
  private async createDefaultConfig() {
    const defaultConfig: SystemConfigData = {
      ollama: {
        baseUrl: 'http://localhost:11434',
        defaultModel: 'qwen2.5:7b',
        embedModel: 'nomic-embed-text',
        timeout: 30000,
        maxTokens: 4096,
        temperature: 0.7
      },
      database: {
        postgresUrl: 'postgresql://elavira:password@localhost:5432/elavira',
        redisUrl: 'redis://localhost:6379',
        connectionPool: 10,
        timeout: 5000
      },
      security: {
        allowNetwork: false,
        allowedDomains: ['example.com', 'quebec.ca'],
        sandboxDir: './sandbox',
        maxFileSize: 50 * 1024 * 1024, // 50MB
        enableAudit: true
      },
      performance: {
        chunkSize: 1000,
        chunkOverlap: 200,
        batchSize: 10,
        maxConcurrentJobs: 5,
        jobTimeout: 300000, // 5 minutes
        chatTimeout: 120000, // 2 minutes
        enableRateLimit: true,
        rateLimitWindow: 900000, // 15 minutes
        rateLimitMax: 100
      },
      logging: {
        level: 'info',
        enableFileLogging: true,
        logDir: './logs',
        maxLogSize: 10 * 1024 * 1024, // 10MB
        maxLogFiles: 5,
        enableDebug: false
      }
    }

    return await this.prisma.systemConfig.create({
      data: {
        id: 'system',
        ollama: defaultConfig.ollama,
        database: defaultConfig.database,
        security: defaultConfig.security,
        performance: defaultConfig.performance,
        logging: defaultConfig.logging
      }
    })
  }

  /**
   * Invalide le cache de configuration
   */
  invalidateCache(): void {
    this.configCache = null
    this.cacheExpiry = 0
  }

  /**
   * Ferme la connexion Prisma
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Instance singleton
export const systemConfigService = new SystemConfigService()
