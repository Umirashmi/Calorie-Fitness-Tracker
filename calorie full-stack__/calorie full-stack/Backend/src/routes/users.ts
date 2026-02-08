import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { validate, userValidation } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/profile', UserController.getProfile);

router.put('/profile', 
  validate(userValidation.updateProfile),
  UserController.updateProfile
);

router.delete('/account', UserController.deleteAccount);

router.get('/stats', UserController.getStats);

export default router;