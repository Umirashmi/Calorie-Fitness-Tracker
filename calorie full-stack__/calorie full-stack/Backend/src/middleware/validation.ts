import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors,
      });
      return;
    }

    next();
  };
};

export const authValidation = {
  register: Joi.object({
    name: Joi.string().min(3).max(255).optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    age: Joi.number().integer().min(13).max(120).optional(),
    weight: Joi.number().min(20).max(1000).optional(),
    height: Joi.number().min(50).max(300).optional(),
    activity_level: Joi.string()
      .valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')
      .optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

export const userValidation = {
  updateProfile: Joi.object({
    name: Joi.string().min(3).max(255).optional(),
    age: Joi.number().integer().min(13).max(120).optional(),
    weight: Joi.number().min(20).max(1000).optional(),
    height: Joi.number().min(50).max(300).optional(),
    activity_level: Joi.string()
      .valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')
      .optional(),
  }),
};

export const goalValidation = {
  createGoal: Joi.object({
    calories: Joi.number().integer().min(800).max(10000).required(),
    protein: Joi.number().min(0).max(1000).required(),
    carbs: Joi.number().min(0).max(2000).required(),
    fats: Joi.number().min(0).max(500).required(),
  }),

  updateGoal: Joi.object({
    calories: Joi.number().integer().min(800).max(10000).optional(),
    protein: Joi.number().min(0).max(1000).optional(),
    carbs: Joi.number().min(0).max(2000).optional(),
    fats: Joi.number().min(0).max(500).optional(),
  }),
};

export const foodValidation = {
  createFood: Joi.object({
    name: Joi.string().trim().min(1).max(200).required(),
    calories_per_100g: Joi.number().min(0).max(9000).required(),
    protein_per_100g: Joi.number().min(0).max(100).required(),
    carbs_per_100g: Joi.number().min(0).max(100).required(),
    fats_per_100g: Joi.number().min(0).max(100).required(),
    serving_size: Joi.number().min(0.1).max(10000).optional(),
    serving_unit: Joi.string().trim().min(1).max(20).optional(),
  }),

  searchQuery: Joi.object({
    q: Joi.string().trim().min(1).max(100).required(),
    limit: Joi.number().integer().min(1).max(50).optional(),
  }),
};

export const logValidation = {
  createLog: Joi.object({
    food_id: Joi.string().uuid().required(),
    portion_size: Joi.number().min(0.1).max(10000).required(),
    meal_type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
    logged_date: Joi.date().optional(),
  }),

  updateLog: Joi.object({
    portion_size: Joi.number().min(0.1).max(10000).optional(),
    meal_type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').optional(),
    logged_date: Joi.date().optional(),
  }),

  dateRange: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().min(Joi.ref('start_date')).required(),
  }),
};

export const analyticsValidation = {
  trendsQuery: Joi.object({
    days: Joi.number().integer().min(1).max(365).optional(),
  }),
};