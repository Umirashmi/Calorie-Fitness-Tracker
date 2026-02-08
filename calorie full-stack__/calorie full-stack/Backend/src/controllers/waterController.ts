import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { WaterLog } from '../models/WaterLog';
import { ResponseHelpers } from '../utils/responseHelpers';
import { DateHelpers } from '../utils/dateHelpers';
import { CustomValidators } from '../utils/validators';
import { asyncHandler, badRequest, notFoundError } from '../middleware/errorHandler';

export class WaterController {
  static logWater = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { amount, logged_date, notes } = req.body;

    if (!CustomValidators.isPositiveNumber(amount) || amount > 5000) {
      throw badRequest('Amount must be between 1 and 5000 ml');
    }

    const logDate = logged_date ? DateHelpers.normalizeDate(logged_date) : DateHelpers.getToday();

    const waterLog = await WaterLog.create({
      user_id: userId,
      amount,
      logged_date: new Date(logDate),
      notes: notes?.trim(),
    });

    // Transform to match Frontend WaterLog interface
    const frontendResponse = {
      id: waterLog.id,
      userId: userId,
      amount: waterLog.amount,
      loggedAt: waterLog.createdAt.toISOString(),
      date: waterLog.logged_date.toString(),
    };

    ResponseHelpers.created(res, frontendResponse, 'Water intake logged successfully');
  });

  static getWaterLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { page = 1, limit = 50, start_date, end_date } = req.query as {
      page?: number;
      limit?: number;
      start_date?: string;
      end_date?: string;
    };

    const offset = ResponseHelpers.calculateOffset(Number(page), Number(limit));
    const whereClause: any = { user_id: userId };

    if (start_date && end_date) {
      if (!DateHelpers.isValidDate(start_date) || !DateHelpers.isValidDate(end_date)) {
        throw badRequest('Invalid date format. Use YYYY-MM-DD');
      }
      
      whereClause.logged_date = {
        [Op.between]: [start_date, end_date],
      };
    }

    const { count, rows: logs } = await WaterLog.findAndCountAll({
      where: whereClause,
      order: [['logged_date', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    ResponseHelpers.paginated(res, logs, Number(page), Number(limit), count, 'Water logs retrieved successfully');
  });

  static getDailyWaterIntake = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { date } = req.params;

    const targetDate = date || DateHelpers.getToday();

    if (!DateHelpers.isValidDate(targetDate)) {
      throw badRequest('Invalid date format. Use YYYY-MM-DD');
    }

    const logs = await WaterLog.findAll({
      where: {
        user_id: userId,
        logged_date: targetDate,
      },
      order: [['createdAt', 'ASC']],
    });

    const totalIntake = logs.reduce((sum, log) => sum + log.amount, 0);
    const recommendedDaily = 2000; // 2L recommended daily intake

    // Transform logs to match Frontend WaterLog structure
    const transformedLogs = logs.map(log => ({
      id: log.id,
      userId: userId,
      amount: log.amount,
      loggedAt: log.createdAt.toISOString(),
      date: log.logged_date.toString(),
    }));

    const summary = {
      total: totalIntake,
      logs: transformedLogs,
    };

    ResponseHelpers.success(res, summary, 'Daily water intake retrieved successfully');
  });

  static updateWaterLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { id } = req.params;
    const { amount, logged_date, notes } = req.body;

    if (!CustomValidators.isValidUUID(id)) {
      throw badRequest('Invalid water log ID format');
    }

    const waterLog = await WaterLog.findOne({
      where: { id, user_id: userId },
    });

    if (!waterLog) {
      throw notFoundError('Water log not found');
    }

    const updateData: any = {};

    if (amount !== undefined) {
      if (!CustomValidators.isPositiveNumber(amount) || amount > 5000) {
        throw badRequest('Amount must be between 1 and 5000 ml');
      }
      updateData.amount = amount;
    }

    if (logged_date !== undefined) {
      updateData.logged_date = DateHelpers.normalizeDate(logged_date);
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim();
    }

    const updatedLog = await waterLog.update(updateData);

    ResponseHelpers.updated(res, {
      id: updatedLog.id,
      amount: updatedLog.amount,
      logged_date: updatedLog.logged_date,
      notes: updatedLog.notes,
      updatedAt: updatedLog.updatedAt,
    }, 'Water log updated successfully');
  });

  static deleteWaterLog = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { id } = req.params;

    if (!CustomValidators.isValidUUID(id)) {
      throw badRequest('Invalid water log ID format');
    }

    const waterLog = await WaterLog.findOne({
      where: { id, user_id: userId },
    });

    if (!waterLog) {
      throw notFoundError('Water log not found');
    }

    await waterLog.destroy();

    ResponseHelpers.deleted(res, 'Water log deleted successfully');
  });

  static getWeeklyWaterSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { week_start } = req.query as { week_start?: string };

    const startDate = week_start || DateHelpers.getDaysAgo(6);
    const endDate = DateHelpers.getToday();

    if (!DateHelpers.isValidDate(startDate)) {
      throw badRequest('Invalid start date format. Use YYYY-MM-DD');
    }

    const logs = await WaterLog.findAll({
      where: {
        user_id: userId,
        logged_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const dailyTotals = new Map<string, number>();
    const dateRange = DateHelpers.getDateRange(startDate, endDate);

    // Initialize all dates with 0
    dateRange.forEach(date => {
      dailyTotals.set(date, 0);
    });

    // Sum up daily intakes
    logs.forEach(log => {
      const dateKey = log.logged_date.toString();
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + log.amount);
    });

    const weeklyData = Array.from(dailyTotals.entries()).map(([date, total]) => ({
      date,
      totalIntake: total,
      percentageComplete: Math.round((total / 2000) * 100),
    }));

    const weeklyTotal = Array.from(dailyTotals.values()).reduce((sum, total) => sum + total, 0);
    const weeklyAverage = Math.round(weeklyTotal / dateRange.length);

    ResponseHelpers.success(res, {
      startDate,
      endDate,
      dailyData: weeklyData,
      weeklyTotal,
      weeklyAverage,
      recommendedDaily: 2000,
    }, 'Weekly water summary retrieved successfully');
  });

  static getTodaysWaterIntake = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const today = DateHelpers.getToday();

    req.params.date = today;
    await WaterController.getDailyWaterIntake(req, res, next);
  });

  static getWaterStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { days = 30 } = req.query as { days?: number };

    const dayCount = Math.min(365, Math.max(1, Number(days)));
    const startDate = DateHelpers.getDaysAgo(dayCount - 1);
    const endDate = DateHelpers.getToday();

    const logs = await WaterLog.findAll({
      where: {
        user_id: userId,
        logged_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    const dailyTotals = new Map<string, number>();
    const dateRange = DateHelpers.getDateRange(startDate, endDate);

    dateRange.forEach(date => {
      dailyTotals.set(date, 0);
    });

    logs.forEach(log => {
      const dateKey = log.logged_date.toString();
      const current = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, current + log.amount);
    });

    const allTotals = Array.from(dailyTotals.values());
    const totalIntake = allTotals.reduce((sum, total) => sum + total, 0);
    const averageDaily = Math.round(totalIntake / dayCount);
    const daysWithLogging = allTotals.filter(total => total > 0).length;
    const consistency = Math.round((daysWithLogging / dayCount) * 100);
    const goalAchievementDays = allTotals.filter(total => total >= 2000).length;
    const goalAchievementRate = Math.round((goalAchievementDays / dayCount) * 100);

    ResponseHelpers.success(res, {
      period: `${dayCount} days`,
      totalIntake,
      averageDaily,
      consistency,
      daysWithLogging,
      goalAchievementDays,
      goalAchievementRate,
      recommendedDaily: 2000,
    }, 'Water intake statistics retrieved successfully');
  });
}