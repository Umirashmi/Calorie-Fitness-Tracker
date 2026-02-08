import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { ResponseHelpers } from '../utils/responseHelpers';
import { DateHelpers } from '../utils/dateHelpers';
import { CustomValidators } from '../utils/validators';
import { CacheService } from '../services/cacheService';
import { asyncHandler, badRequest } from '../middleware/errorHandler';

export class AnalyticsController {
  static getTodaysSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const today = DateHelpers.getToday();
    
    const cacheKey = CacheService.generateDailySummaryKey(userId, today);
    let cachedSummary = CacheService.get(cacheKey);
    
    if (cachedSummary) {
      ResponseHelpers.success(res, cachedSummary, 'Today\'s summary retrieved from cache');
      return;
    }

    const summary = await AnalyticsService.getTodaysSummary(userId);
    
    CacheService.set(cacheKey, summary, 300); // Cache for 5 minutes

    ResponseHelpers.success(res, summary, 'Today\'s summary retrieved successfully');
  });

  static getWeeklySummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    
    const cacheKey = `weekly_summary:${userId}`;
    let cachedSummary = CacheService.get(cacheKey);
    
    if (cachedSummary) {
      ResponseHelpers.success(res, cachedSummary, 'Weekly summary retrieved from cache');
      return;
    }

    const summary = await AnalyticsService.getWeeklySummary(userId);
    
    CacheService.set(cacheKey, summary, 600); // Cache for 10 minutes

    ResponseHelpers.success(res, summary, 'Weekly summary retrieved successfully');
  });

  static getMonthlySummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    
    const cacheKey = `monthly_summary:${userId}`;
    let cachedSummary = CacheService.get(cacheKey);
    
    if (cachedSummary) {
      ResponseHelpers.success(res, cachedSummary, 'Monthly summary retrieved from cache');
      return;
    }

    const summary = await AnalyticsService.getMonthlySummary(userId);
    
    CacheService.set(cacheKey, summary, 1800); // Cache for 30 minutes

    ResponseHelpers.success(res, summary, 'Monthly summary retrieved successfully');
  });

  static getTrends = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { days = 30 } = req.query as { days?: number };

    const trendDays = Math.min(365, Math.max(7, Number(days)));

    const cacheKey = `trends:${userId}:${trendDays}`;
    let cachedTrends = CacheService.get(cacheKey);
    
    if (cachedTrends) {
      ResponseHelpers.success(res, cachedTrends, 'Trend data retrieved from cache');
      return;
    }

    const trends = await AnalyticsService.getTrends(userId, trendDays);
    
    const trendsWithMovingAverage = this.calculateMovingAverages(trends, 7);
    
    CacheService.set(cacheKey, trendsWithMovingAverage, 1800); // Cache for 30 minutes

    ResponseHelpers.success(res, trendsWithMovingAverage, 'Trend data retrieved successfully');
  });

  static getDailySummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { date } = req.params;

    if (!DateHelpers.isValidDate(date)) {
      throw badRequest('Invalid date format. Use YYYY-MM-DD');
    }

    if (DateHelpers.isFutureDate(date)) {
      throw badRequest('Cannot get summary for future dates');
    }

    const cacheKey = CacheService.generateDailySummaryKey(userId, date);
    let cachedSummary = CacheService.get(cacheKey);
    
    if (cachedSummary) {
      ResponseHelpers.success(res, cachedSummary, 'Daily summary retrieved from cache');
      return;
    }

    const summary = await AnalyticsService.getDailySummary(userId, new Date(date));
    
    const cacheTime = DateHelpers.isToday(date) ? 300 : 3600; // 5 minutes for today, 1 hour for past days
    CacheService.set(cacheKey, summary, cacheTime);

    ResponseHelpers.success(res, summary, 'Daily summary retrieved successfully');
  });

  static getDateRange = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

    const dateRange = DateHelpers.getDateRange(start_date, end_date);
    const summaries = await Promise.all(
      dateRange.map(date => AnalyticsService.getDailySummary(userId, new Date(date)))
    );

    const totals = summaries.reduce(
      (acc, summary) => ({
        calories: acc.calories + summary.totalCalories,
        protein: acc.protein + summary.totalProtein,
        carbs: acc.carbs + summary.totalCarbs,
        fats: acc.fats + summary.totalFats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const averages = {
      calories: Math.round(totals.calories / summaries.length),
      protein: Math.round((totals.protein / summaries.length) * 10) / 10,
      carbs: Math.round((totals.carbs / summaries.length) * 10) / 10,
      fats: Math.round((totals.fats / summaries.length) * 10) / 10,
    };

    ResponseHelpers.success(res, {
      start_date,
      end_date,
      days: summaries.length,
      dailySummaries: summaries,
      totals,
      averages,
    }, 'Date range analytics retrieved successfully');
  });

  static getProgressReport = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { period = 'week' } = req.query as { period?: 'week' | 'month' };

    let summary;
    if (period === 'week') {
      summary = await AnalyticsService.getWeeklySummary(userId);
    } else {
      summary = await AnalyticsService.getMonthlySummary(userId);
    }

    const progressMetrics = {
      consistency: this.calculateConsistency(summary.dailyData),
      goalAdherence: this.calculateGoalAdherence(summary),
      trends: this.analyzeTrends(summary.dailyData),
    };

    ResponseHelpers.success(res, {
      period,
      summary,
      metrics: progressMetrics,
    }, `${period.charAt(0).toUpperCase() + period.slice(1)} progress report generated successfully`);
  });

  private static calculateMovingAverages(trends: any[], windowSize: number) {
    return trends.map((trend, index) => {
      if (index < windowSize - 1) {
        return { ...trend, movingAverage: null };
      }

      const window = trends.slice(index - windowSize + 1, index + 1);
      const avg = {
        calories: Math.round(window.reduce((sum, t) => sum + t.calories, 0) / windowSize),
        protein: Math.round((window.reduce((sum, t) => sum + t.protein, 0) / windowSize) * 10) / 10,
        carbs: Math.round((window.reduce((sum, t) => sum + t.carbs, 0) / windowSize) * 10) / 10,
        fats: Math.round((window.reduce((sum, t) => sum + t.fats, 0) / windowSize) * 10) / 10,
      };

      return { ...trend, movingAverage: avg };
    });
  }

  private static calculateConsistency(dailyData: any[]): number {
    const daysWithLogs = dailyData.filter(day => day.totalCalories > 0).length;
    return Math.round((daysWithLogs / dailyData.length) * 100);
  }

  private static calculateGoalAdherence(summary: any): any {
    if (!summary.weeklyGoals) {
      return null;
    }

    return {
      calories: Math.round((summary.averages.calories / summary.weeklyGoals.calories) * 100),
      protein: Math.round((summary.averages.protein / summary.weeklyGoals.protein) * 100),
      carbs: Math.round((summary.averages.carbs / summary.weeklyGoals.carbs) * 100),
      fats: Math.round((summary.averages.fats / summary.weeklyGoals.fats) * 100),
    };
  }

  private static analyzeTrends(dailyData: any[]): any {
    if (dailyData.length < 2) {
      return null;
    }

    const first = dailyData[0];
    const last = dailyData[dailyData.length - 1];

    return {
      calories: last.totalCalories - first.totalCalories,
      protein: Math.round((last.totalProtein - first.totalProtein) * 10) / 10,
      carbs: Math.round((last.totalCarbs - first.totalCarbs) * 10) / 10,
      fats: Math.round((last.totalFats - first.totalFats) * 10) / 10,
    };
  }
}