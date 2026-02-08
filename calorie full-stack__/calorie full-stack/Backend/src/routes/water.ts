import { Router } from 'express';
import { WaterController } from '../controllers/waterController';
import { validate, validateQuery } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

router.use(requireAuth);

// Water logging validation schemas
const waterValidation = {
  logWater: Joi.object({
    amount: Joi.number().min(1).max(5000).required(),
    logged_date: Joi.date().optional(),
    notes: Joi.string().max(500).optional().allow(''),
  }),

  updateWater: Joi.object({
    amount: Joi.number().min(1).max(5000).optional(),
    logged_date: Joi.date().optional(),
    notes: Joi.string().max(500).optional().allow(''),
  }),

  dateQuery: Joi.object({
    date: Joi.date().optional(),
  }),

  dateRangeQuery: Joi.object({
    start_date: Joi.date().optional(),
    end_date: Joi.date().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),

  weekQuery: Joi.object({
    week_start: Joi.date().optional(),
  }),

  statsQuery: Joi.object({
    days: Joi.number().integer().min(1).max(365).optional(),
  }),
};

// Log water intake
router.post('/', 
  validate(waterValidation.logWater),
  WaterController.logWater
);

// Get all water logs with pagination
router.get('/', 
  validateQuery(waterValidation.dateRangeQuery),
  WaterController.getWaterLogs
);

// Get today's water intake
router.get('/today', WaterController.getTodaysWaterIntake);

// Get water intake for specific date
router.get('/date/:date', WaterController.getDailyWaterIntake);

// Get weekly water summary
router.get('/week', 
  validateQuery(waterValidation.weekQuery),
  WaterController.getWeeklyWaterSummary
);

// Get water intake statistics
router.get('/stats', 
  validateQuery(waterValidation.statsQuery),
  WaterController.getWaterStats
);

// Update water log
router.put('/:id', 
  validate(waterValidation.updateWater),
  WaterController.updateWaterLog
);

// Delete water log
router.delete('/:id', WaterController.deleteWaterLog);

export default router;