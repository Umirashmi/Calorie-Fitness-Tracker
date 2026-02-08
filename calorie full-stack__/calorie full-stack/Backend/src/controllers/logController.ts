import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { FoodLog } from '../models/FoodLog';
import { Food } from '../models/Food';
import { ResponseHelpers } from '../utils/responseHelpers';
import { NutritionCalculations } from '../utils/nutritionCalculations';
import { DateHelpers } from '../utils/dateHelpers';
import { CustomValidators } from '../utils/validators';
import { asyncHandler, notFoundError, badRequest } from '../middleware/errorHandler';

export class LogController {
  static createLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { food_id, portion_size, meal_type, logged_date, quantity } = req.body;

    if (!CustomValidators.isValidUUID(food_id)) {
      throw badRequest('Invalid food ID format');
    }

    const food = await Food.findByPk(food_id);
    if (!food) {
      throw notFoundError('Food not found');
    }

    const calculatedMacros = NutritionCalculations.calculateMacrosForPortion({
      calories_per_100g: food.calories_per_100g,
      protein_per_100g: food.protein_per_100g,
      carbs_per_100g: food.carbs_per_100g,
      fats_per_100g: food.fats_per_100g,
      portion_size,
    });

    const logDate = logged_date ? DateHelpers.normalizeDate(logged_date) : DateHelpers.getToday();

    const log = await FoodLog.create({
      user_id: userId,
      food_id,
      portion_size,
      quantity,
      calculated_macros: calculatedMacros,
      meal_type,
      logged_date: new Date(logDate),
    });

    const logResponse: any = await FoodLog.findByPk(log.id, {
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g', 'serving_size', 'serving_unit'],
      }],
    });

    // Transform to match Frontend FoodEntry interface
    const frontendResponse = {
      id: logResponse?.id,
      foodId: logResponse?.food_id,
      food: {
        id: logResponse?.food?.id,
        name: logResponse?.food?.name,
        servingSize: logResponse?.food?.serving_size || 100, // Use stored serving size or default to 100
        servingSizeUnit: logResponse?.food?.serving_unit || 'g', // Use stored unit or default to 'g'
        calories: logResponse?.food?.calories_per_100g || 0,
        protein: logResponse?.food?.protein_per_100g || 0,
        carbs: logResponse?.food?.carbs_per_100g || 0,
        fats: logResponse?.food?.fats_per_100g || 0,
        isVerified: true,
      },
      quantity: logResponse?.quantity || 0,
      servingSize: logResponse?.portion_size || 0,
      mealType: logResponse?.meal_type,
      loggedAt: logResponse?.createdAt?.toISOString(),
    };

    ResponseHelpers.created(res, frontendResponse, 'Food logged successfully');
  });

  static getLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { page = 1, limit = 20, meal_type, start_date, end_date } = req.query as {
      page?: number;
      limit?: number;
      meal_type?: string;
      start_date?: string;
      end_date?: string;
    };

    const offset = ResponseHelpers.calculateOffset(Number(page), Number(limit));
    
    const whereClause: any = { user_id: userId };

    if (meal_type && CustomValidators.isValidMealType(meal_type)) {
      whereClause.meal_type = meal_type;
    }

    if (start_date && end_date) {
      if (!DateHelpers.isValidDate(start_date) || !DateHelpers.isValidDate(end_date)) {
        throw badRequest('Invalid date format. Use YYYY-MM-DD');
      }
      
      whereClause.logged_date = {
        [Op.between]: [start_date, end_date],
      };
    }

    const { count, rows: logs } = await FoodLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g', 'serving_size', 'serving_unit'],
      }],
      order: [['logged_date', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    ResponseHelpers.paginated(res, logs, Number(page), Number(limit), count, 'Food logs retrieved successfully');
  });

  static updateLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const logId = req.params.id;
    const { portion_size, meal_type, logged_date } = req.body;

    if (!CustomValidators.isValidUUID(logId)) {
      throw badRequest('Invalid log ID format');
    }

    const log: any = await FoodLog.findOne({
      where: { id: logId, user_id: userId },
      include: ['food'],
    });

    if (!log) {
      throw notFoundError('Food log not found');
    }

    const updateData: any = {};

    if (portion_size !== undefined) {
      if (!CustomValidators.isValidPortionSize(portion_size)) {
        throw badRequest('Invalid portion size');
      }
      console.log("log ++++++++++++++++++++++++", log);
      

      const calculatedMacros = NutritionCalculations.calculateMacrosForPortion({
        calories_per_100g: log.food.calories_per_100g,
        protein_per_100g: log.food.protein_per_100g,
        carbs_per_100g: log.food.carbs_per_100g,
        fats_per_100g: log.food.fats_per_100g,
        portion_size,
      });

      updateData.portion_size = portion_size;
      updateData.calculated_macros = calculatedMacros;
    }

    if (meal_type !== undefined) {
      if (!CustomValidators.isValidMealType(meal_type)) {
        throw badRequest('Invalid meal type');
      }
      updateData.meal_type = meal_type;
    }

    if (logged_date !== undefined) {
      updateData.logged_date = DateHelpers.normalizeDate(logged_date);
    }

    const updatedLog = await log.update(updateData);

    const logResponse = await FoodLog.findByPk(updatedLog.id, {
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g', 'serving_size', 'serving_unit'],
      }],
    });

    ResponseHelpers.updated(res, logResponse, 'Food log updated successfully');
  });

  static deleteLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const logId = req.params.id;

    if (!CustomValidators.isValidUUID(logId)) {
      throw badRequest('Invalid log ID format');
    }

    const log = await FoodLog.findOne({
      where: { id: logId, user_id: userId },
    });

    if (!log) {
      throw notFoundError('Food log not found');
    }

    await log.destroy();

    ResponseHelpers.deleted(res, 'Food log deleted successfully');
  });

  static getLogsByDate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { date } = req.params;
    const { mealType } = req.query

    if (!DateHelpers.isValidDate(date)) {
      throw badRequest('Invalid date format. Use YYYY-MM-DD');
    }
    let wereCondition = {
        user_id: userId,
        logged_date: date,
      };
    if(mealType){
      wereCondition['meal_type'] = mealType;
    }
    const logs: any = await FoodLog.findAll({
      where: wereCondition,
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name', 'calories_per_100g', 'protein_per_100g', 'carbs_per_100g', 'fats_per_100g', 'serving_size', 'serving_unit'],
      }],
      order: [['meal_type', 'ASC'], ['createdAt', 'ASC']],
    });

    const groupedLogs = logs.reduce((acc, log) => {
      if (!acc[log.meal_type]) {
        acc[log.meal_type] = [];
      }
      acc[log.meal_type].push(log);
      return acc;
    }, {} as { [key: string]: typeof logs });

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calculated_macros.calories,
        protein: acc.protein + log.calculated_macros.protein,
        carbs: acc.carbs + log.calculated_macros.carbs,
        fats: acc.fats + log.calculated_macros.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    // Transform logs to match Frontend FoodEntry structure
    const transformedEntries = logs.map(log => ({
      id: log.id,
      foodId: log.food_id,
      food: {
        id: log.food?.id,
        name: log.food?.name,
        servingSize: 100,
        servingSizeUnit: 'g',
        calories: log.food?.calories_per_100g || 0,
        protein: log.food?.protein_per_100g || 0,
        carbs: log.food?.carbs_per_100g || 0,
        fats: log.food?.fats_per_100g || 0,
        isVerified: true,
      },
      quantity: log.portion_size,
      servingSize: log.portion_size,
      mealType: log.meal_type,
      loggedAt: log.createdAt.toISOString(),
    }));

    // Structure to match Frontend DailyLog interface
    const dailyLogResponse = {
      id: `daily_${date}_${userId}`, // Generate consistent ID
      userId: userId,
      date: date,
      entries: transformedEntries,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
      totalFats: Math.round(totals.fats * 10) / 10,
      totalFiber: 0, // Would need to add fiber tracking
      totalSugar: 0, // Would need to add sugar tracking
      totalSodium: 0, // Would need to add sodium tracking
      waterIntake: 0, // Would need to integrate water logs
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ResponseHelpers.success(res, dailyLogResponse, 'Daily food logs retrieved successfully');
  });

  static getTodaysLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const today = DateHelpers.getToday();

    req.params.date = today;
    await LogController.getLogsByDate(req, res, next);
  });

  static getLogRange = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { start_date, end_date } = req.query as { start_date: string; end_date: string };

    if (!start_date || !end_date) {
      throw badRequest('Both start_date and end_date are required');
    }

    if (!DateHelpers.isValidDate(start_date) || !DateHelpers.isValidDate(end_date)) {
      throw badRequest('Invalid date format. Use YYYY-MM-DD');
    }

    if (!CustomValidators.isValidDateRange(new Date(start_date), new Date(end_date), 90)) {
      throw badRequest('Date range cannot exceed 90 days');
    }

    const logs = await FoodLog.findAll({
      where: {
        user_id: userId,
        logged_date: {
          [Op.between]: [start_date, end_date],
        },
      },
      include: [{
        model: Food,
        as: 'food',
        attributes: ['id', 'name'],
      }],
      order: [['logged_date', 'DESC'], ['meal_type', 'ASC']],
    });

    const groupedByDate = logs.reduce((acc, log) => {
      const dateKey = log.logged_date.toString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(log);
      return acc;
    }, {} as { [key: string]: typeof logs });

    ResponseHelpers.success(res, {
      start_date,
      end_date,
      logsByDate: groupedByDate,
      totalLogs: logs.length,
    }, 'Food logs for date range retrieved successfully');
  });
}