import { Router, Request, Response } from 'express';
import { JobQueueService } from '../services/job-queue';
import { JobType, JobRequest } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export function createJobsRouter(jobQueueService: JobQueueService): Router {
  const router = Router();

  // POST /jobs - Créer un nouveau job
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { type, data, priority, timeout, retries } = req.body;

      if (!type || !Object.values(JobType).includes(type)) {
        return res.status(400).json({
          error: 'Invalid job type',
          validTypes: Object.values(JobType),
        });
      }

      if (!data) {
        return res.status(400).json({
          error: 'Job data is required',
        });
      }

      const jobRequest: JobRequest = {
        id: uuidv4(),
        type: type as JobType,
        data,
        priority,
        timeout,
        retries,
      };

      const jobId = await jobQueueService.addJob(jobRequest);

      logger.info('Job created:', { jobId, type });

      res.status(201).json({
        success: true,
        jobId,
        message: 'Job created successfully',
      });
    } catch (error) {
      logger.error('Failed to create job:', error);
      res.status(500).json({
        error: 'Failed to create job',
        message: (error as Error).message,
      });
    }
  });

  // GET /jobs/:type/:id - Obtenir les détails d'un job
  router.get('/:type/:id', async (req: Request, res: Response) => {
    try {
      const { type, id } = req.params;

      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          error: 'Invalid job type',
          validTypes: Object.values(JobType),
        });
      }

      const job = await jobQueueService.getJob(type as JobType, id);

      if (!job) {
        return res.status(404).json({
          error: 'Job not found',
        });
      }

      res.json({
        success: true,
        job,
      });
    } catch (error) {
      logger.error('Failed to get job:', error);
      res.status(500).json({
        error: 'Failed to get job',
        message: (error as Error).message,
      });
    }
  });

  // DELETE /jobs/:type/:id - Annuler un job
  router.delete('/:type/:id', async (req: Request, res: Response) => {
    try {
      const { type, id } = req.params;

      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          error: 'Invalid job type',
          validTypes: Object.values(JobType),
        });
      }

      const cancelled = await jobQueueService.cancelJob(type as JobType, id);

      if (!cancelled) {
        return res.status(404).json({
          error: 'Job not found',
        });
      }

      logger.info('Job cancelled:', { jobId: id, type });

      res.json({
        success: true,
        message: 'Job cancelled successfully',
      });
    } catch (error) {
      logger.error('Failed to cancel job:', error);
      res.status(500).json({
        error: 'Failed to cancel job',
        message: (error as Error).message,
      });
    }
  });

  // GET /jobs/stats - Obtenir les statistiques des queues
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await jobQueueService.getAllStats();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Failed to get job stats:', error);
      res.status(500).json({
        error: 'Failed to get job stats',
        message: (error as Error).message,
      });
    }
  });

  // GET /jobs/stats/:type - Obtenir les statistiques d'une queue spécifique
  router.get('/stats/:type', async (req: Request, res: Response) => {
    try {
      const { type } = req.params;

      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          error: 'Invalid job type',
          validTypes: Object.values(JobType),
        });
      }

      const stats = await jobQueueService.getQueueStats(type as JobType);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      res.status(500).json({
        error: 'Failed to get queue stats',
        message: (error as Error).message,
      });
    }
  });

  return router;
}
