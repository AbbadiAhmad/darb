import { Router } from 'express';
import authRoutes from './auth.routes';
import processRoutes from './process.routes';
import executionRoutes from './execution.routes';
import workItemRoutes from './workitem.routes';
import auditRoutes from './audit.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/processes', processRoutes);
router.use('/execution', executionRoutes);
router.use('/work-items', workItemRoutes);
router.use('/audit', auditRoutes);

export default router;
