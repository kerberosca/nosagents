import { Router, Request, Response } from 'express';
import { RAGService } from '../services/rag-service';
import { JobQueueService } from '../services/job-queue';
import { JobType, IJobQueueService } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import * as path from 'path';

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier les extensions autorisées
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md', '.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  }
});

export function createRAGRouter(
  ragService: RAGService,
  jobQueueService: IJobQueueService
): Router {
  const router = Router();

  // POST /rag/index/file - Indexer un fichier
  router.post('/index/file', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
        });
      }

      const { knowledgePackId, metadata } = req.body;
      const filePath = req.file.path;

      const jobId = uuidv4();
      const jobData = {
        filePath,
        knowledgePackId,
        metadata: metadata ? JSON.parse(metadata) : {},
      };

      // Ajouter le job à la queue
      await jobQueueService.addJob({
        id: jobId,
        type: JobType.RAG_INDEXING,
        data: jobData,
      });

      logger.info('RAG indexing job created:', { jobId, filePath });

      res.status(202).json({
        success: true,
        jobId,
        message: 'RAG indexing job created',
        file: {
          originalName: req.file.originalname,
          path: filePath,
          size: req.file.size,
        },
      });
    } catch (error) {
      logger.error('Failed to create RAG indexing job:', error);
      res.status(500).json({
        error: 'Failed to create RAG indexing job',
        message: (error as Error).message,
      });
    }
  });

  // POST /rag/index/directory - Indexer un répertoire
  router.post('/index/directory', async (req: Request, res: Response) => {
    try {
      const { directoryPath, knowledgePackId, metadata } = req.body;

      if (!directoryPath) {
        return res.status(400).json({
          error: 'Directory path is required',
        });
      }

      const jobId = uuidv4();
      const jobData = {
        directoryPath,
        knowledgePackId,
        metadata,
      };

      // Ajouter le job à la queue
      await jobQueueService.addJob({
        id: jobId,
        type: JobType.RAG_INDEXING,
        data: jobData,
      });

      logger.info('RAG directory indexing job created:', { jobId, directoryPath });

      res.status(202).json({
        success: true,
        jobId,
        message: 'RAG directory indexing job created',
      });
    } catch (error) {
      logger.error('Failed to create RAG directory indexing job:', error);
      res.status(500).json({
        error: 'Failed to create RAG directory indexing job',
        message: (error as Error).message,
      });
    }
  });

  // POST /rag/search - Rechercher dans les documents
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const { query, filters, k } = req.body;

      if (!query) {
        return res.status(400).json({
          error: 'Query is required',
        });
      }

      const result = await ragService.search(query, filters, k || 10);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Failed to perform RAG search:', error);
      res.status(500).json({
        error: 'Failed to perform RAG search',
        message: (error as Error).message,
      });
    }
  });

  // GET /rag/stats - Obtenir les statistiques du RAG
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await ragService.getStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Failed to get RAG stats:', error);
      res.status(500).json({
        error: 'Failed to get RAG stats',
        message: (error as Error).message,
      });
    }
  });

  // GET /rag/extensions - Obtenir les extensions supportées
  router.get('/extensions', async (req: Request, res: Response) => {
    try {
      const extensions = ragService.getSupportedExtensions();

      res.json({
        success: true,
        extensions,
      });
    } catch (error) {
      logger.error('Failed to get supported extensions:', error);
      res.status(500).json({
        error: 'Failed to get supported extensions',
        message: (error as Error).message,
      });
    }
  });

  // DELETE /rag/documents - Supprimer des documents
  router.delete('/documents', async (req: Request, res: Response) => {
    try {
      const { documentIds } = req.body;

      if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({
          error: 'Document IDs array is required',
        });
      }

      const result = await ragService.deleteDocuments(documentIds);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Failed to delete documents:', error);
      res.status(500).json({
        error: 'Failed to delete documents',
        message: (error as Error).message,
      });
    }
  });

  // DELETE /rag/clear - Vider l'index
  router.delete('/clear', async (req: Request, res: Response) => {
    try {
      const result = await ragService.clearIndex();

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Failed to clear RAG index:', error);
      res.status(500).json({
        error: 'Failed to clear RAG index',
        message: (error as Error).message,
      });
    }
  });

  return router;
}
