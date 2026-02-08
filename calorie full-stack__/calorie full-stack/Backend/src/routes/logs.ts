import { Router } from 'express';
import { LogController } from '../controllers/logController';
import { validate, validateQuery, logValidation } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', 
  validate(logValidation.createLog),
  LogController.createLog
);

router.get('/', LogController.getLogs);

router.get('/today', LogController.getTodaysLogs);

router.get('/date/:date', LogController.getLogsByDate);

router.get('/range', 
  validateQuery(logValidation.dateRange),
  LogController.getLogRange
);

router.put('/:id', 
  validate(logValidation.updateLog),
  LogController.updateLog
);

router.delete('/:id', LogController.deleteLog);

export default router;