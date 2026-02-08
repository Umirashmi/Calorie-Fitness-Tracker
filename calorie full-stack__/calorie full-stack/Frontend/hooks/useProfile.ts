import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ApisClient } from '../services/api';
import { User, ProfileUpdate, MacroGoals, ActivityLevel, Gender } from '../types/nutrition';

interface ProfileState {
  isUpdating: boolean;
  updateError: string | null;
  lastUpdated: string | null;
}

interface CalculatedMetrics {
  bmr: number; // Basal Metabolic Rate
  tdee: number; // Total Daily Energy Expenditure
  bmi: number; // Body Mass Index
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown';
  recommendedCalories: number;
  recommendedProtein: number;
  recommendedCarbs: number;
  recommendedFats: number;
}

export const useProfile = () => {
  const { user, updateUser, isAuthenticated } = useAuth();
  const [state, setState] = useState<ProfileState>({
    isUpdating: false,
    updateError: null,
    lastUpdated: null,
  });

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = useCallback((
    weight: number, 
    height: number, 
    age: number, 
    gender: Gender
  ): number => {
    if (!weight || !height || !age) return 0;
    
    const baseCalories = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? baseCalories + 5 : baseCalories - 161;
  }, []);

  // Calculate TDEE based on activity level
  const calculateTDEE = useCallback((bmr: number, activityLevel: ActivityLevel): number => {
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };
    
    return bmr * (multipliers[activityLevel] || multipliers.sedentary);
  }, []);

  // Calculate BMI
  const calculateBMI = useCallback((weight: number, height: number): number => {
    if (!weight || !height) return 0;
    return weight / Math.pow(height / 100, 2);
  }, []);

  // Get BMI category
  const getBMICategory = useCallback((bmi: number): CalculatedMetrics['bmiCategory'] => {
    if (bmi === 0) return 'unknown';
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }, []);

  // Calculate recommended macros
  const calculateRecommendedMacros = useCallback((tdee: number, weight: number) => {
    const calories = Math.round(tdee);
    
    // Protein: 1.6-2.2g per kg body weight (using 1.8g as middle ground)
    const protein = Math.round(weight * 1.8);
    
    // Fats: 25-30% of calories (using 27.5% as middle ground)
    const fats = Math.round((calories * 0.275) / 9);
    
    // Carbs: remaining calories after protein and fat
    const proteinCalories = protein * 4;
    const fatCalories = fats * 9;
    const remainingCalories = calories - proteinCalories - fatCalories;
    const carbs = Math.round(remainingCalories / 4);
    
    return {
      calories,
      protein,
      carbs,
      fats,
    };
  }, []);

  // Computed metrics
  const calculatedMetrics = useMemo((): CalculatedMetrics => {
    if (!user || !user.weight || !user.height || !user.age || !user.gender) {
      return {
        bmr: 0,
        tdee: 0,
        bmi: 0,
        bmiCategory: 'unknown',
        recommendedCalories: 0,
        recommendedProtein: 0,
        recommendedCarbs: 0,
        recommendedFats: 0,
      };
    }

    const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
    const tdee = calculateTDEE(bmr, user.activityLevel || 'sedentary');
    const bmi = calculateBMI(user.weight, user.height);
    const bmiCategory = getBMICategory(bmi);
    
    const recommended = calculateRecommendedMacros(tdee, user.weight);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      bmi: Math.round(bmi * 10) / 10, // Round to 1 decimal place
      bmiCategory,
      recommendedCalories: recommended.calories,
      recommendedProtein: recommended.protein,
      recommendedCarbs: recommended.carbs,
      recommendedFats: recommended.fats,
    };
  }, [user, calculateBMR, calculateTDEE, calculateBMI, getBMICategory, calculateRecommendedMacros]);

  // Profile completion percentage
  const profileCompleteness = useMemo((): number => {
    if (!user) return 0;
    
    const fields = [
      user.name,
      user.email,
      user.age,
      user.weight,
      user.height,
      user.gender,
      user.activityLevel,
    ];
    
    const completedFields = fields.filter(field => field !== undefined && field !== null && field !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  }, [user]);

  // Check if profile is complete enough for accurate calculations
  const isProfileSufficient = useMemo((): boolean => {
    return !!(user?.weight && user?.height && user?.age && user?.gender);
  }, [user]);

  // Update profile
  const updateProfile = async (updates: ProfileUpdate): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setState(prev => ({ ...prev, isUpdating: true, updateError: null }));

    try {
      const response = await ApisClient.updateProfile(updates);
      
      if (response.success && response.data) {
        updateUser(response.data);
        setState(prev => ({ 
          ...prev, 
          lastUpdated: new Date().toISOString() 
        }));
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          updateError: response.error || 'Failed to update profile' 
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setState(prev => ({ ...prev, updateError: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  // Refresh profile from server
  const refreshProfile = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    setState(prev => ({ ...prev, isUpdating: true, updateError: null }));

    try {
      const response = await ApisClient.getProfile();
      
      if (response.success && response.data) {
        updateUser(response.data);
        return true;
      } else {
        setState(prev => ({ 
          ...prev, 
          updateError: response.error || 'Failed to refresh profile' 
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh profile';
      setState(prev => ({ ...prev, updateError: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  // Generate macro goals based on profile
  const generateRecommendedGoals = (): MacroGoals | null => {
    if (!isProfileSufficient) return null;

    return {
      calories: calculatedMetrics.recommendedCalories,
      protein: calculatedMetrics.recommendedProtein,
      carbs: calculatedMetrics.recommendedCarbs,
      fats: calculatedMetrics.recommendedFats,
      fiber: Math.round(calculatedMetrics.recommendedCalories / 1000 * 14), // 14g per 1000 calories
      sugar: Math.round(calculatedMetrics.recommendedCalories * 0.1 / 4), // 10% of calories as sugar
      sodium: 2300, // mg - general recommendation
    };
  };

  // Clear errors
  const clearError = () => {
    setState(prev => ({ ...prev, updateError: null }));
  };

  // Validation helpers
  const validateAge = (age: number): boolean => age >= 13 && age <= 120;
  const validateWeight = (weight: number): boolean => weight >= 30 && weight <= 500; // kg
  const validateHeight = (height: number): boolean => height >= 100 && height <= 250; // cm

  const validateProfileData = (data: Partial<ProfileUpdate>): string[] => {
    const errors: string[] = [];
    
    if (data.age !== undefined && !validateAge(data.age)) {
      errors.push('Age must be between 13 and 120 years');
    }
    
    if (data.weight !== undefined && !validateWeight(data.weight)) {
      errors.push('Weight must be between 30 and 500 kg');
    }
    
    if (data.height !== undefined && !validateHeight(data.height)) {
      errors.push('Height must be between 100 and 250 cm');
    }
    
    return errors;
  };

  return {
    // Profile data
    user,
    profileCompleteness,
    isProfileSufficient,
    
    // Calculated metrics
    calculatedMetrics,
    
    // State
    isUpdating: state.isUpdating,
    updateError: state.updateError,
    lastUpdated: state.lastUpdated,
    
    // Actions
    updateProfile,
    refreshProfile,
    generateRecommendedGoals,
    clearError,
    
    // Validation
    validateAge,
    validateWeight,
    validateHeight,
    validateProfileData,
    
    // Calculation functions
    calculateBMI,
    calculateBMR,
    calculateTDEE,
    getBMICategory,
  };
};


export default useProfile;