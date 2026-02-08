import { Router } from 'express';
import { LogController } from '../controllers/logController';
import { requireAuth } from '../middleware/auth';
import foodLogsRoutes from './logsFood';
import waterLogsRoutes from './logsWater';

const router = Router();

router.use(requireAuth);

// Sub-routes for specific log types
router.use('/food', foodLogsRoutes);
router.use('/water', waterLogsRoutes);

// Date-specific endpoints that Frontend expects
router.get('/date/:date', LogController.getLogsByDate);

export default router;