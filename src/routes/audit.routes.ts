import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditService } from '../services/audit.service';

const router = Router();

// Get audit trail
router.get(
  '/',
  authenticate,
  authorize('ComplianceOfficer', 'Administrator'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resourceType, resourceId, actorId, startDate, endDate, limit, offset } = req.query;

      const auditTrail = await auditService.getAuditTrail(
        resourceType as string,
        resourceId as string,
        actorId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        limit ? parseInt(limit as string, 10) : 100,
        offset ? parseInt(offset as string, 10) : 0
      );

      res.json({ auditTrail, total: auditTrail.length });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
