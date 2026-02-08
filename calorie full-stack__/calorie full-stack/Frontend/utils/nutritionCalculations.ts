import { User, MacroGoals, NutritionSummary, ActivityLevel, Gender } from '../types/nutrition';

export interface BMRResult {
  bmr: number;
  tdee: number;
  method: 'mifflin-st-jeor' | 'harris-benedict';
}

export interface MacroDistribution {
  proteinCalories: number;
  carbCalories: number;
  fatCalories: number;
  proteinPercent: number;
  carbPercent: number;
  fatPercent: number;
}

export interface BMIResult {
  bmi: number;
  category: 'underweight' | 'normal' | 'overweight' | 'obese' | 'unknown';
  interpretation: string;
}

export const calculateBMR = (
  weight: number, 
  height: number, 
  age: number, 
  gender: Gender
): number => {
  if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) {
    return 0;
  }

  const baseCalories = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? baseCalories + 5 : baseCalories - 161;
};

export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };

  return bmr * (multipliers[activityLevel] || multipliers.sedentary);
};

export const calculateBMI = (weight: number, height: number): BMIResult => {
  if (!weight || !height || weight <= 0 || height <= 0) {
    return {
      bmi: 0,
      category: 'unknown',
      interpretation: 'Invalid measurements',
    };
  }

  const bmi = weight / Math.pow(height / 100, 2);
  
  let category: BMIResult['category'];
  let interpretation: string;

  if (bmi < 18.5) {
    category = 'underweight';
    interpretation = 'Below normal weight';
  } else if (bmi < 25) {
    category = 'normal';
    interpretation = 'Normal weight';
  } else if (bmi < 30) {
    category = 'overweight';
    interpretation = 'Above normal weight';
  } else {
    category = 'obese';
    interpretation = 'Obese';
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    interpretation,
  };
};

export const calculateRecommendedMacros = (user: User): MacroGoals | null => {
  if (!user.weight || !user.height || !user.age || !user.gender) {
    return null;
  }

  const bmr = calculateBMR(user.weight, user.height, user.age, user.gender);
  const tdee = calculateTDEE(bmr, user.activityLevel || 'sedentary');
  const calories = Math.round(tdee);
  const protein = Math.round(user.weight * 1.8);
  const fatCalories = calories * 0.25;
  const fats = Math.round(fatCalories / 9);
  const proteinCalories = protein * 4;
  const remainingCalories = calories - proteinCalories - fatCalories;
  const carbs = Math.round(remainingCalories / 4);
  const fiber = Math.round(calories / 1000 * 14);
  const sugar = Math.round(calories * 0.1 / 4);
  const sodium = 2300;

  return {
    calories,
    protein,
    carbs,
    fats,
    fiber,
    sugar,
    sodium,
  };
};

export const calculateMacroDistribution = (
  protein: number,
  carbs: number,
  fats: number
): MacroDistribution => {
  const proteinCalories = protein * 4;
  const carbCalories = carbs * 4;
  const fatCalories = fats * 9;
  const totalCalories = proteinCalories + carbCalories + fatCalories;

  if (totalCalories === 0) {
    return {
      proteinCalories: 0,
      carbCalories: 0,
      fatCalories: 0,
      proteinPercent: 0,
      carbPercent: 0,
      fatPercent: 0,
    };
  }

  return {
    proteinCalories,
    carbCalories,
    fatCalories,
    proteinPercent: (proteinCalories / totalCalories) * 100,
    carbPercent: (carbCalories / totalCalories) * 100,
    fatPercent: (fatCalories / totalCalories) * 100,
  };
};

export const calculateNutritionSum = (entries: any[]): NutritionSummary => {
  const initialSum: NutritionSummary = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  return entries.reduce((sum, entry) => {
    const multiplier = (entry.quantity * entry.servingSize) / entry.food.servingSize;
    
    return {
      calories: sum.calories + (entry.food.calories * multiplier),
      protein: sum.protein + (entry.food.protein * multiplier),
      carbs: sum.carbs + (entry.food.carbs * multiplier),
      fats: sum.fats + (entry.food.fats * multiplier),
      fiber: sum.fiber + (entry.food.fiber || 0) * multiplier,
      sugar: sum.sugar + (entry.food.sugar || 0) * multiplier,
      sodium: sum.sodium + (entry.food.sodium || 0) * multiplier,
    };
  }, initialSum);
};

export const calculateGoalProgress = (
  current: NutritionSummary,
  target: MacroGoals
) => {
  return {
    calories: target.calories > 0 ? (current.calories / target.calories) * 100 : 0,
    protein: target.protein > 0 ? (current.protein / target.protein) * 100 : 0,
    carbs: target.carbs > 0 ? (current.carbs / target.carbs) * 100 : 0,
    fats: target.fats > 0 ? (current.fats / target.fats) * 100 : 0,
  };
};

export const calculateRemainingNutrients = (
  current: NutritionSummary,
  target: MacroGoals
) => {
  return {
    calories: Math.max(0, target.calories - current.calories),
    protein: Math.max(0, target.protein - current.protein),
    carbs: Math.max(0, target.carbs - current.carbs),
    fats: Math.max(0, target.fats - current.fats),
    fiber: target.fiber ? Math.max(0, target.fiber - (current.fiber || 0)) : undefined,
    sugar: target.sugar ? Math.max(0, target.sugar - (current.sugar || 0)) : undefined,
    sodium: target.sodium ? Math.max(0, target.sodium - (current.sodium || 0)) : undefined,
  };
};

export const validateMacroGoals = (goals: MacroGoals): string[] => {
  const errors: string[] = [];

  if (goals.calories < 800 || goals.calories > 5000) {
    errors.push('Calories should be between 800 and 5000');
  }

  if (goals.protein < 20 || goals.protein > 400) {
    errors.push('Protein should be between 20g and 400g');
  }

  if (goals.carbs < 20 || goals.carbs > 800) {
    errors.push('Carbs should be between 20g and 800g');
  }

  if (goals.fats < 15 || goals.fats > 200) {
    errors.push('Fats should be between 15g and 200g');
  }

  if (goals.fiber && (goals.fiber < 10 || goals.fiber > 100)) {
    errors.push('Fiber should be between 10g and 100g');
  }

  if (goals.sugar && (goals.sugar < 0 || goals.sugar > 200)) {
    errors.push('Sugar should be between 0g and 200g');
  }

  if (goals.sodium && (goals.sodium < 500 || goals.sodium > 5000)) {
    errors.push('Sodium should be between 500mg and 5000mg');
  }

  const distribution = calculateMacroDistribution(goals.protein, goals.carbs, goals.fats);
  const totalMacroCalories = distribution.proteinCalories + distribution.carbCalories + distribution.fatCalories;
  
  if (Math.abs(totalMacroCalories - goals.calories) > goals.calories * 0.1) {
    errors.push('Macro distribution doesn\'t match calorie goal');
  }

  return errors;
};

export const getNutritionDensity = (nutrition: NutritionSummary): number => {
  if (nutrition.calories === 0) return 0;
  
  const proteinScore = nutrition.protein / nutrition.calories * 100;
  const fiberScore = (nutrition.fiber || 0) / nutrition.calories * 100;
  
  return Math.round((proteinScore + fiberScore) * 10) / 10;
};

export const formatNutritionValue = (
  value: number,
  type: 'calories' | 'macros' | 'micronutrients'
): string => {
  switch (type) {
    case 'calories':
      return Math.round(value).toString();
    case 'macros':
      return (Math.round(value * 10) / 10).toString();
    case 'micronutrients':
      return Math.round(value).toString();
    default:
      return value.toString();
  }
};

export const calculateWeeklyAverage = (dailyValues: number[]): number => {
  if (dailyValues.length === 0) return 0;
  const sum = dailyValues.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / dailyValues.length) * 10) / 10;
};

export const calculateGoalAdherence = (
  actualValues: number[],
  targetValue: number
): number => {
  if (actualValues.length === 0) return 0;
  
  const adherenceScores = actualValues.map(actual => {
    if (targetValue === 0) return actual === 0 ? 1 : 0;
    
    const ratio = actual / targetValue;
    // Perfect score at 90-110% of target, declining beyond that
    if (ratio >= 0.9 && ratio <= 1.1) return 1;
    if (ratio >= 0.8 && ratio < 0.9) return 0.8;
    if (ratio > 1.1 && ratio <= 1.2) return 0.8;
    if (ratio >= 0.7 && ratio < 0.8) return 0.6;
    if (ratio > 1.2 && ratio <= 1.3) return 0.6;
    if (ratio >= 0.6 && ratio < 0.7) return 0.4;
    if (ratio > 1.3 && ratio <= 1.4) return 0.4;
    return 0.2;
  });

  const averageAdherence = adherenceScores.reduce((sum, score) => sum + score, 0) / adherenceScores.length;
  return Math.round(averageAdherence * 100);
};

export default {
  calculateBMR,
  calculateTDEE,
  calculateBMI,
  calculateRecommendedMacros,
  calculateMacroDistribution,
  calculateNutritionSum,
  calculateGoalProgress,
  calculateRemainingNutrients,
  validateMacroGoals,
  getNutritionDensity,
  formatNutritionValue,
  calculateWeeklyAverage,
  calculateGoalAdherence,
};