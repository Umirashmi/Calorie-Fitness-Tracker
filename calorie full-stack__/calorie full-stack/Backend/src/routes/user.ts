import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { FoodController } from '../controllers/foodController';
import { GoalController } from '../controllers/goalController';
import { validate, userValidation, goalValidation } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

// User profile endpoints (aliases for /users/profile)
router.get('/profile', UserController.getProfile);

router.put('/profile', 
  validate(userValidation.updateProfile),
  UserController.updateProfile
);

// User favorites endpoints (aliases for /foods/favorites)
router.get('/favorites', FoodController.getFavoriteFoods);

router.post('/favorites/:id', FoodController.toggleFavoriteFood);

router.get('/favorites/:id', FoodController.checkFavoriteStatus);

// User goals endpoints (aliases for /goals)
router.get('/goals', GoalController.getGoals);

router.put('/goals', 
  validate(goalValidation.createGoal),
  GoalController.createGoal
);

export default router;