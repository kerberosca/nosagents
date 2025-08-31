import { prisma } from '../client';
import { KnowledgePack, Document } from '@prisma/client';

export interface CreateKnowledgePackData {
  name: string;
  description?: string;
  path?: string;
  version?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateKnowledgePackData extends Partial<CreateKnowledgePackData> {
  id: string;
}

export interface CreateDocumentData {
  knowledgePackId: string;
  title?: string;
  content: string;
  source: string;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'url';
  metadata?: Record<string, any>;
  isIndexed?: boolean;
}

export interface UpdateDocumentData extends Partial<CreateDocumentData> {
  id: string;
}

export interface KnowledgePackWithDocuments extends KnowledgePack {
  documents: Document[];
  _count: {
    documents: number;
  };
}

export interface DocumentWithPack extends Document {
  knowledgePack: KnowledgePack;
}

export interface KnowledgeSearchParams {
  packId?: string;
  query?: string;
  tags?: string[];
  type?: string;
  limit?: number;
  offset?: number;
}

export class KnowledgeService {
  /**
   * Créer un nouveau pack de connaissances
   */
  async createKnowledgePack(data: CreateKnowledgePackData): Promise<KnowledgePack> {
    return await prisma.knowledgePack.create({
      data: {
        name: data.name,
        description: data.description,
        path: data.path || `./data/knowledge/${data.name}`,
        version: data.version || '1.0.0',
        tags: data.tags || [],
        metadata: data.metadata || {},
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Récupérer un pack par ID
   */
  async getKnowledgePackById(id: string): Promise<KnowledgePackWithDocuments | null> {
    return await prisma.knowledgePack.findUnique({
      where: { id },
      include: {
        documents: true,
        _count: {
          select: { documents: true },
        },
      },
    });
  }

  /**
   * Récupérer un pack par nom
   */
  async getKnowledgePackByName(name: string): Promise<KnowledgePack | null> {
    return await prisma.knowledgePack.findFirst({
      where: { name },
    });
  }

  /**
   * Lister tous les packs actifs
   */
  async getActiveKnowledgePacks(): Promise<KnowledgePackWithDocuments[]> {
    return await prisma.knowledgePack.findMany({
      where: { isActive: true },
      include: {
        documents: true,
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Rechercher des packs de connaissances
   */
  async searchKnowledgePacks(params: KnowledgeSearchParams): Promise<KnowledgePackWithDocuments[]> {
    const where: any = { isActive: true };
    
    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } },
        { tags: { hasSome: [params.query] } },
      ];
    }
    
    if (params.tags && params.tags.length > 0) {
      where.tags = { hasSome: params.tags };
    }

    return await prisma.knowledgePack.findMany({
      where,
      include: {
        documents: true,
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
    });
  }

  /**
   * Mettre à jour un pack
   */
  async updateKnowledgePack(id: string, data: UpdateKnowledgePackData): Promise<KnowledgePack> {
    const { id: _, ...updateData } = data;
    
    return await prisma.knowledgePack.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Supprimer un pack
   */
  async deleteKnowledgePack(id: string): Promise<KnowledgePack> {
    return await prisma.knowledgePack.delete({
      where: { id },
    });
  }

  /**
   * Créer un nouveau document
   */
  async createDocument(data: CreateDocumentData): Promise<Document> {
    return await prisma.document.create({
      data: {
        knowledgePackId: data.knowledgePackId,
        title: data.title || null,
        content: data.content,
        source: data.source,
        type: data.type,
        metadata: data.metadata || {},
        isIndexed: data.isIndexed ?? false,
      },
    });
  }

  /**
   * Récupérer un document par ID
   */
  async getDocumentById(id: string): Promise<DocumentWithPack | null> {
    return await prisma.document.findUnique({
      where: { id },
      include: { knowledgePack: true },
    });
  }

  /**
   * Récupérer tous les documents d'un pack
   */
  async getDocumentsByPack(knowledgePackId: string): Promise<Document[]> {
    return await prisma.document.findMany({
      where: { knowledgePackId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Rechercher dans les documents
   */
  async searchDocuments(params: KnowledgeSearchParams): Promise<DocumentWithPack[]> {
    const where: any = {};
    
    if (params.packId) {
      where.knowledgePackId = params.packId;
    }
    
    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { content: { contains: params.query, mode: 'insensitive' } },
        { metadata: { path: ['$'], string_contains: params.query } },
      ];
    }
    
    if (params.type) {
      where.type = params.type;
    }

    return await prisma.document.findMany({
      where,
      include: { knowledgePack: true },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
    });
  }

  /**
   * Mettre à jour un document
   */
  async updateDocument(id: string, data: UpdateDocumentData): Promise<Document> {
    const { id: _, ...updateData } = data;
    
    return await prisma.document.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Supprimer un document
   */
  async deleteDocument(id: string): Promise<Document> {
    return await prisma.document.delete({
      where: { id },
    });
  }

  /**
   * Marquer un document comme indexé
   */
  async markDocumentAsIndexed(id: string): Promise<Document> {
    return await prisma.document.update({
      where: { id },
      data: { isIndexed: true },
    });
  }

  /**
   * Marquer tous les documents d'un pack comme indexés
   */
  async markPackDocumentsAsIndexed(knowledgePackId: string): Promise<{ count: number }> {
    return await prisma.document.updateMany({
      where: { knowledgePackId },
      data: { isIndexed: true },
    });
  }

  /**
   * Obtenir les statistiques des connaissances
   */
  async getKnowledgeStats(): Promise<{
    totalPacks: number;
    activePacks: number;
    totalDocuments: number;
    indexedDocuments: number;
    byType: Record<string, number>;
    byPack: Array<{ packName: string; documentCount: number }>;
  }> {
    const [
      totalPacks,
      activePacks,
      totalDocuments,
      indexedDocuments,
      byType,
      byPack,
    ] = await Promise.all([
      prisma.knowledgePack.count(),
      prisma.knowledgePack.count({ where: { isActive: true } }),
      prisma.document.count(),
      prisma.document.count({ where: { isIndexed: true } }),
      prisma.document.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.knowledgePack.findMany({
        select: {
          name: true,
          _count: { select: { documents: true } },
        },
        where: { isActive: true },
      }),
    ]);

    const byTypeMap = byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    const byPackMap = byPack.map(pack => ({
      packName: pack.name,
      documentCount: pack._count.documents,
    }));

    return {
      totalPacks,
      activePacks,
      totalDocuments,
      indexedDocuments,
      byType: byTypeMap,
      byPack: byPackMap,
    };
  }

  /**
   * Créer un pack avec des documents
   */
  async createKnowledgePackWithDocuments(
    packData: CreateKnowledgePackData,
    documents: Omit<CreateDocumentData, 'knowledgePackId'>[]
  ): Promise<KnowledgePackWithDocuments> {
    return await prisma.knowledgePack.create({
      data: {
        name: packData.name,
        description: packData.description,
        path: packData.path || `./data/knowledge/${packData.name}`,
        version: packData.version || '1.0.0',
        tags: packData.tags || [],
        metadata: packData.metadata || {},
        isActive: packData.isActive ?? true,
        documents: {
          create: documents,
        },
      },
      include: {
        documents: true,
        _count: {
          select: { documents: true },
        },
      },
    });
  }

  /**
   * Dupliquer un pack de connaissances
   */
  async duplicateKnowledgePack(
    sourcePackId: string,
    newName: string,
    newVersion: string
  ): Promise<KnowledgePackWithDocuments> {
    const sourcePack = await this.getKnowledgePackById(sourcePackId);
    if (!sourcePack) {
      throw new Error(`Pack de connaissances ${sourcePackId} non trouvé`);
    }

    const newPack = await this.createKnowledgePack({
      name: newName,
      description: sourcePack.description || undefined,
      version: newVersion,
      tags: sourcePack.tags || [],
      metadata: sourcePack.metadata as Record<string, any> || {},
    });

    // Dupliquer les documents
    const documents = sourcePack.documents.map(doc => ({
      title: doc.title || undefined,
      content: doc.content,
      source: doc.source,
      type: doc.type as 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'url',
      metadata: doc.metadata as Record<string, any> || {},
      isIndexed: false, // Nouveau pack, pas encore indexé
    }));

    await Promise.all(
      documents.map(doc => this.createDocument({ ...doc, knowledgePackId: newPack.id }))
    );

    return await this.getKnowledgePackById(newPack.id) as KnowledgePackWithDocuments;
  }
}
