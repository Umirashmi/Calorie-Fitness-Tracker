# Nutrition Tracker API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

---

## 🔐 Authentication Endpoints

### POST /auth/register
Register a new user
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "age": 25,
  "weight": 70,
  "height": 175,
  "activity_level": "moderately_active"
}
```

### POST /auth/login
Login user
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /auth/refresh
Refresh access token
**Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

### GET /auth/me
Get current user profile (Protected)

---

## 👤 User Management

### GET /users/profile
Get user profile (Protected)

### PUT /users/profile
Update user profile (Protected)
**Body:**
```json
{
  "age": 26,
  "weight": 72,
  "height": 175,
  "activity_level": "very_active"
}
```

### DELETE /users/account
Delete user account (Protected)

### GET /users/stats
Get user statistics (Protected)

---

## 🎯 Goals Management

### GET /goals
Get user's nutrition goals (Protected)

### POST /goals
Create or update nutrition goals (Protected)
**Body:**
```json
{
  "daily_calories": 2200,
  "daily_protein": 150,
  "daily_carbs": 275,
  "daily_fats": 73
}
```

### PUT /goals/:id
Update specific goal (Protected)

### DELETE /goals/:id
Delete goal (Protected)

### GET /goals/recommendations
Get personalized goal recommendations (Protected)

---

## 🍽️ Food Management

### GET /foods/search?q=chicken&limit=20
Search foods in database

### GET /foods/external/search?q=apple
Search external nutrition APIs (Protected)

### GET /foods/recent
Get recently logged foods (Protected)

### GET /foods/favorites
Get favorite foods (Protected)

### GET /foods/frequent?days=30&limit=20
Get frequently logged foods (Protected)

### GET /foods/suggestions?meal_type=breakfast
Get food suggestions for meal type (Protected)

### POST /foods
Create custom food (Protected)
**Body:**
```json
{
  "name": "Custom Protein Bar",
  "calories_per_100g": 400,
  "protein_per_100g": 30,
  "carbs_per_100g": 40,
  "fats_per_100g": 15
}
```

### GET /foods/:id
Get food by ID

### PUT /foods/:id
Update custom food (Protected)

### DELETE /foods/:id
Delete custom food (Protected)

### POST /foods/:id/favorite
Toggle food as favorite (Protected)

### GET /foods/:id/favorite
Check if food is favorite (Protected)

### POST /foods/import
Import food from external API (Protected)

---

## 📝 Food Logging

### POST /logs
Log food intake (Protected)
**Body:**
```json
{
  "food_id": "uuid",
  "portion_size": 150,
  "meal_type": "breakfast",
  "logged_date": "2025-01-15"
}
```

### GET /logs
Get food logs with pagination (Protected)
**Query params:** `page`, `limit`, `meal_type`, `start_date`, `end_date`

### GET /logs/today
Get today's food logs (Protected)

### GET /logs/date/:date
Get food logs for specific date (Protected)

### GET /logs/range?start_date=2025-01-01&end_date=2025-01-15
Get food logs for date range (Protected)

### PUT /logs/:id
Update food log (Protected)
**Body:**
```json
{
  "portion_size": 200,
  "meal_type": "lunch"
}
```

### DELETE /logs/:id
Delete food log (Protected)

---

## 💧 Water Logging

### POST /water
Log water intake (Protected)
**Body:**
```json
{
  "amount": 500,
  "logged_date": "2025-01-15",
  "notes": "Morning glass"
}
```

### GET /water
Get water logs with pagination (Protected)

### GET /water/today
Get today's water intake (Protected)

### GET /water/date/:date
Get water intake for specific date (Protected)

### GET /water/week?week_start=2025-01-01
Get weekly water summary (Protected)

### GET /water/stats?days=30
Get water intake statistics (Protected)

### PUT /water/:id
Update water log (Protected)

### DELETE /water/:id
Delete water log (Protected)

---

## 📊 Analytics & Statistics

### GET /analytics/summary/today
Get today's nutrition summary (Protected)

### GET /analytics/summary/week
Get weekly nutrition summary (Protected)

### GET /analytics/summary/month
Get monthly nutrition summary (Protected)

### GET /analytics/summary/date/:date
Get nutrition summary for specific date (Protected)

### GET /analytics/summary/range?start_date=2025-01-01&end_date=2025-01-15
Get nutrition summary for date range (Protected)

### GET /analytics/trends?days=30
Get nutrition trends (Protected)

### GET /analytics/progress?period=week
Get progress report (Protected)

---

## 📱 Dashboard

### GET /dashboard?date=2025-01-15
Get comprehensive dashboard data (Protected)
**Returns:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "hasCompleteProfile": true
    },
    "dailyNutrition": {
      "summary": {
        "totalCalories": 1850,
        "totalProtein": 120,
        "totalCarbs": 200,
        "totalFats": 65,
        "percentageComplete": {
          "calories": 84,
          "protein": 80,
          "carbs": 73,
          "fats": 89
        }
      },
      "goals": {
        "calories": 2200,
        "protein": 150,
        "carbs": 275,
        "fats": 73
      }
    },
    "waterIntake": {
      "totalIntake": 1500,
      "recommendedDaily": 2000,
      "percentageComplete": 75
    },
    "recentFoods": [...],
    "weeklyProgress": {
      "averageCalories": 1950,
      "consistency": 85,
      "daysWithLogs": 6
    },
    "quickStats": {
      "streakDays": 5,
      "totalLogs": 245,
      "favoriteCount": 12,
      "avgWeeklyCalories": 1950
    },
    "profileInsights": {
      "bmi": 22.9,
      "bmiCategory": "normal",
      "bmr": 1680,
      "tdee": 2604,
      "recommendedCalories": 2604
    },
    "recommendations": [
      {
        "type": "nutrition",
        "priority": "medium",
        "message": "You need 30g more protein to reach your goal."
      }
    ]
  }
}
```

### GET /dashboard/quick-actions
Get quick actions for mobile interface (Protected)

---

## 🔍 System Endpoints

### GET /
API information and available endpoints

### GET /health
Health check endpoint

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Authentication: 10 requests per 15 minutes
- Search: 30 requests per minute
- External API: 20 requests per minute

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  createdAt: Date;
  updatedAt: Date;
}
```

### Food
```typescript
interface Food {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  source: 'user' | 'database' | 'api';
   // external_id?: string;
}
```

### FoodLog
```typescript
interface FoodLog {
  id: string;
  user_id: string;
  food_id: string;
  portion_size: number; // grams
  calculated_macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_date: Date;
}
```

### Goal
```typescript
interface Goal {
  id: string;
  user_id: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
}
```

### WaterLog
```typescript
interface WaterLog {
  id: string;
  user_id: string;
  amount: number; // ml
  logged_date: Date;
  notes?: string;
}
```

This API provides comprehensive functionality for:
- ✅ User authentication and profile management
- ✅ Nutrition goal setting and tracking
- ✅ Food database with search and favorites
- ✅ Food and water logging
- ✅ Analytics and progress tracking
- ✅ Dashboard with aggregated data
- ✅ External nutrition API integration
- ✅ Comprehensive error handling and validation
- ✅ Rate limiting and security
- ✅ Caching for performance optimization