import { Router } from 'express';
import { FoodController } from '../controllers/foodController';
import { validate, validateQuery, foodValidation } from '../middleware/validation';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { searchLimiter, apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/search', 
  searchLimiter,
  validateQuery(foodValidation.searchQuery),
  FoodController.searchFoods
);

router.get('/external/search', 
  apiLimiter,
  requireAuth,
  validateQuery(foodValidation.searchQuery),
  FoodController.searchExternal
);

router.get('/recent', 
  requireAuth,
  FoodController.getRecentFoods
);

router.post('/', 
  requireAuth,
  validate(foodValidation.createFood),
  FoodController.createFood
);

router.post('/import', 
  requireAuth,
  FoodController.importFromExternal
);

router.get('/:id', 
  optionalAuth,
  FoodController.getFoodById
);

router.put('/:id', 
  requireAuth,
  validate(foodValidation.createFood),
  FoodController.updateFood
);

router.delete('/:id', 
  requireAuth,
  FoodController.deleteFood
);

// Favorites
router.get('/favorites', 
  requireAuth,
  FoodController.getFavoriteFoods
);

router.post('/:id/favorite', 
  requireAuth,
  FoodController.toggleFavoriteFood
);

router.get('/:id/favorite', 
  requireAuth,
  FoodController.checkFavoriteStatus
);

// Frequently logged and suggestions
router.get('/frequent', 
  requireAuth,
  FoodController.getFrequentlyLoggedFoods
);

router.get('/suggestions', 
  requireAuth,
  FoodController.getFoodSuggestions
);

export default router;