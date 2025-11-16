import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthenticatedRequest } from '../types';

export interface JWTPayload {
  id: string;
  username: string;
  roles: string[];
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      username: decoded.username,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hasRole = user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole && !user.roles.includes('Administrator')) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }

    next();
  };
};
