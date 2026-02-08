import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { FoodLog } from '../models/FoodLog';
import { WaterLog } from '../models/WaterLog';
import { Goal } from '../models/Goal';
import { User } from '../models/User';
import { AnalyticsService } from '../services/analyticsService';
import { ResponseHelpers } from '../utils/responseHelpers';
import { DateHelpers } from '../utils/dateHelpers';
import { NutritionCalculations } from '../utils/nutritionCalculations';
import { CacheService } from '../services/cacheService';
import { asyncHandler } from '../middleware/errorHandler';

export class DashboardController {
  static getDashboardData = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { date } = req.query as { date?: string };
    
    const targetDate = date || DateHelpers.getToday();
    
    const cacheKey = `dashboard:${userId}:${targetDate}`;
    let cachedData = CacheService.get(cacheKey);
    
    if (cachedData) {
      ResponseHelpers.success(res, cachedData, 'Dashboard data retrieved from cache');
      return;
    }

    // Get all data in parallel
    const [
      dailySummary,
      waterIntake,
      userGoals,
      recentFoods,
      weeklyProgress,
      userProfile
    ] = await Promise.all([
      AnalyticsService.getDailySummary(userId, new Date(targetDate)),
      this.getTodaysWaterIntake(userId, targetDate),
      Goal.findOne({
        where: { user_id: userId },
        order: [['createdAt', 'DESC']],
      }),
      this.getRecentFoodsForDashboard(userId),
      this.getWeeklyProgressSummary(userId),
      User.findByPk(userId, {
        attributes: ['id', 'email', 'age', 'weight', 'height', 'activity_level']
      })
    ]);

    // Calculate progress percentages
    const macroProgress = userGoals ? {
      calories: Math.round((dailySummary.totalCalories / userGoals.daily_calories) * 100),
      protein: Math.round((dailySummary.totalProtein / userGoals.daily_protein) * 100),
      carbs: Math.round((dailySummary.totalCarbs / userGoals.daily_carbs) * 100),
      fats: Math.round((dailySummary.totalFats / userGoals.daily_fats) * 100),
    } : null;

    // Calculate quick stats
    const quickStats = {
      streakDays: await this.calculateLoggingStreak(userId),
      totalLogs: await FoodLog.count({ where: { user_id: userId } }),
      favoriteCount: await this.getFavoriteCount(userId),
      avgWeeklyCalories: weeklyProgress.averageCalories,
    };

    // Calculate BMI and recommendations if profile is complete
    let profileInsights: any = null;
    if (userProfile && userProfile.weight && userProfile.height && userProfile.age) {
      const bmi = (userProfile.weight / Math.pow(userProfile.height / 100, 2));
      const bmr = NutritionCalculations.calculateBMR(
        userProfile.weight,
        userProfile.height,
        userProfile.age,
        'male' // Would need gender field
      );
      const tdee = NutritionCalculations.calculateTDEE(bmr, userProfile.activity_level || 'moderately_active');
      
      profileInsights = {
        bmi: Math.round(bmi * 10) / 10,
        bmiCategory: this.getBMICategory(bmi),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        recommendedCalories: Math.round(tdee),
      };
    }

    const dashboardData = {
      date: targetDate,
      user: {
        id: userProfile?.id,
        email: userProfile?.email,
        hasCompleteProfile: !!(userProfile?.weight && userProfile?.height && userProfile?.age),
      },
      dailyNutrition: {
        summary: dailySummary,
        progress: macroProgress,
        goals: userGoals ? {
          calories: userGoals.daily_calories,
          protein: userGoals.daily_protein,
          carbs: userGoals.daily_carbs,
          fats: userGoals.daily_fats,
        } : null,
      },
      waterIntake,
      recentFoods,
      weeklyProgress,
      quickStats,
      profileInsights,
      recommendations: await this.generateRecommendations(userId, dailySummary, userGoals),
    };

    // Cache for 5 minutes for today, 1 hour for past days
    const cacheTime = DateHelpers.isToday(targetDate) ? 300 : 3600;
    CacheService.set(cacheKey, dashboardData, cacheTime);

    ResponseHelpers.success(res, dashboardData, 'Dashboard data retrieved successfully');
  });

  private static async getTodaysWaterIntake(userId: string, date: string) {
    const logs = await WaterLog.findAll({
      where: {
        user_id: userId,
        logged_date: date,
      },
    });

    const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
    const recommendedDaily = 2000;

    return {
      totalIntake,
      recommendedDaily,
      percentageComplete: Math.round((totalIntake / recommendedDaily) * 100),
      logs: logs.map(log => ({
        id: log.id,
        amount: log.amount,
        notes: log.notes,
        createdAt: log.createdAt,
      })),
    };
  }

  private static async getRecentFoodsForDashboard(userId: string) {
    const recentLogs: any = await FoodLog.findAll({
      where: { user_id: userId },
      include: ['food'],
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    return recentLogs.map(log => ({
      id: log.id,
      food: {
        id: log.food?.id,
        name: log.food?.name,
      },
      portionSize: log.portion_size,
      mealType: log.meal_type,
      calculatedMacros: log.calculated_macros,
      loggedDate: log.logged_date,
      createdAt: log.createdAt,
    }));
  }

  private static async getWeeklyProgressSummary(userId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);

    const logs = await FoodLog.findAll({
      where: {
        user_id: userId,
        logged_date: {
          [Op.between]: [
            DateHelpers.formatDate(startDate),
            DateHelpers.formatDate(endDate)
          ],
        },
      },
    });

    const dailyTotals = new Map();
    const dateRange = DateHelpers.getDateRange(startDate, endDate);

    dateRange.forEach(date => {
      dailyTotals.set(date, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    });

    logs.forEach(log => {
      const dateKey = log.logged_date.toString();
      const current = dailyTotals.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      
      dailyTotals.set(dateKey, {
        calories: current.calories + log.calculated_macros.calories,
        protein: current.protein + log.calculated_macros.protein,
        carbs: current.carbs + log.calculated_macros.carbs,
        fats: current.fats + log.calculated_macros.fats,
      });
    });

    const allTotals = Array.from(dailyTotals.values());
    const averageCalories = Math.round(
      allTotals.reduce((sum, day) => sum + day.calories, 0) / allTotals.length
    );

    const daysWithLogs = allTotals.filter(day => day.calories > 0).length;
    const consistency = Math.round((daysWithLogs / 7) * 100);

    return {
      startDate: DateHelpers.formatDate(startDate),
      endDate: DateHelpers.formatDate(endDate),
      averageCalories,
      consistency,
      daysWithLogs,
      dailyData: Array.from(dailyTotals.entries()).map(([date, totals]) => ({
        date,
        calories: Math.round(totals.calories),
      })),
    };
  }

  private static async calculateLoggingStreak(userId: string): Promise<number> {
    let streak = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = DateHelpers.formatDate(currentDate);
      
      const hasLogs = await FoodLog.count({
        where: {
          user_id: userId,
          logged_date: dateStr,
        },
      }) > 0;

      if (hasLogs) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }

      // Prevent infinite loops
      if (streak > 365) break;
    }

    return streak;
  }

  private static async getFavoriteCount(userId: string): Promise<number> {
    const { UserFavoriteFood } = require('../models/UserFavoriteFood');
    return UserFavoriteFood.count({ where: { user_id: userId } });
  }

  private static getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  private static async generateRecommendations(userId: string, dailySummary: any, userGoals: any) {
    const recommendations: any = [];

    // Goal-based recommendations
    if (userGoals) {
      const caloriesDiff = dailySummary.totalCalories - userGoals.daily_calories;
      const proteinDiff = dailySummary.totalProtein - userGoals.daily_protein;

      if (caloriesDiff < -500) {
        recommendations.push({
          type: 'nutrition',
          priority: 'high',
          message: `You're ${Math.abs(caloriesDiff)} calories below your goal. Consider adding a healthy snack.`,
        });
      }

      if (proteinDiff < -20) {
        recommendations.push({
          type: 'nutrition',
          priority: 'medium',
          message: `You need ${Math.abs(proteinDiff)}g more protein to reach your goal.`,
        });
      }
    }

    // Water intake recommendation
    const waterLogs = await WaterLog.findAll({
      where: {
        user_id: userId,
        logged_date: DateHelpers.getToday(),
      },
    });

    const totalWater = waterLogs.reduce((sum, log) => sum + log.amount, 0);
    if (totalWater < 1500) {
      recommendations.push({
        type: 'hydration',
        priority: 'medium',
        message: `Drink more water! You've had ${totalWater}ml today, aim for 2000ml.`,
      });
    }

    // Logging consistency
    const recentDays = 7;
    const recentLogs = await FoodLog.count({
      where: {
        user_id: userId,
        logged_date: {
          [Op.gte]: DateHelpers.getDaysAgo(recentDays - 1),
        },
      },
    });

    if (recentLogs < recentDays * 2) { // Less than 2 logs per day on average
      recommendations.push({
        type: 'habit',
        priority: 'low',
        message: 'Try to log your meals more consistently for better tracking.',
      });
    }

    return recommendations;
  }

  static getQuickActions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;

    // Get recent and frequent foods for quick logging
    const [recentFoods, favoriteFoods] = await Promise.all([
      FoodLog.findAll({
        where: { user_id: userId },
        include: ['food'],
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
      // This would need the UserFavoriteFood model included
      [], // Placeholder for favorites
    ]);

    const recentFoodData: any = recentFoods;

    const quickActions = {
      quickLogFoods: recentFoodData.map(log => ({
        id: log.food?.id,
        name: log.food?.name,
        lastPortionSize: log.portion_size,
        lastMealType: log.meal_type,
      })),
      waterQuickAmounts: [250, 500, 750, 1000], // ml
      commonMealTypes: ['breakfast', 'lunch', 'dinner', 'snack'],
      suggestedActions: [
        { type: 'log_water', label: 'Log Water', icon: 'water-drop' },
        { type: 'quick_meal', label: 'Quick Meal', icon: 'restaurant' },
        { type: 'view_progress', label: 'View Progress', icon: 'chart-line' },
      ],
    };

    ResponseHelpers.success(res, quickActions, 'Quick actions retrieved successfully');
  });
}