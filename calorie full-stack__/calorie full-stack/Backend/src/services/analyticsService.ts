import { Op } from 'sequelize';
import { FoodLog, CalculatedMacros } from '../models/FoodLog';
import { Goal } from '../models/Goal';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  goalCalories?: number;
  goalProtein?: number;
  goalCarbs?: number;
  goalFats?: number;
  percentageComplete: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  mealBreakdown: {
    [mealType: string]: CalculatedMacros;
  };
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  averages: CalculatedMacros;
  dailyData: DailySummary[];
  weeklyGoals?: CalculatedMacros;
}

export interface TrendData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight?: number;
}

export class AnalyticsService {
  static async getTodaysSummary(userId: string): Promise<DailySummary> {
    const today = new Date();
    return this.getDailySummary(userId, today);
  }

  static async getDailySummary(userId: string, date: Date): Promise<DailySummary> {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const logs = await FoodLog.findAll({
      where: {
        user_id: userId,
        logged_date: dateStr,
      },
      include: ['food'],
    });

    const userGoal = await Goal.findOne({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calculated_macros.calories,
        protein: acc.protein + log.calculated_macros.protein,
        carbs: acc.carbs + log.calculated_macros.carbs,
        fats: acc.fats + log.calculated_macros.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const mealBreakdown = logs.reduce((acc, log) => {
      if (!acc[log.meal_type]) {
        acc[log.meal_type] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
      }
      acc[log.meal_type].calories += log.calculated_macros.calories;
      acc[log.meal_type].protein += log.calculated_macros.protein;
      acc[log.meal_type].carbs += log.calculated_macros.carbs;
      acc[log.meal_type].fats += log.calculated_macros.fats;
      return acc;
    }, {} as { [key: string]: CalculatedMacros });

    const percentageComplete = userGoal
      ? {
          calories: Math.round((totals.calories / userGoal.daily_calories) * 100),
          protein: Math.round((totals.protein / userGoal.daily_protein) * 100),
          carbs: Math.round((totals.carbs / userGoal.daily_carbs) * 100),
          fats: Math.round((totals.fats / userGoal.daily_fats) * 100),
        }
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };

    return {
      date: dateStr,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
      totalFats: Math.round(totals.fats * 10) / 10,
      goalCalories: userGoal?.daily_calories,
      goalProtein: userGoal?.daily_protein,
      goalCarbs: userGoal?.daily_carbs,
      goalFats: userGoal?.daily_fats,
      percentageComplete,
      mealBreakdown,
    };
  }

  static async getWeeklySummary(userId: string): Promise<WeeklySummary> {
    const endDate = new Date();
    const startDate = subDays(endDate, 6);

    const dailyData: DailySummary[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = subDays(endDate, 6 - i);
      const summary = await this.getDailySummary(userId, currentDate);
      dailyData.push(summary);
    }

    const averages = dailyData.reduce(
      (acc, day, index, array) => ({
        calories: acc.calories + day.totalCalories / array.length,
        protein: acc.protein + day.totalProtein / array.length,
        carbs: acc.carbs + day.totalCarbs / array.length,
        fats: acc.fats + day.totalFats / array.length,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const userGoal = await Goal.findOne({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      averages: {
        calories: Math.round(averages.calories),
        protein: Math.round(averages.protein * 10) / 10,
        carbs: Math.round(averages.carbs * 10) / 10,
        fats: Math.round(averages.fats * 10) / 10,
      },
      dailyData,
      weeklyGoals: userGoal
        ? {
            calories: userGoal.daily_calories,
            protein: userGoal.daily_protein,
            carbs: userGoal.daily_carbs,
            fats: userGoal.daily_fats,
          }
        : undefined,
    };
  }

  static async getMonthlySummary(userId: string): Promise<WeeklySummary> {
    const endDate = new Date();
    const startDate = subDays(endDate, 29);

    const logs = await FoodLog.findAll({
      where: {
        user_id: userId,
        logged_date: {
          [Op.between]: [format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
        },
      },
    });

    const dailyTotals = new Map<string, CalculatedMacros>();

    logs.forEach((log) => {
      const dateKey = log.logged_date.toString();
      const existing = dailyTotals.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      
      dailyTotals.set(dateKey, {
        calories: existing.calories + log.calculated_macros.calories,
        protein: existing.protein + log.calculated_macros.protein,
        carbs: existing.carbs + log.calculated_macros.carbs,
        fats: existing.fats + log.calculated_macros.fats,
      });
    });

    const dailyData: DailySummary[] = [];
    for (let i = 0; i < 30; i++) {
      const currentDate = subDays(endDate, 29 - i);
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const totals = dailyTotals.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

      dailyData.push({
        date: dateKey,
        totalCalories: Math.round(totals.calories),
        totalProtein: Math.round(totals.protein * 10) / 10,
        totalCarbs: Math.round(totals.carbs * 10) / 10,
        totalFats: Math.round(totals.fats * 10) / 10,
        percentageComplete: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        mealBreakdown: {},
      });
    }

    const averages = dailyData.reduce(
      (acc, day, index, array) => ({
        calories: acc.calories + day.totalCalories / array.length,
        protein: acc.protein + day.totalProtein / array.length,
        carbs: acc.carbs + day.totalCarbs / array.length,
        fats: acc.fats + day.totalFats / array.length,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      averages: {
        calories: Math.round(averages.calories),
        protein: Math.round(averages.protein * 10) / 10,
        carbs: Math.round(averages.carbs * 10) / 10,
        fats: Math.round(averages.fats * 10) / 10,
      },
      dailyData,
    };
  }

  static async getTrends(userId: string, days: number = 30): Promise<TrendData[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    const logs = await FoodLog.findAll({
      where: {
        user_id: userId,
        logged_date: {
          [Op.between]: [format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
        },
      },
    });

    const dailyTotals = new Map<string, CalculatedMacros>();

    logs.forEach((log) => {
      const dateKey = log.logged_date.toString();
      const existing = dailyTotals.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      
      dailyTotals.set(dateKey, {
        calories: existing.calories + log.calculated_macros.calories,
        protein: existing.protein + log.calculated_macros.protein,
        carbs: existing.carbs + log.calculated_macros.carbs,
        fats: existing.fats + log.calculated_macros.fats,
      });
    });

    const trends: TrendData[] = [];
    for (let i = 0; i < days; i++) {
      const currentDate = subDays(endDate, days - 1 - i);
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      const totals = dailyTotals.get(dateKey) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

      trends.push({
        date: dateKey,
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fats: Math.round(totals.fats * 10) / 10,
      });
    }

    return trends;
  }
}