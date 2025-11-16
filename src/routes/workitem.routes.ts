import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { AuthenticatedRequest } from '../types';
import { workItemService } from '../services/workitem.service';

const router = Router();

// Create work item
router.post(
  '/',
  authenticate,
  [body('title').trim().notEmpty().withMessage('Title is required')],
  auditLog('work_item.created', 'work_item'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const workItem = await workItemService.createWorkItem(req.body, authReq.user!.id);

      res.status(201).json(workItem);
    } catch (error) {
      next(error);
    }
  }
);

// Get work item by ID
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workItem = await workItemService.getWorkItemById(req.params.id);

      if (!workItem) {
        res.status(404).json({ error: 'Work item not found' });
        return;
      }

      res.json(workItem);
    } catch (error) {
      next(error);
    }
  }
);

// List work items
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, assignee, reporter, priority, category, limit, offset } = req.query;

      const result = await workItemService.listWorkItems({
        status: status as string,
        assignee: assignee as string,
        reporter: reporter as string,
        priority: priority as string,
        category: category as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Update work item
router.put(
  '/:id',
  authenticate,
  auditLog('work_item.updated', 'work_item'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workItem = await workItemService.updateWorkItem(req.params.id, req.body);

      res.json(workItem);
    } catch (error) {
      next(error);
    }
  }
);

// Add comment to work item
router.post(
  '/:id/comments',
  authenticate,
  [body('comment').trim().notEmpty().withMessage('Comment is required')],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      await workItemService.addComment(req.params.id, authReq.user!.id, req.body.comment);

      res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Get work item comments
router.get(
  '/:id/comments',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comments = await workItemService.getComments(req.params.id);

      res.json({ comments });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
