import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate, authValidation } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', 
  authLimiter,
  validate(authValidation.register),
  AuthController.register
);

router.post('/login', 
  authLimiter,
  validate(authValidation.login),
  AuthController.login
);

router.post('/refresh', 
  validate(authValidation.refreshToken),
  AuthController.refresh
);

router.post('/logout', AuthController.logout);

router.get('/me', requireAuth, AuthController.getProfile);

export default router;