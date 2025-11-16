import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { userService } from '../services/user.service';
import { auditService } from '../services/audit.service';
import { CreateUserRequest, LoginRequest } from '../types';

export const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 255 }).withMessage('Username must be between 3 and 255 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').optional().trim().isLength({ max: 255 }),
  body('lastName').optional().trim().isLength({ max: 255 }),
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userData: CreateUserRequest = req.body;
      const user = await userService.createUser(userData);

      await auditService.log({
        actorId: user.id,
        actionType: 'user.created',
        resourceType: 'user',
        resourceId: user.id,
        newValue: { username: user.username, email: user.email },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, password }: LoginRequest = req.body;
      const loginResponse = await userService.login(username, password);

      await auditService.log({
        actorId: loginResponse.user.id,
        actionType: 'user.login',
        resourceType: 'user',
        resourceId: loginResponse.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json(loginResponse);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
