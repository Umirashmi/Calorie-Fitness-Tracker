import { Router } from 'express';
import { WaterController } from '../controllers/waterController';
import { validate } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

router.use(requireAuth);

// Water validation schema
const waterValidation = {
  logWater: Joi.object({
    amount: Joi.number().min(1).max(5000).required(),
    date: Joi.date().optional(),
  }),
};

// Water logging endpoints that Frontend expects
router.post('/', 
  validate(waterValidation.logWater),
  WaterController.logWater
);

// Get water logs for specific date (Frontend expects /logs/water/:date)
router.get('/:date', WaterController.getDailyWaterIntake);

export default router;