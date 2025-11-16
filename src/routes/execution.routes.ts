import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { AuthenticatedRequest } from '../types';
import { executionService } from '../services/execution.service';

const router = Router();

// Start process instance
router.post(
  '/instances',
  authenticate,
  [body('processKey').notEmpty().withMessage('Process key is required')],
  auditLog('process_instance.started', 'process_instance'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const instance = await executionService.startProcess(req.body, authReq.user!.id);

      res.status(201).json(instance);
    } catch (error) {
      next(error);
    }
  }
);

// Get process instance
router.get(
  '/instances/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const instance = await executionService.getProcessInstance(req.params.id);

      if (!instance) {
        res.status(404).json({ error: 'Process instance not found' });
        return;
      }

      res.json(instance);
    } catch (error) {
      next(error);
    }
  }
);

// List process instances
router.get(
  '/instances',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { processKey, state, limit, offset } = req.query;

      const result = await executionService.listProcessInstances({
        processKey: processKey as string,
        state: state as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// List tasks
router.get(
  '/tasks',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { processInstanceId, assignee, state, limit, offset } = req.query;
      const authReq = req as AuthenticatedRequest;

      const result = await executionService.listTasks({
        processInstanceId: processInstanceId as string,
        assignee: assignee as string || authReq.user!.id,
        state: state as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get task by ID
router.get(
  '/tasks/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await executionService.getTaskById(req.params.id);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

// Assign task
router.post(
  '/tasks/:id/assign',
  authenticate,
  auditLog('task.assigned', 'task'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const task = await executionService.assignTask(req.params.id, authReq.user!.id);

      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

// Complete task
router.post(
  '/tasks/:id/complete',
  authenticate,
  auditLog('task.completed', 'task'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const task = await executionService.completeTask(req.params.id, authReq.user!.id, req.body);

      res.json(task);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
