import { Request, Response, NextFunction } from 'express';
import { ValidationError, DatabaseError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let customError = { ...error } as AppError;
  
  customError.message = error.message;

  // Sequelize validation error
  if (error instanceof ValidationError) {
    const message = error.errors.map((err) => err.message).join(', ');
    customError = createError(`Validation Error: ${message}`, 400);
  }

  // Sequelize unique constraint error
  if (error instanceof UniqueConstraintError) {
    const fields = error.fields ? Object.keys(error.fields).join(', ') : 'field';
    const message = `Duplicate value for ${fields}. Please use another value.`;
    customError = createError(message, 409);
  }

  // Sequelize foreign key constraint error
  if (error instanceof ForeignKeyConstraintError) {
    const message = 'Invalid reference to related resource';
    customError = createError(message, 400);
  }

  // Sequelize database error
  if (error instanceof DatabaseError) {
    customError = createError('Database operation failed', 500);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    customError = createError('Invalid token', 401);
  }

  if (error.name === 'TokenExpiredError') {
    customError = createError('Token expired', 401);
  }

  // Cast error (invalid ObjectId, UUID, etc.)
  if (error.name === 'CastError') {
    customError = createError('Invalid resource ID format', 400);
  }

  const statusCode = customError.statusCode || 500;
  const message = customError.message || 'Internal Server Error';

  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error,
    }),
  });
};

// Specific error creators
export const unauthorized = (message = 'Unauthorized access') => createError(message, 401);
export const forbidden = (message = 'Forbidden access') => createError(message, 403);
export const notFoundError = (message = 'Resource not found') => createError(message, 404);
export const conflict = (message = 'Conflict with existing resource') => createError(message, 409);
export const badRequest = (message = 'Bad request') => createError(message, 400);
export const internalServerError = (message = 'Internal server error') => createError(message, 500);