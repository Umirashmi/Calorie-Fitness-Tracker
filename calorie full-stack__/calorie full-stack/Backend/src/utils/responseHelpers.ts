import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export class ResponseHelpers {
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      ...(message && { message }),
      ...(data !== undefined && { data }),
    };

    res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message: string = 'Resource created successfully'): void {
    this.success(res, data, message, 201);
  }

  static updated<T>(res: Response, data?: T, message: string = 'Resource updated successfully'): void {
    this.success(res, data, message, 200);
  }

  static deleted(res: Response, message: string = 'Resource deleted successfully'): void {
    this.success(res, undefined, message, 200);
  }

  static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    errors?: Array<{ field?: string; message: string }>
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      ...(errors && { errors }),
    };

    res.status(statusCode).json(response);
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    errors?: Array<{ field?: string; message: string }>
  ): void {
    this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized access'): void {
    this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden access'): void {
    this.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Resource not found'): void {
    this.error(res, message, 404);
  }

  static conflict(res: Response, message: string = 'Conflict with existing resource'): void {
    this.error(res, message, 409);
  }

  static validationError(
    res: Response,
    errors: Array<{ field?: string; message: string }>,
    message: string = 'Validation failed'
  ): void {
    this.error(res, message, 422, errors);
  }

  static internalServerError(res: Response, message: string = 'Internal server error'): void {
    this.error(res, message, 500);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): void {
    const totalPages = Math.ceil(total / limit);
    
    const response: ApiResponse<T[]> = {
      success: true,
      ...(message && { message }),
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    res.status(200).json(response);
  }

  static noContent(res: Response): void {
    res.status(204).send();
  }

  static healthCheck(res: Response): void {
    this.success(res, {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }, 'Service is healthy');
  }

  static methodNotAllowed(res: Response, allowedMethods: string[]): void {
    res.set('Allow', allowedMethods.join(', '));
    this.error(res, 'Method not allowed', 405);
  }

  static rateLimitExceeded(res: Response, retryAfter?: number): void {
    if (retryAfter) {
      res.set('Retry-After', retryAfter.toString());
    }
    this.error(res, 'Rate limit exceeded', 429);
  }

  static serviceUnavailable(res: Response, message: string = 'Service temporarily unavailable'): void {
    this.error(res, message, 503);
  }

  static customStatus<T>(
    res: Response,
    statusCode: number,
    success: boolean,
    message?: string,
    data?: T
  ): void {
    const response: ApiResponse<T> = {
      success,
      ...(message && { message }),
      ...(data !== undefined && { data }),
    };

    res.status(statusCode).json(response);
  }

  static formatValidationErrors(joiError: any): Array<{ field: string; message: string }> {
    return joiError.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
  }

  static parseQueryParams(query: any): {
    page: number;
    limit: number;
    sort: string;
    order: 'ASC' | 'DESC';
  } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const sort = query.sort || 'createdAt';
    const order = query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    return { page, limit, sort, order };
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}