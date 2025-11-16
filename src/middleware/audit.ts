import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { auditService } from '../services/audit.service';

export const auditLog = (actionType: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const originalSend = res.json;

    res.json = function (data: any): Response {
      // Log the action after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = data?.id || req.params.id || 'unknown';

        auditService.log({
          actorId: authReq.user?.id,
          actionType,
          resourceType,
          resourceId,
          newValue: data,
          context: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch((error) => {
          console.error('Audit logging error:', error);
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};
