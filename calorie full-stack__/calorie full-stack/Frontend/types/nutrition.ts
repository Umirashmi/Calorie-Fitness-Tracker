export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  createdAt: string;
  updatedAt: string;
}

export interface MacroGoals {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
  fiber?: number; // in grams
  sugar?: number; // in grams
  sodium?: number; // in mg
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number;
  servingSizeUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  isVerified: boolean;
  createdBy?: string;
}

export interface FoodEntry {
  id: string;
  foodId: string;
  food: Food;
  quantity: number;
  servingSize: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  loggedAt: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  entries: FoodEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  totalFiber?: number;
  totalSugar?: number;
  totalSodium?: number;
  waterIntake?: number; // in ml
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface GoalProgress {
  current: NutritionSummary;
  target: MacroGoals;
  percentages: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface WeeklyStats {
  averageCalories: number;
  averageProtein: number;
  averageCarbs: number;
  averageFats: number;
  daysLogged: number;
  totalDays: number;
}

export interface MonthlyStats extends WeeklyStats {
  weightChange?: number;
  goalAdherence: number; // percentage
}

export interface FoodSearchResult {
  foods: Food[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: User['activityLevel'];
}

export interface ProfileUpdate {
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: User['activityLevel'];
}

export interface WaterLog {
  id: string;
  userId: string;
  amount: number; // in ml
  loggedAt: string;
  date: string; // YYYY-MM-DD
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';

export type Gender = 'male' | 'female' | 'other';

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
}

export interface NutritionChartData {
  calories: ChartData;
  macros: ChartData;
  weekly: ChartData;
  monthly: ChartData;
}