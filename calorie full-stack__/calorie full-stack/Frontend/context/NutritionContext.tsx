import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { nutritionService } from '../services/nutrition';
import { ThemeContextType } from '../providers/AppProviders';
import {
  Food,
  FoodEntry,
  DailyLog,
  MacroGoals,
  GoalProgress,
  WeeklyStats,
  MonthlyStats,
  WaterLog,
  MealType,
} from '../types/nutrition';

interface NutritionState {
  currentDate: string;
  dailyLog: DailyLog | null;
  goalProgress: GoalProgress | null;
  recentFoods: Food[];
  favoriteFoods: Food[];
  dailyGoals: MacroGoals | null;
  weeklyStats: WeeklyStats | null;
  monthlyStats: MonthlyStats | null;
  waterLogs: WaterLog[];
  totalWaterIntake: number;
  isLoading: boolean;
  error: string | null;
  lastSyncTime: string | null;
  isInitialLoad: boolean;
}

type NutritionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_DATE'; payload: string }
  | { type: 'SET_DAILY_LOG'; payload: DailyLog | null }
  | { type: 'SET_GOAL_PROGRESS'; payload: GoalProgress | null }
  | { type: 'SET_RECENT_FOODS'; payload: Food[] }
  | { type: 'SET_FAVORITE_FOODS'; payload: Food[] }
  | { type: 'SET_DAILY_GOALS'; payload: MacroGoals | null }
  | { type: 'SET_WEEKLY_STATS'; payload: WeeklyStats | null }
  | { type: 'SET_MONTHLY_STATS'; payload: MonthlyStats | null }
  | { type: 'SET_WATER_LOGS'; payload: WaterLog[] }
  | { type: 'SET_TOTAL_WATER'; payload: number }
  | { type: 'ADD_FOOD_ENTRY'; payload: FoodEntry }
  | { type: 'UPDATE_FOOD_ENTRY'; payload: FoodEntry }
  | { type: 'REMOVE_FOOD_ENTRY'; payload: string }
  | { type: 'ADD_WATER_LOG'; payload: WaterLog }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'SET_INITIAL_LOAD_COMPLETE' }
  | { type: 'RESET_STATE' };

interface NutritionContextType extends NutritionState {
  // Food logging
  logFood: (
    foodId: string,
    quantity: number,
    servingSize: number,
    mealType: MealType,
    date?: string
  ) => Promise<boolean>;
  updateFoodEntry: (
    entryId: string,
    updates: Partial<Pick<FoodEntry, 'quantity' | 'servingSize' | 'mealType'>>
  ) => Promise<boolean>;
  deleteFoodEntry: (entryId: string) => Promise<boolean>;

  // Water logging
  logWater: (amount: number, date?: string) => Promise<boolean>;

  // Goals management
  updateDailyGoals: (goals: MacroGoals) => Promise<boolean>;

  // Data fetching
  refreshDailyData: (date?: string) => Promise<void>;
  refreshWeeklyStats: () => Promise<void>;
  refreshMonthlyStats: () => Promise<void>;
  loadRecentFoods: () => Promise<void>;
  loadFavoriteFoods: () => Promise<void>;
  loadDailyGoals: () => Promise<void>;

  // Favorites management
  toggleFavoriteFood: (foodId: string) => Promise<boolean>;
  addToRecentFoods: (food: Food) => Promise<void>;

  // Date navigation
  setCurrentDate: (date: string) => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;

  // Sync
  syncOfflineData: () => Promise<void>;
  clearError: () => void;
  resetState: () => void;

  // Theme
  themeContext: ThemeContextType;
}

const initialState: NutritionState = {
  currentDate: new Date().toLocaleDateString('en-CA'),
  dailyLog: null,
  goalProgress: null,
  recentFoods: [],
  favoriteFoods: [],
  dailyGoals: null,
  weeklyStats: null,
  monthlyStats: null,
  waterLogs: [],
  totalWaterIntake: 0,
  isLoading: false,
  error: null,
  lastSyncTime: null,
  isInitialLoad: true,
};

const nutritionReducer = (state: NutritionState, action: NutritionAction): NutritionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CURRENT_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_DAILY_LOG':
      return { ...state, dailyLog: action.payload };
    case 'SET_GOAL_PROGRESS':
      return { ...state, goalProgress: action.payload };
    case 'SET_RECENT_FOODS':
      return { ...state, recentFoods: action.payload };
    case 'SET_FAVORITE_FOODS':
      return { ...state, favoriteFoods: action.payload };
    case 'SET_DAILY_GOALS':
      return { ...state, dailyGoals: action.payload };
    case 'SET_WEEKLY_STATS':
      return { ...state, weeklyStats: action.payload };
    case 'SET_MONTHLY_STATS':
      return { ...state, monthlyStats: action.payload };
    case 'SET_WATER_LOGS':
      return { ...state, waterLogs: action.payload };
    case 'SET_TOTAL_WATER':
      return { ...state, totalWaterIntake: action.payload };
    case 'ADD_FOOD_ENTRY':
      return {
        ...state,
        dailyLog: state.dailyLog
          ? { ...state.dailyLog, entries: [...state.dailyLog.entries, action.payload] }
          : null,
      };
    case 'UPDATE_FOOD_ENTRY':
      return {
        ...state,
        dailyLog: state.dailyLog
          ? {
              ...state.dailyLog,
              entries: state.dailyLog.entries.map((entry) =>
                entry.id === action.payload.id ? action.payload : entry
              ),
            }
          : null,
      };
    case 'REMOVE_FOOD_ENTRY':
      return {
        ...state,
        dailyLog: state.dailyLog
          ? {
              ...state.dailyLog,
              entries: state.dailyLog.entries.filter((entry) => entry.id !== action.payload),
            }
          : null,
      };
    case 'ADD_WATER_LOG':
      return {
        ...state,
        waterLogs: [...state.waterLogs, action.payload],
        totalWaterIntake: state.totalWaterIntake + action.payload.amount,
      };
    case 'SET_LAST_SYNC':
      return { ...state, lastSyncTime: action.payload };
    case 'SET_INITIAL_LOAD_COMPLETE':
      return { ...state, isInitialLoad: false };
    case 'RESET_STATE':
      return { ...initialState, isInitialLoad: false };
    default:
      return state;
  }
};

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

interface NutritionProviderProps {
  children: ReactNode;
  themeContext: ThemeContextType;
}

export const NutritionProvider: React.FC<NutritionProviderProps> = ({ 
  children, 
  themeContext 
}) => {
  const [state, dispatch] = useReducer(nutritionReducer, initialState);
  
  // Reset nutrition state when logged out (auth context provides this)
  const resetOnLogout = React.useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Expose reset function to AuthContext
  React.useEffect(() => {
    // Store reset function globally so AuthContext can access it
    (global as any).resetNutritionState = resetOnLogout;
    return () => {
      delete (global as any).resetNutritionState;
    };
  }, [resetOnLogout]);

  // Date navigation
  const setCurrentDate = (date: string) => {
    dispatch({ type: 'SET_CURRENT_DATE', payload: date });
  };

  const goToPreviousDay = () => {
    const prevDate = new Date(state.currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setCurrentDate(prevDate.toLocaleDateString('en-CA'));
  };

  const goToNextDay = () => {
    const nextDate = new Date(state.currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(nextDate.toLocaleDateString('en-CA'));
  };

  const goToToday = () => {
    setCurrentDate(new Date().toLocaleDateString('en-CA'));
  };

  // Food logging
  const logFood = async (
    foodId: string,
    quantity: number,
    servingSize: number,
    mealType: MealType,
    date?: string
  ): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await nutritionService.logFood(
        foodId,
        quantity,
        servingSize,
        mealType,
        date || state.currentDate
      );

      if (response.success && response.data) {
        dispatch({ type: 'ADD_FOOD_ENTRY', payload: response.data });
        // Refresh daily data to get updated totals and show fresh data immediately
        await refreshDailyData(date || state.currentDate);
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to log food' });
        // Even if API fails, refresh data to show any offline cached entries
        await refreshDailyData(date || state.currentDate);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log food';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateFoodEntry = async (
    entryId: string,
    updates: Partial<Pick<FoodEntry, 'quantity' | 'servingSize' | 'mealType'>>
  ): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await nutritionService.updateFoodEntry(entryId, updates);

      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_FOOD_ENTRY', payload: response.data });
        await refreshDailyData(state.currentDate);
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update food entry' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update food entry';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteFoodEntry = async (entryId: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await nutritionService.deleteFoodEntry(entryId);

      if (response.success) {
        dispatch({ type: 'REMOVE_FOOD_ENTRY', payload: entryId });
        await refreshDailyData(state.currentDate);
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to delete food entry' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete food entry';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Water logging
  const logWater = async (amount: number, date?: string): Promise<boolean> => {
    try {
      const targetDate = date || state.currentDate;
      const response = await nutritionService.logWater(amount, targetDate);

      if (response.success && response.data) {
        dispatch({ type: 'ADD_WATER_LOG', payload: response.data });
        // Refresh daily data to get updated totals for the correct date and show fresh data immediately
        await refreshDailyData(targetDate);
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to log water' });
        // Even if API fails, refresh data to show any offline cached entries
        await refreshDailyData(targetDate);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log water';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  };

  // Goals management
  const updateDailyGoals = async (goals: MacroGoals): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await nutritionService.updateDailyGoals(goals);

      if (response.success && response.data) {
        dispatch({ type: 'SET_DAILY_GOALS', payload: response.data });
        await refreshDailyData(state.currentDate);
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update goals' });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update goals';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Data fetching
  const refreshDailyData = async (date?: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const targetDate = date || state.currentDate;
      
      const [dailyLogResponse, goalProgressResponse, waterResponse] = await Promise.all([
        nutritionService.getDailyLog(targetDate),
        nutritionService.getDailyProgress(targetDate),
        nutritionService.getDailyWaterIntake(targetDate),
      ]);

      if (dailyLogResponse.success) {
        dispatch({ type: 'SET_DAILY_LOG', payload: dailyLogResponse.data });
      }

      if (goalProgressResponse) {
        dispatch({ type: 'SET_GOAL_PROGRESS', payload: goalProgressResponse });
      }

      if (waterResponse.success) {
        dispatch({ type: 'SET_WATER_LOGS', payload: waterResponse.data.logs });
        dispatch({ type: 'SET_TOTAL_WATER', payload: waterResponse.data.total });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh daily data';
      // Only show errors after initial load is complete
      if (!state.isInitialLoad) {
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } else {
        console.log('Suppressing error during initial load:', errorMessage);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      // Mark initial load as complete after first attempt
      if (state.isInitialLoad) {
        dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE' });
      }
    }
  };

  const refreshWeeklyStats = async (): Promise<void> => {
    try {
      const weekStart = getWeekStart(new Date(state.currentDate)).toLocaleDateString('en-CA');
      const response = await nutritionService.getWeeklyStats(weekStart);

      if (response.success) {
        dispatch({ type: 'SET_WEEKLY_STATS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to refresh weekly stats:', error);
    }
  };

  const refreshMonthlyStats = async (): Promise<void> => {
    try {
      const monthStart = new Date(state.currentDate);
      monthStart.setDate(1);
      const response = await nutritionService.getMonthlyStats(monthStart.toLocaleDateString('en-CA'));

      if (response.success) {
        dispatch({ type: 'SET_MONTHLY_STATS', payload: response.data });
      }
    } catch (error) {
      console.error('Failed to refresh monthly stats:', error);
    }
  };

  const loadRecentFoods = async (): Promise<void> => {
    try {
      const recentFoods = await nutritionService.getRecentFoods();
      dispatch({ type: 'SET_RECENT_FOODS', payload: recentFoods });
    } catch (error) {
      console.error('Failed to load recent foods:', error);
    }
  };

  const loadFavoriteFoods = async (): Promise<void> => {
    try {
      const favoriteFoods = await nutritionService.getFavoriteFoods();
      dispatch({ type: 'SET_FAVORITE_FOODS', payload: favoriteFoods });
    } catch (error) {
      console.error('Failed to load favorite foods:', error);
    }
  };

  const loadDailyGoals = async (): Promise<void> => {
    try {
      const goals = await nutritionService.getDailyGoals();
      dispatch({ type: 'SET_DAILY_GOALS', payload: goals });
    } catch (error) {
      console.error('Failed to load daily goals:', error);
    }
  };

  // Favorites management
  const toggleFavoriteFood = async (foodId: string): Promise<boolean> => {
    try {
      const response = await nutritionService.toggleFavoriteFood(foodId);
      if (response.success) {
        await loadFavoriteFoods();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      return false;
    }
  };

  const addToRecentFoods = async (food: Food): Promise<void> => {
    try {
      await nutritionService.addToRecentFoods(food);
      await loadRecentFoods();
    } catch (error) {
      console.error('Failed to add to recent foods:', error);
    }
  };

  // Sync
  const syncOfflineData = async (): Promise<void> => {
    try {
      await nutritionService.syncOfflineLogs();
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const resetState = (): void => {
    dispatch({ type: 'RESET_STATE' });
  };

  // No automatic API calls in useEffect - pages will trigger their own API calls

  // Utility function
  const getWeekStart = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  };

  const contextValue: NutritionContextType = {
    ...state,
    logFood,
    updateFoodEntry,
    deleteFoodEntry,
    logWater,
    updateDailyGoals,
    refreshDailyData,
    refreshWeeklyStats,
    refreshMonthlyStats,
    loadRecentFoods,
    loadFavoriteFoods,
    loadDailyGoals,
    toggleFavoriteFood,
    addToRecentFoods,
    setCurrentDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    syncOfflineData,
    clearError,
    resetState,
    themeContext,
  };

  return (
    <NutritionContext.Provider value={contextValue}>
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = (): NutritionContextType => {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};

export default NutritionContext;