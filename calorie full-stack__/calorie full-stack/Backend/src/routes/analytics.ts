import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { validateQuery, analyticsValidation } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/summary/today', AnalyticsController.getTodaysSummary);

router.get('/summary/week', AnalyticsController.getWeeklySummary);

router.get('/summary/month', AnalyticsController.getMonthlySummary);

router.get('/summary/date/:date', AnalyticsController.getDailySummary);

router.get('/summary/range', AnalyticsController.getDateRange);

router.get('/trends', 
  validateQuery(analyticsValidation.trendsQuery),
  AnalyticsController.getTrends
);

router.get('/progress', AnalyticsController.getProgressReport);

export default router;