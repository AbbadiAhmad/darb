import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { AuthenticatedRequest } from '../types';
import { processService } from '../services/process.service';

const router = Router();

// Validation middleware
const createProcessValidation = [
  body('name').trim().notEmpty().withMessage('Process name is required'),
  body('key').trim().notEmpty().withMessage('Process key is required'),
  body('bpmnXml').notEmpty().withMessage('BPMN XML is required'),
];

// Create process definition
router.post(
  '/',
  authenticate,
  authorize('ProcessDesigner', 'ProcessOwner'),
  createProcessValidation,
  auditLog('process.created', 'process'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const process = await processService.createProcess(req.body, authReq.user!.id);

      res.status(201).json(process);
    } catch (error) {
      next(error);
    }
  }
);

// Get process by ID
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const process = await processService.getProcessById(req.params.id);

      if (!process) {
        res.status(404).json({ error: 'Process not found' });
        return;
      }

      res.json(process);
    } catch (error) {
      next(error);
    }
  }
);

// List processes
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, state } = req.query;

      const processes = await processService.listProcesses(
        category as string,
        state as string
      );

      res.json({ processes, total: processes.length });
    } catch (error) {
      next(error);
    }
  }
);

// Update process
router.put(
  '/:id',
  authenticate,
  authorize('ProcessDesigner', 'ProcessOwner'),
  auditLog('process.updated', 'process'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const process = await processService.updateProcess(req.params.id, req.body);

      res.json(process);
    } catch (error) {
      next(error);
    }
  }
);

// Publish process
router.post(
  '/:id/publish',
  authenticate,
  authorize('ProcessOwner'),
  auditLog('process.published', 'process'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const process = await processService.publishProcess(req.params.id, authReq.user!.id);

      res.json(process);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
