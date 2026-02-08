import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApisClient } from './api';
import {
  ApiResponse,
  Food,
  FoodEntry,
  FoodSearchResult,
  DailyLog,
  MacroGoals,
  GoalProgress,
  NutritionSummary,
  WeeklyStats,
  MonthlyStats,
  WaterLog,
  MealType,
} from '../types/nutrition';

const CACHE_KEYS = {
  RECENT_FOODS: '@recent_foods',
  FAVORITE_FOODS: '@favorite_foods',
  DAILY_GOALS: '@daily_goals',
  OFFLINE_LOGS: '@offline_logs',
  OFFLINE_WATER_LOGS: '@offline_water_logs',
};

class NutritionService {
  // Food search and management
  async searchFoods(
    query: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<FoodSearchResult>> {
    try {
      // Try external API first
      const externalResult = await this.searchExternalFoodDatabase(query, page, pageSize);
      if (externalResult.success) {
        return externalResult;
      }

      // Fallback to internal database
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      return ApisClient.makeRequest<FoodSearchResult>(`/foods/search?${params}`);
    } catch (error) {
      console.error('Food search failed:', error);
      return {
        success: false,
        data: { foods: [], total: 0, page, pageSize },
        error: 'Search failed',
      };
    }
  }

  private async searchExternalFoodDatabase(
    query: string,
    page: number,
    pageSize: number
  ): Promise<ApiResponse<FoodSearchResult>> {
    // Integrate with external APIs like USDA FoodData Central, Open Food Facts, etc.
    // This is a mock implementation - replace with actual API calls
    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=YOUR_API_KEY&query=${encodeURIComponent(query)}&pageSize=${pageSize}&pageNumber=${page}`
      );
      
      if (!response.ok) {
        throw new Error('External API failed');
      }

      const data = await response.json();
      
      // Transform external API response to our Food interface
      const transformedFoods: Food[] = data.foods?.map((food: any) => ({
        id: `external_${food.fdcId}`,
        name: food.description || food.brandedFoodCategory || 'Unknown Food',
        brand: food.brandOwner,
        barcode: food.gtinUpc,
        servingSize: 100,
        servingSizeUnit: 'g',
        calories: this.extractNutrient(food.foodNutrients, '208') || 0,
        protein: this.extractNutrient(food.foodNutrients, '203') || 0,
        carbs: this.extractNutrient(food.foodNutrients, '205') || 0,
        fats: this.extractNutrient(food.foodNutrients, '204') || 0,
        fiber: this.extractNutrient(food.foodNutrients, '291'),
        sugar: this.extractNutrient(food.foodNutrients, '269'),
        sodium: this.extractNutrient(food.foodNutrients, '307'),
        isVerified: true,
      })) || [];

      return {
        success: true,
        data: {
          foods: transformedFoods,
          total: data.totalHits || 0,
          page,
          pageSize,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: { foods: [], total: 0, page, pageSize },
        error: 'External search failed',
      };
    }
  }

  private extractNutrient(nutrients: any[], nutrientNumber: string): number | undefined {
    const nutrient = nutrients?.find((n) => n.nutrientNumber === nutrientNumber);
    return nutrient ? parseFloat(nutrient.value) : undefined;
  }

  async getFoodById(foodId: string): Promise<ApiResponse<Food>> {
    return ApisClient.makeRequest<Food>(`/foods/${foodId}`);
  }

  async createCustomFood(foodData: Omit<Food, 'id' | 'isVerified' | 'createdBy'>): Promise<ApiResponse<Food>> {
    return ApisClient.makeRequest<Food>('/foods', {
      method: 'POST',
      body: JSON.stringify(foodData),
    });
  }

  // Recent and favorite foods
  async getRecentFoods(): Promise<Food[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.RECENT_FOODS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.warn('Failed to get recent foods:', error);
      return [];
    }
  }

  async addToRecentFoods(food: Food): Promise<void> {
    try {
      const recentFoods = await this.getRecentFoods();
      const filtered = recentFoods.filter((f) => f.id !== food.id);
      const updated = [food, ...filtered].slice(0, 20); // Keep last 20
      await AsyncStorage.setItem(CACHE_KEYS.RECENT_FOODS, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to add to recent foods:', error);
    }
  }

  async getFavoriteFoods(): Promise<Food[]> {
    try {
      // Always fetch fresh data from API, no caching
      const response = await ApisClient.makeRequest<Food[]>('/user/favorites');
      if (response.success) {
        // Update cache but don't rely on it
        await AsyncStorage.setItem(CACHE_KEYS.FAVORITE_FOODS, JSON.stringify(response.data));
        return response.data;
      }
      
      // Fallback to cache only if API fails
      const cached = await AsyncStorage.getItem(CACHE_KEYS.FAVORITE_FOODS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.warn('Failed to get favorite foods:', error);
      // Try cache as last resort
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEYS.FAVORITE_FOODS);
        return cached ? JSON.parse(cached) : [];
      } catch {
        return [];
      }
    }
  }

  async toggleFavoriteFood(foodId: string): Promise<ApiResponse<{ isFavorite: boolean }>> {
    const response = await ApisClient.makeRequest<{ isFavorite: boolean }>(
      `/user/favorites/${foodId}`,
      { method: 'POST' }
    );

    if (response.success) {
      // Invalidate favorites cache
      await AsyncStorage.removeItem(CACHE_KEYS.FAVORITE_FOODS);
    }

    return response;
  }

  // Food logging
  async logFood(
    foodId: string,
    quantity: number,
    servingSize: number,
    mealType: MealType,
    date?: string
  ): Promise<ApiResponse<FoodEntry>> {
    const logDate = date || new Date().toLocaleDateString('en-CA');
    
    const logData = {
      food_id: foodId,
      portion_size: quantity * servingSize, // Backend expects total portion size in grams
      meal_type: mealType,
      logged_date: logDate,
    };

    const response = await ApisClient.logFood(logData);

    // Cache offline if request fails
    if (!response.success) {
      await this.cacheOfflineLog(logData);
    }

    return response;
  }

  async updateFoodEntry(
    entryId: string,
    updates: Partial<Pick<FoodEntry, 'quantity' | 'servingSize' | 'mealType'>>
  ): Promise<ApiResponse<FoodEntry>> {
    const backendUpdates: any = {};
    
    if (updates.quantity !== undefined && updates.servingSize !== undefined) {
      backendUpdates.portion_size = updates.quantity * updates.servingSize;
    }
    if (updates.mealType !== undefined) {
      backendUpdates.meal_type = updates.mealType;
    }
    
    return ApisClient.updateFoodLog(entryId, backendUpdates);
  }

  async deleteFoodEntry(entryId: string): Promise<ApiResponse<void>> {
    return ApisClient.deleteFoodLog(entryId);
  }

  // Daily logs and progress
  async getDailyLog(date: string): Promise<ApiResponse<DailyLog>> {
    return ApisClient.getDailyLogs(date);
  }

  async getDailyProgress(date: string): Promise<GoalProgress | null> {
    try {
      const [logResponse, goalsResponse] = await Promise.all([
        this.getDailyLog(date),
        this.getDailyGoals(),
      ]);

      if (!logResponse.success || !goalsResponse) {
        return null;
      }

      const log = logResponse.data;
      const current: NutritionSummary = {
        calories: log.totalCalories,
        protein: log.totalProtein,
        carbs: log.totalCarbs,
        fats: log.totalFats,
        fiber: log.totalFiber,
        sugar: log.totalSugar,
        sodium: log.totalSodium,
      };

      const percentages = {
        calories: goalsResponse.calories > 0 ? (current.calories / goalsResponse.calories) * 100 : 0,
        protein: goalsResponse.protein > 0 ? (current.protein / goalsResponse.protein) * 100 : 0,
        carbs: goalsResponse.carbs > 0 ? (current.carbs / goalsResponse.carbs) * 100 : 0,
        fats: goalsResponse.fats > 0 ? (current.fats / goalsResponse.fats) * 100 : 0,
      };

      return {
        current,
        target: goalsResponse,
        percentages,
      };
    } catch (error) {
      console.error('Failed to get daily progress:', error);
      return null;
    }
  }

  // Goals management
  async getDailyGoals(): Promise<MacroGoals | null> {
    try {
      // Always fetch fresh data from API, no caching
      const response = await ApisClient.makeRequest<any>('/user/goals');
      if (response.success && response.data) {
        // Check if user has goals set
        if (response.data.hasGoals && response.data.goal) {
          const goals: MacroGoals = {
            calories: response.data.goal.daily_calories,
            protein: response.data.goal.daily_protein,
            carbs: response.data.goal.daily_carbs,
            fats: response.data.goal.daily_fats,
          };
          // Update cache but don't rely on it
          await AsyncStorage.setItem(CACHE_KEYS.DAILY_GOALS, JSON.stringify(goals));
          return goals;
        } else {
          // No goals set, return null
          return null;
        }
      }
      
      // Fallback to cache only if API fails
      const cached = await AsyncStorage.getItem(CACHE_KEYS.DAILY_GOALS);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to get daily goals:', error);
      // Try cache as last resort
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEYS.DAILY_GOALS);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
  }

  async updateDailyGoals(goals: MacroGoals): Promise<ApiResponse<MacroGoals>> {
    const response = await ApisClient.makeRequest<any>('/user/goals', {
      method: 'PUT',
      body: JSON.stringify(goals),
    });

    if (response.success && response.data) {
      // Transform the backend response format to frontend format
      const transformedGoals: MacroGoals = {
        calories: response.data.calories,
        protein: response.data.protein,
        carbs: response.data.carbs,
        fats: response.data.fats,
      };
      await AsyncStorage.setItem(CACHE_KEYS.DAILY_GOALS, JSON.stringify(transformedGoals));
      
      return {
        success: true,
        data: transformedGoals,
        error: response.error,
      };
    }

    return {
      success: false,
      data: goals,
      error: response.error || 'Failed to update goals',
    };
  }

  // Statistics
  async getWeeklyStats(weekStart: string): Promise<ApiResponse<WeeklyStats>> {
    return ApisClient.makeRequest<WeeklyStats>(`/stats/weekly?start=${weekStart}`);
  }

  async getMonthlyStats(monthStart: string): Promise<ApiResponse<MonthlyStats>> {
    return ApisClient.makeRequest<MonthlyStats>(`/stats/monthly?start=${monthStart}`);
  }

  // Water logging
  async logWater(amount: number, date?: string): Promise<ApiResponse<WaterLog>> {
    const logDate = date || new Date().toLocaleDateString('en-CA');
    
    const logData = { amount, date: logDate };
    
    const response = await ApisClient.makeRequest<WaterLog>('/logs/water', {
      method: 'POST',
      body: JSON.stringify(logData),
    });

    // Cache offline if request fails
    if (!response.success) {
      await this.cacheOfflineWaterLog(logData);
    }

    return response;
  }

  async getDailyWaterIntake(date: string): Promise<ApiResponse<{ total: number; logs: WaterLog[] }>> {
    return ApisClient.makeRequest<{ total: number; logs: WaterLog[] }>(`/logs/water/${date}`);
  }

  // Offline support
  private async cacheOfflineLog(logData: any): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_LOGS);
      const logs = existing ? JSON.parse(existing) : [];
      logs.push({ ...logData, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to cache offline log:', error);
    }
  }

  private async cacheOfflineWaterLog(logData: any): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_WATER_LOGS);
      const logs = existing ? JSON.parse(existing) : [];
      logs.push({ ...logData, timestamp: new Date().toISOString() });
      await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_WATER_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to cache offline water log:', error);
    }
  }

  async syncOfflineLogs(): Promise<void> {
    try {
      // Sync food logs
      await this.syncOfflineFoodLogs();
      
      // Sync water logs
      await this.syncOfflineWaterLogs();
    } catch (error) {
      console.error('Failed to sync offline logs:', error);
    }
  }

  private async syncOfflineFoodLogs(): Promise<void> {
    try {
      const offlineLogs = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_LOGS);
      if (!offlineLogs) return;

      const logs = JSON.parse(offlineLogs);
      const successful: number[] = [];

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const response = await ApisClient.makeRequest('/logs/food', {
          method: 'POST',
          body: JSON.stringify(log),
        });

        if (response.success) {
          successful.push(i);
        }
      }

      // Remove successfully synced logs
      const remainingLogs = logs.filter((_: any, index: number) => !successful.includes(index));
      if (remainingLogs.length === 0) {
        await AsyncStorage.removeItem(CACHE_KEYS.OFFLINE_LOGS);
      } else {
        await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_LOGS, JSON.stringify(remainingLogs));
      }
    } catch (error) {
      console.error('Failed to sync offline food logs:', error);
    }
  }

  private async syncOfflineWaterLogs(): Promise<void> {
    try {
      const offlineWaterLogs = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_WATER_LOGS);
      if (!offlineWaterLogs) return;

      const logs = JSON.parse(offlineWaterLogs);
      const successful: number[] = [];

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const response = await ApisClient.makeRequest('/logs/water', {
          method: 'POST',
          body: JSON.stringify(log),
        });

        if (response.success) {
          successful.push(i);
        }
      }

      // Remove successfully synced logs
      const remainingLogs = logs.filter((_: any, index: number) => !successful.includes(index));
      if (remainingLogs.length === 0) {
        await AsyncStorage.removeItem(CACHE_KEYS.OFFLINE_WATER_LOGS);
      } else {
        await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_WATER_LOGS, JSON.stringify(remainingLogs));
      }
    } catch (error) {
      console.error('Failed to sync offline water logs:', error);
    }
  }

  // Cache management
  async clearAllCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.RECENT_FOODS),
        AsyncStorage.removeItem(CACHE_KEYS.FAVORITE_FOODS),
        AsyncStorage.removeItem(CACHE_KEYS.DAILY_GOALS),
        AsyncStorage.removeItem(CACHE_KEYS.OFFLINE_LOGS),
      ]);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
}

export const nutritionService = new NutritionService();
export default nutritionService;