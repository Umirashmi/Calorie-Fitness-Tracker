import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Food } from '../models/Food';
import { FoodLog } from '../models/FoodLog';
import { UserFavoriteFood } from '../models/UserFavoriteFood';
import { NutritionAPIService } from '../services/nutritionAPI';
import { CacheService } from '../services/cacheService';
import { ResponseHelpers } from '../utils/responseHelpers';
import { CustomValidators } from '../utils/validators';
import { asyncHandler, badRequest, notFoundError } from '../middleware/errorHandler';

export class FoodController {
  static searchFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { q: query, limit = 20 } = req.query as { q?: string; limit?: number };

    if (!query || !CustomValidators.isValidSearchQuery(query)) {
      throw badRequest('Valid search query is required');
    }

    const searchLimit = Math.min(50, Math.max(1, Number(limit)));
    const cacheKey = CacheService.generateFoodSearchKey(query);
    
    let cachedResults = CacheService.get<Food[]>(cacheKey);
    if (cachedResults) {
      ResponseHelpers.success(res, cachedResults.slice(0, searchLimit), 'Foods retrieved from cache');
      return;
    }

    const sanitizedQuery = CustomValidators.sanitizeSearchQuery(query);

    const foods = await Food.findAll({
      where: {
        name: {
          [Op.iLike]: `%${sanitizedQuery}%`,
        },
      },
      limit: searchLimit,
      order: [['name', 'ASC']],
    });

    CacheService.set(cacheKey, foods, 1800); // Cache for 30 minutes

    ResponseHelpers.success(res, foods, 'Foods retrieved successfully');
  });

  static createFood = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { 
      name, 
      calories_per_100g, 
      protein_per_100g, 
      carbs_per_100g, 
      fats_per_100g, 
      serving_size,
      serving_unit 
    } = req.body;

    // if (!CustomValidators.isReasonableNutritionValue(calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g)) {
    //   throw badRequest('Nutrition values seem inconsistent. Please verify your entries.');
    // }

    const food = await Food.create({
      name: name.trim(),
      calories_per_100g,
      protein_per_100g,
      carbs_per_100g,
      fats_per_100g,
      serving_size: serving_size || null,
      serving_unit: serving_unit || null,
      source: 'user',
    });

    ResponseHelpers.created(res, food, 'Custom food created successfully');
  });

  static getRecentFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { limit = 10 } = req.query as { limit?: number };

    const searchLimit = Math.min(50, Math.max(1, Number(limit)));

    const recentFoodIds = await FoodLog.findAll({
      where: { user_id: userId },
      attributes: ['food_id'],
      group: ['food_id'],
      order: [['createdAt', 'DESC']],
      limit: searchLimit,
    });

    if (recentFoodIds.length === 0) {
      ResponseHelpers.success(res, [], 'No recent foods found');
      return;
    }

    const foods = await Food.findAll({
      where: {
        id: {
          [Op.in]: recentFoodIds.map(log => log.food_id),
        },
      },
    });

    ResponseHelpers.success(res, foods, 'Recent foods retrieved successfully');
  });

  static searchExternal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { q: query } = req.query as { q: string };

    if (!query || !CustomValidators.isValidSearchQuery(query)) {
      throw badRequest('Valid search query is required');
    }

    const cacheKey = `external_${CacheService.generateFoodSearchKey(query)}`;
    let cachedResults = CacheService.get(cacheKey);
    
    if (cachedResults) {
      ResponseHelpers.success(res, cachedResults, 'External food data retrieved from cache');
      return;
    }

    try {
      const externalResults = await NutritionAPIService.searchExternal(query);
      
      const validResults = externalResults.filter(result => 
        NutritionAPIService.validateNutritionData(result)
      );

      CacheService.set(cacheKey, validResults, 3600); // Cache for 1 hour

      ResponseHelpers.success(res, validResults, 'External food data retrieved successfully');
    } catch (error) {
      throw badRequest('External nutrition API temporarily unavailable');
    }
  });

  static getFoodById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!CustomValidators.isValidUUID(id)) {
      throw badRequest('Invalid food ID format');
    }

    const food = await Food.findByPk(id);
    
    if (!food) {
      throw notFoundError('Food not found');
    }

    ResponseHelpers.success(res, food, 'Food retrieved successfully');
  });

  static updateFood = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!CustomValidators.isValidUUID(id)) {
      throw badRequest('Invalid food ID format');
    }

    const food = await Food.findByPk(id);
    
    if (!food) {
      throw notFoundError('Food not found');
    }

    if (food.source !== 'user') {
      throw badRequest('Cannot modify system or API foods');
    }

    if (updateData.calories_per_100g && updateData.protein_per_100g && 
        updateData.carbs_per_100g && updateData.fats_per_100g) {
      if (!CustomValidators.isReasonableNutritionValue(
        updateData.calories_per_100g,
        updateData.protein_per_100g,
        updateData.carbs_per_100g,
        updateData.fats_per_100g
      )) {
        throw badRequest('Nutrition values seem inconsistent. Please verify your entries.');
      }
    }

    const updatedFood = await food.update(updateData);

    ResponseHelpers.updated(res, updatedFood, 'Food updated successfully');
  });

  static deleteFood = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!CustomValidators.isValidUUID(id)) {
      throw badRequest('Invalid food ID format');
    }

    const food = await Food.findByPk(id);
    
    if (!food) {
      throw notFoundError('Food not found');
    }

    if (food.source !== 'user') {
      throw badRequest('Cannot delete system or API foods');
    }

    const logsUsingFood = await FoodLog.count({ where: { food_id: id } });
    if (logsUsingFood > 0) {
      throw badRequest('Cannot delete food that has been logged. Consider archiving instead.');
    }

    await food.destroy();

    ResponseHelpers.deleted(res, 'Food deleted successfully');
  });

  static importFromExternal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { externalData } = req.body;

    if (!NutritionAPIService.validateNutritionData(externalData)) {
      throw badRequest('Invalid external food data');
    }

    // const existingFood = await Food.findOne({
    //   where: {
    //      // external_id: externalData. // external_id,
    //   },
    // });

    // if (existingFood) {
    //   ResponseHelpers.success(res, existingFood, 'Food already exists in database');
    //   return;
    // }

    const food = await Food.create({
      name: externalData.name,
      calories_per_100g: externalData.calories_per_100g,
      protein_per_100g: externalData.protein_per_100g,
      carbs_per_100g: externalData.carbs_per_100g,
      fats_per_100g: externalData.fats_per_100g,
      source: 'api',
       // external_id: externalData. // external_id,
    });

    ResponseHelpers.created(res, food, 'Food imported successfully');
  });

  static getFavoriteFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { limit = 20 } = req.query as { limit?: number };

    const searchLimit = Math.min(50, Math.max(1, Number(limit)));

    const favorites: any = await UserFavoriteFood.findAll({
      where: { user_id: userId },
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g', 'serving_size', 'serving_unit', 'source'],
      }],
      order: [['createdAt', 'DESC']],
      limit: searchLimit,
    });

    const foods = favorites.map(fav => ({
      ...fav.food?.toJSON(),
      isFavorite: true,
    }));

    ResponseHelpers.success(res, foods, 'Favorite foods retrieved successfully');
  });

  static toggleFavoriteFood = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { id: foodId } = req.params;

    if (!CustomValidators.isValidUUID(foodId)) {
      throw badRequest('Invalid food ID format');
    }

    const food = await Food.findByPk(foodId);
    if (!food) {
      throw notFoundError('Food not found');
    }

    const existingFavorite = await UserFavoriteFood.findOne({
      where: { user_id: userId, food_id: foodId },
    });

    let isFavorite: boolean;

    if (existingFavorite) {
      await existingFavorite.destroy();
      isFavorite = false;
    } else {
      await UserFavoriteFood.create({
        user_id: userId,
        food_id: foodId,
      });
      isFavorite = true;
    }

    ResponseHelpers.success(res, {
      foodId,
      isFavorite,
    }, `Food ${isFavorite ? 'added to' : 'removed from'} favorites successfully`);
  });

  static checkFavoriteStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { id: foodId } = req.params;

    if (!CustomValidators.isValidUUID(foodId)) {
      throw badRequest('Invalid food ID format');
    }

    const isFavorite = await UserFavoriteFood.findOne({
      where: { user_id: userId, food_id: foodId },
    }) !== null;

    ResponseHelpers.success(res, { isFavorite }, 'Favorite status retrieved successfully');
  });

  static getFrequentlyLoggedFoods = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { limit = 20, days = 30 } = req.query as { limit?: number; days?: number };

    const searchLimit = Math.min(50, Math.max(1, Number(limit)));
    const dayCount = Math.min(365, Math.max(7, Number(days)));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dayCount);

    const frequentFoods = await FoodLog.findAll({
      where: {
        user_id: userId,
        logged_date: {
          [Op.gte]: startDate.toLocaleDateString('en-CA'),
        },
      },
      attributes: [
        'food_id',
        [
          require('sequelize').fn('COUNT', require('sequelize').col('food_id')),
          'log_count'
        ]
      ],
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g', 'serving_size', 'serving_unit', 'source'],
      }],
      group: ['food_id', 'food.id'],
      order: [[require('sequelize').literal('log_count'), 'DESC']],
      limit: searchLimit,
    });

    const foods = await Promise.all(
      frequentFoods.map(async (logEntry: any) => {
        const isFavorite = await UserFavoriteFood.findOne({
          where: { user_id: userId, food_id: logEntry.food_id },
        }) !== null;

        return {
          ...logEntry.food?.toJSON(),
          logCount: parseInt(logEntry.getDataValue('log_count')),
          isFavorite,
        };
      })
    );

    ResponseHelpers.success(res, foods, 'Frequently logged foods retrieved successfully');
  });

  static getFoodSuggestions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { limit = 10, meal_type } = req.query as { limit?: number; meal_type?: string };

    const searchLimit = Math.min(20, Math.max(5, Number(limit)));

    const baseWhere: any = { user_id: userId };
    if (meal_type && CustomValidators.isValidMealType(meal_type)) {
      baseWhere.meal_type = meal_type;
    }

    // Get foods logged in the same meal type in the last 30 days
    const recentLogs = await FoodLog.findAll({
      where: {
        ...baseWhere,
        logged_date: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
        },
      },
      attributes: ['food_id'],
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g'],
      }],
      group: ['food_id', 'food.id'],
      limit: searchLimit,
      order: [['createdAt', 'DESC']],
    });

    const suggestions = await Promise.all(
      recentLogs.map(async (log: any) => {
        const isFavorite = await UserFavoriteFood.findOne({
          where: { user_id: userId, food_id: log.food_id },
        }) !== null;

        return {
          ...log.food?.toJSON(),
          isFavorite,
          lastLogged: log.createdAt,
        };
      })
    );

    ResponseHelpers.success(res, suggestions, `Food suggestions for ${meal_type || 'any meal'} retrieved successfully`);
  });
}