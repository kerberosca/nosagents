import { prisma } from '../client';
import { SystemLog } from '@prisma/client';

export interface CreateLogData {
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  metadata?: Record<string, any>;
}

export class LogService {
  /**
   * Créer un nouveau log
   */
  async createLog(data: CreateLogData): Promise<SystemLog> {
    return prisma.systemLog.create({
      data: {
        level: data.level,
        category: data.category,
        message: data.message,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Créer un log d'information
   */
  async info(category: string, message: string, metadata?: Record<string, any>): Promise<SystemLog> {
    return this.createLog({
      level: 'info',
      category,
      message,
      metadata,
    });
  }

  /**
   * Créer un log d'avertissement
   */
  async warn(category: string, message: string, metadata?: Record<string, any>): Promise<SystemLog> {
    return this.createLog({
      level: 'warn',
      category,
      message,
      metadata,
    });
  }

  /**
   * Créer un log d'erreur
   */
  async error(category: string, message: string, metadata?: Record<string, any>): Promise<SystemLog> {
    return this.createLog({
      level: 'error',
      category,
      message,
      metadata,
    });
  }

  /**
   * Créer un log de debug
   */
  async debug(category: string, message: string, metadata?: Record<string, any>): Promise<SystemLog> {
    return this.createLog({
      level: 'debug',
      category,
      message,
      metadata,
    });
  }

  /**
   * Récupérer un log par son ID
   */
  async getLogById(id: string): Promise<SystemLog | null> {
    return prisma.systemLog.findUnique({
      where: { id },
    });
  }

  /**
   * Récupérer les logs par niveau
   */
  async getLogsByLevel(level: 'info' | 'warn' | 'error' | 'debug', limit: number = 100): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      where: { level },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupérer les logs par catégorie
   */
  async getLogsByCategory(category: string, limit: number = 100): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupérer les logs récents
   */
  async getRecentLogs(limit: number = 100): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupérer les logs par période
   */
  async getLogsByPeriod(startDate: Date, endDate: Date): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Rechercher des logs
   */
  async searchLogs(query: string, limit: number = 100): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      where: {
        OR: [
          { message: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupérer les logs d'erreur récents
   */
  async getRecentErrors(limit: number = 50): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      where: { level: 'error' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupérer les logs d'avertissement récents
   */
  async getRecentWarnings(limit: number = 50): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      where: { level: 'warn' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Compter les logs par niveau
   */
  async countLogsByLevel(): Promise<Array<{ level: string; count: number }>> {
    const logs = await prisma.systemLog.groupBy({
      by: ['level'],
      _count: {
        id: true,
      },
    });

    return logs.map(log => ({
      level: log.level,
      count: log._count.id,
    }));
  }

  /**
   * Compter les logs par catégorie
   */
  async countLogsByCategory(): Promise<Array<{ category: string; count: number }>> {
    const logs = await prisma.systemLog.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    return logs.map(log => ({
      category: log.category,
      count: log._count.id,
    }));
  }

  /**
   * Compter le nombre total de logs
   */
  async countLogs(): Promise<number> {
    return prisma.systemLog.count();
  }

  /**
   * Compter les logs par période
   */
  async countLogsByPeriod(days: number = 7): Promise<Array<{ date: string; count: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.systemLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Grouper par jour
    const dailyCounts = logs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));
  }

  /**
   * Récupérer les statistiques des logs
   */
  async getLogStats() {
    const totalLogs = await this.countLogs();
    const logsByLevel = await this.countLogsByLevel();
    const logsByCategory = await this.countLogsByCategory();
    const recentErrors = await this.getRecentErrors(10);
    const recentWarnings = await this.getRecentWarnings(10);

    return {
      totalLogs,
      logsByLevel,
      logsByCategory,
      recentErrors: recentErrors.length,
      recentWarnings: recentWarnings.length,
      errorRate: totalLogs > 0 ? (logsByLevel.find(l => l.level === 'error')?.count || 0) / totalLogs * 100 : 0,
    };
  }

  /**
   * Nettoyer les anciens logs (utile pour la maintenance)
   */
  async cleanupOldLogs(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.systemLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Nettoyer les logs de debug (généralement plus anciens)
   */
  async cleanupDebugLogs(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.systemLog.deleteMany({
      where: {
        level: 'debug',
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }

  /**
   * Exporter les logs pour analyse
   */
  async exportLogs(startDate: Date, endDate: Date): Promise<SystemLog[]> {
    return prisma.systemLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
