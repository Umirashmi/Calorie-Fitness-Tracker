import { Router } from 'express';
import { ResponseHelpers } from '../utils/responseHelpers';
import authRoutes from './auth';
import userRoutes from './users';
import goalRoutes from './goals';
import foodRoutes from './foods';
import logRoutes from './logs';
import analyticsRoutes from './analytics';
import waterRoutes from './water';
import dashboardRoutes from './dashboard';

// Frontend-expected routes (aliases and specific structures)
import userAliasRoutes from './user';
import logsMainRoutes from './logsMain';
import statsRoutes from './stats';

const router = Router();

router.get('/', (req, res) => {
  ResponseHelpers.success(res, {
    name: 'Nutrition Tracker API',
    version: '1.0.0',
    description: 'RESTful API for tracking nutrition and calorie intake',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      goals: '/api/goals',
      foods: '/api/foods',
      logs: '/api/logs',
      analytics: '/api/analytics',
      water: '/api/water',
      dashboard: '/api/dashboard',
      // Frontend-specific endpoints
      user: '/api/user',
      log: '/api/log',
      stats: '/api/stats',
    },
  }, 'Nutrition Tracker API is running');
});

router.get('/health', (req, res) => {
  ResponseHelpers.healthCheck(res);
});

// Original Backend routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/goals', goalRoutes);
router.use('/foods', foodRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/water', waterRoutes);
router.use('/dashboard', dashboardRoutes);

// Frontend-expected routes (with proper structure)
router.use('/user', userAliasRoutes);
router.use('/logs', logsMainRoutes);
router.use('/log', logRoutes);
router.use('/stats', statsRoutes);

export default router;