import dotenv from 'dotenv';

dotenv.config();

export const environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001'),
  
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'nutrition_tracker',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  
  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-key',
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  
  // External APIs
  NUTRITIONIX_APP_ID: process.env.NUTRITIONIX_APP_ID || '',
  NUTRITIONIX_API_KEY: process.env.NUTRITIONIX_API_KEY || '',
  EDAMAM_APP_ID: process.env.EDAMAM_APP_ID || '',
  EDAMAM_APP_KEY: process.env.EDAMAM_APP_KEY || '',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',
  
  // Bcrypt
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  
  // Cache
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
};

export const isDevelopment = environment.NODE_ENV === 'development';
export const isProduction = environment.NODE_ENV === 'production';
export const isTest = environment.NODE_ENV === 'test';