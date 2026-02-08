import { Request, Response, NextFunction } from 'express';
import { Goal } from '../models/Goal';
import { User } from '../models/User';
import { ResponseHelpers } from '../utils/responseHelpers';
import { NutritionCalculations } from '../utils/nutritionCalculations';
import { asyncHandler, notFoundError, badRequest } from '../middleware/errorHandler';

export class GoalController {
  static getGoals = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;

    const goal = await Goal.findOne({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    if (!goal) {
      const user = await User.findByPk(userId);
      if (user && user.weight && user.height && user.age) {
        const suggestedGoals = NutritionCalculations.calculateMacroGoals(
          NutritionCalculations.calculateTDEE(
            NutritionCalculations.calculateBMR(user.weight, user.height, user.age, 'male'),
            user.activity_level || 'moderately_active'
          ),
          'maintenance',
          1.6,
          user.weight
        );

        ResponseHelpers.success(res, {
          hasGoals: false,
          suggestedGoals,
        }, 'No goals found, but here are some suggestions based on your profile');
        return;
      }

      ResponseHelpers.success(res, {
        hasGoals: false,
        message: 'No goals set. Please create your nutrition goals.',
      });
      return;
    }

    ResponseHelpers.success(res, {
      hasGoals: true,
      goal: {
        id: goal.id,
        daily_calories: goal.daily_calories,
        daily_protein: goal.daily_protein,
        daily_carbs: goal.daily_carbs,
        daily_fats: goal.daily_fats,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      },
    }, 'Goals retrieved successfully');
  });

  static createGoal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { calories, protein, carbs, fats } = req.body;
    const daily_calories = calories;
    const daily_protein = protein;
    const daily_carbs = carbs;
    const daily_fats = fats;

    // const { daily_calories, daily_protein, daily_carbs, daily_fats } = req.body;

    const calculatedCalories = NutritionCalculations.calculateCaloriesFromMacros(
      daily_protein,
      daily_carbs,
      daily_fats
    );

    if (Math.abs(daily_calories - calculatedCalories) > 100) {
      throw badRequest(
        `Calorie goal (${daily_calories}) doesn't match macro breakdown (${calculatedCalories} calculated). Please adjust your goals.`
      );
    }

    const existingGoal = await Goal.findOne({ where: { user_id: userId } });
    
    let goal;
    if (existingGoal) {
      goal = await existingGoal.update({
        daily_calories,
        daily_protein,
        daily_carbs,
        daily_fats,
      });
    } else {
      goal = await Goal.create({
        user_id: userId,
        daily_calories,
        daily_protein,
        daily_carbs,
        daily_fats,
      });
    }

    const goalResponse = {
      id: goal.id,
      calories: goal.daily_calories,
      protein: goal.daily_protein,
      carbs: goal.daily_carbs,
      fats: goal.daily_fats,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };

    ResponseHelpers.created(res, goalResponse, 'Goals created successfully');
  });

  static updateGoal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const goalId = req.params.id;
    const updateData = req.body;

    const goal = await Goal.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw notFoundError('Goal not found');
    }

    const updatedGoal = await goal.update(updateData);

    const goalResponse = {
      id: updatedGoal.id,
      calories: updatedGoal.daily_calories,
      protein: updatedGoal.daily_protein,
      carbs: updatedGoal.daily_carbs,
      fats: updatedGoal.daily_fats,
      updatedAt: updatedGoal.updatedAt,
    };

    ResponseHelpers.updated(res, goalResponse, 'Goal updated successfully');
  });

  static deleteGoal = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const goalId = req.params.id;

    const goal = await Goal.findOne({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      throw notFoundError('Goal not found');
    }

    await goal.destroy();

    ResponseHelpers.deleted(res, 'Goal deleted successfully');
  });

  static calculateRecommendations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const user = await User.findByPk(userId);

    if (!user || !user.weight || !user.height || !user.age) {
      throw badRequest('Please complete your profile (weight, height, age) to get recommendations');
    }

    const bmr = NutritionCalculations.calculateBMR(
      user.weight,
      user.height,
      user.age,
      'male' // Would need gender field in User model for accuracy
    );

    const tdee = NutritionCalculations.calculateTDEE(bmr, user.activity_level || 'moderately_active');

    const recommendations = {
      maintenance: NutritionCalculations.calculateMacroGoals(tdee, 'maintenance', 1.6, user.weight),
      weightLoss: NutritionCalculations.calculateMacroGoals(tdee, 'weight_loss', 1.6, user.weight),
      weightGain: NutritionCalculations.calculateMacroGoals(tdee, 'weight_gain', 1.6, user.weight),
      bmr,
      tdee,
    };

    ResponseHelpers.success(res, recommendations, 'Goal recommendations calculated successfully');
  });
}