import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthService } from '../services/authService';
import { ResponseHelpers } from '../utils/responseHelpers';
import { asyncHandler, badRequest, unauthorized, conflict } from '../middleware/errorHandler';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, age, weight, height, gender, activity_level } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw conflict('User with this email already exists');
    }

    const hashedPassword = await AuthService.hashPassword(password);

    const user = await User.create({
      name,
      email,
      password_hash: hashedPassword,
      age,
      weight,
      height,
      gender,
      activity_level,
    });

    const tokenPayload = { userId: user.id, email: user.email };
    const tokens = AuthService.generateTokenPair(tokenPayload);

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
    };

    // Structure expected by Frontend
    ResponseHelpers.created(res, {
      user: userResponse,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      },
    }, 'User registered successfully');
  });

  static login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw unauthorized('Invalid email or password');
    }

    const isValidPassword = await AuthService.comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw unauthorized('Invalid email or password');
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const tokens = AuthService.generateTokenPair(tokenPayload);

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
    };

    // Structure expected by Frontend
    ResponseHelpers.success(res, {
      user: userResponse,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      },
    }, 'Login successful');
  });

  static refresh = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw badRequest('Refresh token is required');
    }

    try {
      const decoded = AuthService.verifyRefreshToken(refreshToken);
      
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw unauthorized('User not found');
      }

      const tokenPayload = { userId: user.id, email: user.email };
      const newTokens = AuthService.generateTokenPair(tokenPayload);

      ResponseHelpers.success(res, {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      }, 'Tokens refreshed successfully');
    } catch (error) {
      throw unauthorized('Invalid refresh token');
    }
  });

  static logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    ResponseHelpers.success(res, null, 'Logout successful');
  });

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
}