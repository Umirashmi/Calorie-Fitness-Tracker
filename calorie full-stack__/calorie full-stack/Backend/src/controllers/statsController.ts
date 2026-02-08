import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { ResponseHelpers } from '../utils/responseHelpers';
import { DateHelpers } from '../utils/dateHelpers';
import { asyncHandler, badRequest } from '../middleware/errorHandler';

export class StatsController {
  static getWeeklyStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { start } = req.query as { start?: string };

    let startDate: string;
    if (start && DateHelpers.isValidDate(start)) {
      startDate = start;
    } else {
      // Default to start of current week (7 days ago)
      startDate = DateHelpers.getDaysAgo(6);
    }

    const weeklySummary = await AnalyticsService.getWeeklySummary(userId);

    // Transform to match Frontend expectations
    const weeklyStats = {
      averageCalories: weeklySummary.averages.calories,
      averageProtein: weeklySummary.averages.protein,
      averageCarbs: weeklySummary.averages.carbs,
      averageFats: weeklySummary.averages.fats,
      daysLogged: weeklySummary.dailyData.filter(day => day.totalCalories > 0).length,
      totalDays: weeklySummary.dailyData.length,
      startDate: weeklySummary.startDate,
      endDate: weeklySummary.endDate,
      dailyBreakdown: weeklySummary.dailyData.map(day => ({
        date: day.date,
        calories: day.totalCalories,
        protein: day.totalProtein,
        carbs: day.totalCarbs,
        fats: day.totalFats,
        percentageComplete: day.percentageComplete,
      })),
    };

    ResponseHelpers.success(res, weeklyStats, 'Weekly statistics retrieved successfully');
  });

  static getMonthlyStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { start } = req.query as { start?: string };

    let startDate: string;
    if (start && DateHelpers.isValidDate(start)) {
      startDate = start;
    } else {
      // Default to start of current month (30 days ago)
      startDate = DateHelpers.getDaysAgo(29);
    }

    const monthlySummary = await AnalyticsService.getMonthlySummary(userId);

    // Calculate goal adherence
    const daysWithGoalsMet = monthlySummary.dailyData.filter(day => {
      if (!day.goalCalories) return false;
      return Math.abs(day.totalCalories - day.goalCalories) <= (day.goalCalories * 0.1); // Within 10%
    }).length;

    const goalAdherence = monthlySummary.dailyData.length > 0 
      ? Math.round((daysWithGoalsMet / monthlySummary.dailyData.length) * 100)
      : 0;

    // Transform to match Frontend expectations  
    const monthlyStats = {
      averageCalories: monthlySummary.averages.calories,
      averageProtein: monthlySummary.averages.protein,
      averageCarbs: monthlySummary.averages.carbs,
      averageFats: monthlySummary.averages.fats,
      daysLogged: monthlySummary.dailyData.filter(day => day.totalCalories > 0).length,
      totalDays: monthlySummary.dailyData.length,
      goalAdherence,
      weightChange: null, // Would need weight tracking feature
      startDate: monthlySummary.startDate,
      endDate: monthlySummary.endDate,
      dailyBreakdown: monthlySummary.dailyData.map(day => ({
        date: day.date,
        calories: day.totalCalories,
        protein: day.totalProtein,
        carbs: day.totalCarbs,
        fats: day.totalFats,
      })),
      weeklyAverages: this.calculateWeeklyAverages(monthlySummary.dailyData),
    };

    ResponseHelpers.success(res, monthlyStats, 'Monthly statistics retrieved successfully');
  });

  private static calculateWeeklyAverages(dailyData: any[]) {
    const weeks: any = [];
    for (let i = 0; i < dailyData.length; i += 7) {
      const weekData = dailyData.slice(i, i + 7);
      const weekAverage = {
        weekStart: weekData[0]?.date,
        weekEnd: weekData[weekData.length - 1]?.date,
        averageCalories: Math.round(
          weekData.reduce((sum, day) => sum + day.totalCalories, 0) / weekData.length
        ),
        averageProtein: Math.round(
          weekData.reduce((sum, day) => sum + day.totalProtein, 0) / weekData.length * 10
        ) / 10,
        averageCarbs: Math.round(
          weekData.reduce((sum, day) => sum + day.totalCarbs, 0) / weekData.length * 10
        ) / 10,
        averageFats: Math.round(
          weekData.reduce((sum, day) => sum + day.totalFats, 0) / weekData.length * 10
        ) / 10,
        daysLogged: weekData.filter(day => day.totalCalories > 0).length,
      };
      weeks.push(weekAverage);
    }
    return weeks;
  }
}