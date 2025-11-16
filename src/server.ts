import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import db from './database';

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: true,
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging in development
    if (config.env === 'development') {
      this.app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private configureRoutes(): void {
    // API routes
    this.app.use(config.apiPrefix, routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'DARB - Process-Driven Ticketing System',
        version: '1.0.0',
        description: 'A process-driven ticketing application leveraging BPMN workflows',
        status: 'running',
      });
    });
  }

  private configureErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
      });
    });

    // Global error handler
    this.app.use(errorHandler);
  }

  async start(): Promise<void> {
    try {
      // Test database connection
      await db.query('SELECT NOW()');
      console.log('Database connected successfully');

      // Start server
      this.app.listen(config.port, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   DARB - Process-Driven Ticketing System                ║
║                                                           ║
║   Server running on port ${config.port}                          ║
║   Environment: ${config.env}                        ║
║   API Prefix: ${config.apiPrefix}                          ║
║                                                           ║
║   API Documentation:                                      ║
║   - Health Check: GET /api/v1/health                      ║
║   - Authentication: POST /api/v1/auth/login              ║
║   - Processes: /api/v1/processes                          ║
║   - Execution: /api/v1/execution                          ║
║   - Work Items: /api/v1/work-items                        ║
║   - Audit: /api/v1/audit                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    await db.close();
    console.log('Server stopped');
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});
