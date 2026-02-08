import validator from 'validator';

export class CustomValidators {
  static isValidEmail(email: string): boolean {
    return validator.isEmail(email);
  }

  static isStrongPassword(password: string): boolean {
    return validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    });
  }

  static isValidUUID(uuid: string): boolean {
    return validator.isUUID(uuid, 4);
  }

  static isValidDate(dateString: string): boolean {
    return validator.isISO8601(dateString) && new Date(dateString).toString() !== 'Invalid Date';
  }

  static isPositiveNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && value > 0;
  }

  static isNonNegativeNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
  }

  static isValidActivityLevel(level: string): boolean {
    const validLevels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'];
    return validLevels.includes(level);
  }

  static isValidMealType(mealType: string): boolean {
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    return validMealTypes.includes(mealType);
  }

  static isValidPortionSize(portionSize: number): boolean {
    return this.isPositiveNumber(portionSize) && portionSize <= 10000;
  }

  static isValidAge(age: number): boolean {
    return Number.isInteger(age) && age >= 13 && age <= 120;
  }

  static isValidWeight(weight: number): boolean {
    return this.isPositiveNumber(weight) && weight >= 20 && weight <= 1000;
  }

  static isValidHeight(height: number): boolean {
    return this.isPositiveNumber(height) && height >= 50 && height <= 300;
  }

  static isValidCalories(calories: number): boolean {
    return this.isNonNegativeNumber(calories) && calories <= 10000;
  }

  static isValidMacroAmount(amount: number): boolean {
    return this.isNonNegativeNumber(amount) && amount <= 2000;
  }

  static sanitizeSearchQuery(query: string): string {
    return validator.escape(query.trim().toLowerCase());
  }

  static isValidSearchQuery(query: string): boolean {
    return query.trim().length >= 1 && query.trim().length <= 100;
  }

  static isValidNutritionPer100g(value: number): boolean {
    return this.isNonNegativeNumber(value) && value <= 100;
  }

  static isReasonableNutritionValue(
    calories: number,
    protein: number,
    carbs: number,
    fats: number
  ): boolean {
    const calculatedCalories = protein * 4 + carbs * 4 + fats * 9;
    const difference = Math.abs(calories - calculatedCalories);
    const tolerance = calories * 0.1; // 10% tolerance
    
    return difference <= tolerance;
  }

  static isValidFoodSource(source: string): boolean {
    const validSources = ['user', 'database', 'api'];
    return validSources.includes(source);
  }

  static validateGoalConsistency(
    calories: number,
    protein: number,
    carbs: number,
    fats: number
  ): boolean {
    const calculatedCalories = protein * 4 + carbs * 4 + fats * 9;
    const difference = Math.abs(calories - calculatedCalories);
    const tolerance = 50; // 50 calorie tolerance
    
    return difference <= tolerance;
  }

  static normalizeString(str: string): string {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, ' ');
  }

  static isValidDateRange(startDate: Date, endDate: Date, maxDays: number = 365): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return start <= end && diffDays <= maxDays;
  }

  static validateMacroObject(macros: any): boolean {
    return (
      typeof macros === 'object' &&
      macros !== null &&
      this.isNonNegativeNumber(macros.calories) &&
      this.isNonNegativeNumber(macros.protein) &&
      this.isNonNegativeNumber(macros.carbs) &&
      this.isNonNegativeNumber(macros.fats)
    );
  }
}