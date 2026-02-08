import { Router } from 'express';
import { LogController } from '../controllers/logController';
import { validate, logValidation } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// Food logging endpoints that Frontend expects
router.post('/', 
  validate(logValidation.createLog),
  LogController.createLog
);

router.put('/:id', 
  validate(logValidation.updateLog),
  LogController.updateLog
);

router.delete('/:id', LogController.deleteLog);

export default router;