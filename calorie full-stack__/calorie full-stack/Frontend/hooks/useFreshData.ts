import { useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useNutrition } from './useNutrition';
import { nutritionService } from '../services/nutrition';

/**
 * Custom hook to fetch fresh data for pages on every visit
 * Only calls APIs after user authentication is confirmed
 */
export const useFreshData = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    refreshDailyData,
    refreshWeeklyStats,
    refreshMonthlyStats,
    loadRecentFoods,
    loadFavoriteFoods,
    loadDailyGoals,
    currentDate
  } = useNutrition();

  // Memoize the ready state to prevent unnecessary re-renders
  const isReady = useMemo(() => isAuthenticated && !authLoading, [isAuthenticated, authLoading]);

  // Dashboard data - called on every dashboard visit
  const loadDashboardData = useCallback(async () => {
    if (!isReady) return;
    
    try {
      await Promise.all([
        refreshDailyData(currentDate),
        loadRecentFoods(),
        loadFavoriteFoods(),
        loadDailyGoals()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [isReady, currentDate]);

  // Analytics data - called on every analytics visit
  const loadAnalyticsData = useCallback(async () => {
    if (!isReady) return;
    
    try {
      await Promise.all([
        refreshWeeklyStats(),
        refreshMonthlyStats(),
        refreshDailyData(currentDate)
      ]);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }, [isReady, currentDate]);

  // Log food data - called on every log-food visit
  const loadLogFoodData = useCallback(async () => {
    if (!isReady) return;
    
    try {
      await Promise.all([
        loadRecentFoods(),
        loadFavoriteFoods(),
        refreshDailyData(currentDate)
      ]);
    } catch (error) {
      console.error('Failed to load log food data:', error);
    }
  }, [isReady, currentDate]);

  // Profile data - called on every profile visit
  const loadProfileData = useCallback(async () => {
    if (!isReady) return;
    
    try {
      // Profile data is mainly from auth context, but we can refresh daily data for completeness
      await refreshDailyData(currentDate);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  }, [isReady, currentDate]);

  return {
    loadDashboardData,
    loadAnalyticsData,
    loadLogFoodData,
    loadProfileData,
    isReady
  };
};