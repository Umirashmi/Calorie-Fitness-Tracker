import { useContext, useMemo } from 'react';
import NutritionContext from '../context/NutritionContext';
import { MealType } from '../types/nutrition';

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  
  if (!context) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  
  // Computed values for convenience
  const computedValues = useMemo(() => {
    const { dailyLog, goalProgress, currentDate } = context;
    
    // Calculate entries by meal type
    const entriesByMeal = {
      breakfast: dailyLog?.entries.filter(entry => entry.mealType === 'breakfast') || [],
      lunch: dailyLog?.entries.filter(entry => entry.mealType === 'lunch') || [],
      dinner: dailyLog?.entries.filter(entry => entry.mealType === 'dinner') || [],
      snack: dailyLog?.entries.filter(entry => entry.mealType === 'snack') || [],
    };
    
    // Calculate calories by meal (corrected calculation)
    const caloriesByMeal = {
      breakfast: entriesByMeal.breakfast.reduce((sum, entry) => 
        sum + (entry.food.calories * entry.servingSize) / 100, 0),
      lunch: entriesByMeal.lunch.reduce((sum, entry) => 
        sum + (entry.food.calories * entry.servingSize) / 100, 0),
      dinner: entriesByMeal.dinner.reduce((sum, entry) => 
        sum + (entry.food.calories * entry.servingSize) / 100, 0),
      snack: entriesByMeal.snack.reduce((sum, entry) => 
        sum + (entry.food.calories * entry.servingSize) / 100, 0),
    };
    
    // Calculate remaining calories and macros
    const remainingCalories = goalProgress 
      ? Math.max(0, goalProgress.target.calories - goalProgress.current.calories)
      : 0;
      
    const remainingProtein = goalProgress 
      ? Math.max(0, goalProgress.target.protein - goalProgress.current.protein)
      : 0;
      
    const remainingCarbs = goalProgress 
      ? Math.max(0, goalProgress.target.carbs - goalProgress.current.carbs)
      : 0;
      
    const remainingFats = goalProgress 
      ? Math.max(0, goalProgress.target.fats - goalProgress.current.fats)
      : 0;
    
    // Check if it's today
    const isToday = currentDate === new Date().toLocaleDateString('en-CA');
    
    // Calculate streak and logging stats
    const totalEntries = dailyLog?.entries.length || 0;
    const hasLoggedToday = isToday && totalEntries > 0;
    
    return {
      entriesByMeal,
      caloriesByMeal,
      remainingCalories,
      remainingProtein,
      remainingCarbs,
      remainingFats,
      isToday,
      totalEntries,
      hasLoggedToday,
    };
  }, [context.dailyLog, context.goalProgress, context.currentDate]);
  
  return {
    ...context,
    ...computedValues,
  };
};

// Specialized hooks for specific use cases
export const useMealEntries = (mealType: MealType) => {
  const { dailyLog } = useNutrition();
  
  return useMemo(() => {
    return dailyLog?.entries.filter(entry => entry.mealType === mealType) || [];
  }, [dailyLog, mealType]);
};

export const useMacroProgress = () => {
  const { goalProgress } = useNutrition();
  
  return useMemo(() => {
    if (!goalProgress) {
      return {
        calories: { current: 0, target: 0, percentage: 0, remaining: 0 },
        protein: { current: 0, target: 0, percentage: 0, remaining: 0 },
        carbs: { current: 0, target: 0, percentage: 0, remaining: 0 },
        fats: { current: 0, target: 0, percentage: 0, remaining: 0 },
      };
    }
    
    return {
      calories: {
        current: goalProgress.current.calories,
        target: goalProgress.target.calories,
        percentage: goalProgress.percentages.calories,
        remaining: Math.max(0, goalProgress.target.calories - goalProgress.current.calories),
      },
      protein: {
        current: goalProgress.current.protein,
        target: goalProgress.target.protein,
        percentage: goalProgress.percentages.protein,
        remaining: Math.max(0, goalProgress.target.protein - goalProgress.current.protein),
      },
      carbs: {
        current: goalProgress.current.carbs,
        target: goalProgress.target.carbs,
        percentage: goalProgress.percentages.carbs,
        remaining: Math.max(0, goalProgress.target.carbs - goalProgress.current.carbs),
      },
      fats: {
        current: goalProgress.current.fats,
        target: goalProgress.target.fats,
        percentage: goalProgress.percentages.fats,
        remaining: Math.max(0, goalProgress.target.fats - goalProgress.current.fats),
      },
    };
  }, [goalProgress]);
};

export const useWaterProgress = () => {
  const { totalWaterIntake, waterLogs } = useNutrition();
  
  // Recommended daily water intake in ml
  const DAILY_WATER_GOAL = 2000;
  
  return useMemo(() => {
    const percentage = (totalWaterIntake / DAILY_WATER_GOAL) * 100;
    const remaining = Math.max(0, DAILY_WATER_GOAL - totalWaterIntake);
    
    return {
      current: totalWaterIntake,
      target: DAILY_WATER_GOAL,
      percentage: Math.min(100, percentage),
      remaining,
      logs: waterLogs,
    };
  }, [totalWaterIntake, waterLogs]);
};

export const useQuickStats = () => {
  const { 
    dailyLog, 
    goalProgress, 
    weeklyStats, 
    monthlyStats,
    currentDate 
  } = useNutrition();
  
  return useMemo(() => {
    const isToday = currentDate === new Date().toLocaleDateString('en-CA');
    const todayEntries = dailyLog?.entries.length || 0;
    const todayCalories = dailyLog?.totalCalories || 0;
    const goalCalories = goalProgress?.target.calories || 0;
    
    const weeklyAvgCalories = weeklyStats?.averageCalories || 0;
    const weeklyDaysLogged = weeklyStats?.daysLogged || 0;
    const weeklyTotalDays = weeklyStats?.totalDays || 7;
    
    const monthlyAvgCalories = monthlyStats?.averageCalories || 0;
    const monthlyDaysLogged = monthlyStats?.daysLogged || 0;
    const monthlyTotalDays = monthlyStats?.totalDays || 30;
    const monthlyGoalAdherence = monthlyStats?.goalAdherence || 0;
    
    return {
      today: {
        entries: todayEntries,
        calories: todayCalories,
        goalCalories,
        isComplete: goalCalories > 0 ? (todayCalories / goalCalories) >= 0.8 : false,
        isToday,
      },
      weekly: {
        averageCalories: weeklyAvgCalories,
        daysLogged: weeklyDaysLogged,
        totalDays: weeklyTotalDays,
        consistency: weeklyTotalDays > 0 ? (weeklyDaysLogged / weeklyTotalDays) * 100 : 0,
      },
      monthly: {
        averageCalories: monthlyAvgCalories,
        daysLogged: monthlyDaysLogged,
        totalDays: monthlyTotalDays,
        consistency: monthlyTotalDays > 0 ? (monthlyDaysLogged / monthlyTotalDays) * 100 : 0,
        goalAdherence: monthlyGoalAdherence,
      },
    };
  }, [
    dailyLog, 
    goalProgress, 
    weeklyStats, 
    monthlyStats, 
    currentDate
  ]);
};

export default useNutrition;