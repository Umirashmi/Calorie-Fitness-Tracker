export interface MacroCalculationInput {
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  portion_size: number; // in grams
}

export interface CalculatedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export class NutritionCalculations {
  static calculateMacrosForPortion(input: MacroCalculationInput): CalculatedMacros {
    const multiplier = input.portion_size / 100;

    return {
      calories: Math.round(input.calories_per_100g * multiplier * 100) / 100,
      protein: Math.round(input.protein_per_100g * multiplier * 100) / 100,
      carbs: Math.round(input.carbs_per_100g * multiplier * 100) / 100,
      fats: Math.round(input.fats_per_100g * multiplier * 100) / 100,
    };
  }

  static calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
    // Mifflin-St Jeor Equation
    const bmr = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? bmr + 5 : bmr - 161;
  }

  static calculateTDEE(
    bmr: number,
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active'
  ): number {
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    };

    return Math.round(bmr * activityMultipliers[activityLevel]);
  }

  static calculateMacroGoals(
    tdee: number,
    goal: 'maintenance' | 'weight_loss' | 'weight_gain' = 'maintenance',
    proteinPerKg: number = 1.6,
    weight: number
  ): { calories: number; protein: number; carbs: number; fats: number } {
    const goalMultipliers = {
      maintenance: 1.0,
      weight_loss: 0.8,
      weight_gain: 1.2,
    };

    const targetCalories = Math.round(tdee * goalMultipliers[goal]);
    const protein = Math.round(weight * proteinPerKg);
    const fats = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.round((targetCalories - protein * 4 - fats * 9) / 4);

    return {
      calories: targetCalories,
      protein,
      carbs: Math.max(carbs, 0),
      fats,
    };
  }

  static convertUnits = {
    gramsToOunces: (grams: number): number => Math.round((grams * 0.035274) * 100) / 100,
    ouncesToGrams: (ounces: number): number => Math.round((ounces / 0.035274) * 100) / 100,
    kgToPounds: (kg: number): number => Math.round((kg * 2.20462) * 100) / 100,
    poundsToKg: (pounds: number): number => Math.round((pounds / 2.20462) * 100) / 100,
    cmToInches: (cm: number): number => Math.round((cm * 0.393701) * 100) / 100,
    inchesToCm: (inches: number): number => Math.round((inches / 0.393701) * 100) / 100,
    cupsToGrams: (cups: number, density: number = 1): number => Math.round((cups * 240 * density) * 100) / 100,
    gramsToMl: (grams: number, density: number = 1): number => Math.round((grams / density) * 100) / 100,
  };

  static validateNutritionValues(macros: CalculatedMacros): boolean {
    return (
      macros.calories >= 0 &&
      macros.protein >= 0 &&
      macros.carbs >= 0 &&
      macros.fats >= 0 &&
      Number.isFinite(macros.calories) &&
      Number.isFinite(macros.protein) &&
      Number.isFinite(macros.carbs) &&
      Number.isFinite(macros.fats)
    );
  }

  static calculatePercentageOfGoals(
    actual: CalculatedMacros,
    goals: CalculatedMacros
  ): { calories: number; protein: number; carbs: number; fats: number } {
    return {
      calories: Math.round((actual.calories / goals.calories) * 100),
      protein: Math.round((actual.protein / goals.protein) * 100),
      carbs: Math.round((actual.carbs / goals.carbs) * 100),
      fats: Math.round((actual.fats / goals.fats) * 100),
    };
  }

  static calculateCaloriesFromMacros(protein: number, carbs: number, fats: number): number {
    return Math.round(protein * 4 + carbs * 4 + fats * 9);
  }

  static calculateMacroRatios(macros: CalculatedMacros): { protein: number; carbs: number; fats: number } {
    const total = macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;
    
    if (total === 0) {
      return { protein: 0, carbs: 0, fats: 0 };
    }

    return {
      protein: Math.round(((macros.protein * 4) / total) * 100),
      carbs: Math.round(((macros.carbs * 4) / total) * 100),
      fats: Math.round(((macros.fats * 9) / total) * 100),
    };
  }
}