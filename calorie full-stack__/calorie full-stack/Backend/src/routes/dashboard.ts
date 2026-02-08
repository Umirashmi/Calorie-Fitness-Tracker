import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { validateQuery } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

router.use(requireAuth);

// Dashboard validation schemas
const dashboardValidation = {
  dashboardQuery: Joi.object({
    date: Joi.date().optional(),
  }),
};

// Get dashboard data
router.get('/', 
  validateQuery(dashboardValidation.dashboardQuery),
  DashboardController.getDashboardData
);

// Get quick actions for mobile
router.get('/quick-actions', DashboardController.getQuickActions);

export default router;