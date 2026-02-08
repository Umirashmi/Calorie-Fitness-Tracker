import { Router } from 'express';
import { StatsController } from '../controllers/statsController';
import { validateQuery } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

router.use(requireAuth);

// Stats validation schemas
const statsValidation = {
  dateQuery: Joi.object({
    start: Joi.date().optional(),
  }),
};

// Weekly statistics endpoint that Frontend expects
router.get('/weekly', 
  validateQuery(statsValidation.dateQuery),
  StatsController.getWeeklyStats
);

// Monthly statistics endpoint that Frontend expects
router.get('/monthly', 
  validateQuery(statsValidation.dateQuery),
  StatsController.getMonthlyStats
);

export default router;