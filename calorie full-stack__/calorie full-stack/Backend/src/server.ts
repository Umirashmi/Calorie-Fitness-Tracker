import createApp  from './app';
import { connectDatabase, syncDatabase } from './config/database';
import { initializeModels } from './models';
import { environment } from './config/environment';
import { logger } from './middleware/logger';

const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize models
    await initializeModels();
    logger.info('Database models initialized');

    // Sync database (only in development)
    if (environment.NODE_ENV === 'development') {
      await syncDatabase(false);
      logger.info('Database synchronized');
    }

    // Create Express application
    const app = createApp();

    // Start server
    const server = app.listen(environment.PORT, () => {
      logger.info(`Server running on port ${environment.PORT} in ${environment.NODE_ENV} mode`);
      logger.info(`API documentation available at http://localhost:${environment.PORT}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        
        // Close database connection
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit in production, just log the error
      if (environment.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export { startServer };