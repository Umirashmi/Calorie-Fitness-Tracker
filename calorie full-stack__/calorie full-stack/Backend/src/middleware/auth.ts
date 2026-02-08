import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../services/authService';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    const decoded = AuthService.verifyAccessToken(token);
    
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.log("error****************************",error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired access token',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = AuthService.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = AuthService.verifyAccessToken(token);
      const user = await User.findByPk(decoded.userId);
      
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

export const requireAuth = authenticateToken;