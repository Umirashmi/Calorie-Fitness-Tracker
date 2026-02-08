import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Goal } from '../models/Goal';
import { FoodLog } from '../models/FoodLog';
import { ResponseHelpers } from '../utils/responseHelpers';
import { asyncHandler, notFoundError } from '../middleware/errorHandler';

export class UserController {
  static getProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user!;

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      activity_level: user.activity_level,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    ResponseHelpers.success(res, userResponse, 'Profile retrieved successfully');
  });

  static updateProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;
    const { name, age, weight, height, gender, activity_level } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw notFoundError('User not found');
    }

    const updateData: Partial<typeof req.body> = {};
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;
    if (gender !== undefined) updateData.gender = gender;
    if (activity_level !== undefined) updateData.activity_level = activity_level;

    await user.update(updateData);

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      age: user.age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      activity_level: user.activity_level,
      updatedAt: user.updatedAt,
    };

    ResponseHelpers.updated(res, userResponse, 'Profile updated successfully');
  });

  static deleteAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;

    const user = await User.findByPk(userId);
    if (!user) {
      throw notFoundError('User not found');
    }

    await Goal.destroy({ where: { user_id: userId } });
    await FoodLog.destroy({ where: { user_id: userId } });
    await user.destroy();

    ResponseHelpers.deleted(res, 'Account deleted successfully');
  });

  static getStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId!;

    const totalLogs = await FoodLog.count({ where: { user_id: userId } });
    const user = await User.findByPk(userId, { attributes: ['createdAt'] });
    const goals = await Goal.count({ where: { user_id: userId } });

    const stats = {
      totalFoodLogs: totalLogs,
      totalGoals: goals,
      accountAge: user ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    };

    ResponseHelpers.success(res, stats, 'User statistics retrieved successfully');
  });
}