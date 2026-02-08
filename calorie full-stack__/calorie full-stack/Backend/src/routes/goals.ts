import { Router } from 'express';
import { GoalController } from '../controllers/goalController';
import { validate, goalValidation } from '../middleware/validation';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', GoalController.getGoals);

router.post('/', 
  validate(goalValidation.createGoal),
  GoalController.createGoal
);

router.put('/:id', 
  validate(goalValidation.updateGoal),
  GoalController.updateGoal
);

router.delete('/:id', GoalController.deleteGoal);

router.get('/recommendations', GoalController.calculateRecommendations);

export default router;