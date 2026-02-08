import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { corsOptions } from './config/cors';
import { generalLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { CacheService } from './services/cacheService';
import routes from './routes';

const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // CORS
  // app.use(cors(corsOptions));
  app.use(cors());

  // Compression
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  // app.use(generalLimiter);

  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Routes
  app.use('/api', routes);

  // 404 handler
  app.use(notFound);

  // Error handler
  app.use(errorHandler);

  return app;
};

// Start cache cleanup interval
if (process.env.NODE_ENV !== 'test') {
  CacheService.startCleanupInterval();
}

export default createApp;