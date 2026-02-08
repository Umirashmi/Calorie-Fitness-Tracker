import axios from 'axios';
import { environment } from '../config/environment';

export interface NutritionData {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
   // external_id?: string;
}

export interface NutritionixSearchResult {
  food_name: string;
  nf_calories: number;
  nf_protein: number;
  nf_total_carbohydrate: number;
  nf_total_fat: number;
  nix_item_id?: string;
}

export interface EdamamSearchResult {
  label: string;
  nutrients: {
    ENERC_KCAL: number;
    PROCNT: number;
    CHOCDF: number;
    FAT: number;
  };
  foodId: string;
}

export class NutritionAPIService {
  private static nutritionixBaseURL = 'https://trackapi.nutritionix.com/v2';
  private static edamamBaseURL = 'https://api.edamam.com/api/food-database/v2';

  static async searchNutritionix(query: string): Promise<NutritionData[]> {
    if (!environment.NUTRITIONIX_APP_ID || !environment.NUTRITIONIX_API_KEY) {
      throw new Error('Nutritionix API credentials not configured');
    }

    try {
      const response = await axios.post(
        `${this.nutritionixBaseURL}/natural/nutrients`,
        { query },
        {
          headers: {
            'x-app-id': environment.NUTRITIONIX_APP_ID,
            'x-app-key': environment.NUTRITIONIX_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.foods.map((food: NutritionixSearchResult) => ({
        name: food.food_name,
        calories_per_100g: Math.round((food.nf_calories / 100) * 100),
        protein_per_100g: Math.round((food.nf_protein / 100) * 100),
        carbs_per_100g: Math.round((food.nf_total_carbohydrate / 100) * 100),
        fats_per_100g: Math.round((food.nf_total_fat / 100) * 100),
         // external_id: food.nix_item_id,
      }));
    } catch (error) {
      console.error('Nutritionix API error:', error);
      throw new Error('Failed to search Nutritionix API');
    }
  }

  static async searchEdamam(query: string): Promise<NutritionData[]> {
    if (!environment.EDAMAM_APP_ID || !environment.EDAMAM_APP_KEY) {
      throw new Error('Edamam API credentials not configured');
    }

    try {
      const response = await axios.get(`${this.edamamBaseURL}/parser`, {
        params: {
          app_id: environment.EDAMAM_APP_ID,
          app_key: environment.EDAMAM_APP_KEY,
          ingr: query,
        },
      });

      return response.data.parsed.map((item: any) => ({
        name: item.food.label,
        calories_per_100g: Math.round(item.food.nutrients.ENERC_KCAL || 0),
        protein_per_100g: Math.round(item.food.nutrients.PROCNT || 0),
        carbs_per_100g: Math.round(item.food.nutrients.CHOCDF || 0),
        fats_per_100g: Math.round(item.food.nutrients.FAT || 0),
         // external_id: item.food.foodId,
      }));
    } catch (error) {
      console.error('Edamam API error:', error);
      throw new Error('Failed to search Edamam API');
    }
  }

  static async searchExternal(query: string): Promise<NutritionData[]> {
    const results: NutritionData[] = [];

    try {
      if (environment.NUTRITIONIX_APP_ID && environment.NUTRITIONIX_API_KEY) {
        const nutritionixResults = await this.searchNutritionix(query);
        results.push(...nutritionixResults);
      }
    } catch (error) {
      console.warn('Nutritionix search failed:', error);
    }

    try {
      if (environment.EDAMAM_APP_ID && environment.EDAMAM_APP_KEY) {
        const edamamResults = await this.searchEdamam(query);
        results.push(...edamamResults);
      }
    } catch (error) {
      console.warn('Edamam search failed:', error);
    }

    return results;
  }

  static validateNutritionData(data: Partial<NutritionData>): boolean {
    return !!(
      data.name &&
      typeof data.calories_per_100g === 'number' &&
      typeof data.protein_per_100g === 'number' &&
      typeof data.carbs_per_100g === 'number' &&
      typeof data.fats_per_100g === 'number' &&
      data.calories_per_100g >= 0 &&
      data.protein_per_100g >= 0 &&
      data.carbs_per_100g >= 0 &&
      data.fats_per_100g >= 0
    );
  }
}