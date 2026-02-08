import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ApiResponse, 
  AuthTokens, 
  LoginCredentials, 
  RegisterData,
  User,
  ProfileUpdate,
} from '../types/nutrition';

const API_BASE_URL = __DEV__ 
  ? 'http://100.66.129.63:3000/api' 
  : 'https://api.nutritiontracker.com/api';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.warn('Failed to get access token:', error);
      return null;
    }
  }

  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.warn('Failed to get refresh token:', error);
      return null;
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokens.expiresAt),
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  private async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  private async isTokenExpired(): Promise<boolean> {
    try {
      const expiryString = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      if (!expiryString) return true;

      const expiryTime = new Date(expiryString).getTime();
      const now = new Date().getTime();
      
      // Consider token expired if it expires within 5 minutes
      return (expiryTime - now) < 5 * 60 * 1000;
    } catch (error) {
      console.warn('Failed to check token expiry:', error);
      return true;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data: ApiResponse<AuthTokens> = await response.json();
      
      if (data.success && data.data) {
        await this.storeTokens(data.data);
        return data.data.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  private async getValidAccessToken(): Promise<string | null> {
    const currentToken = await this.getAccessToken();
    if (!currentToken) return null;

    if (await this.isTokenExpired()) {
      return await this.refreshAccessToken();
    }

    return currentToken;
  }

  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = await this.getValidAccessToken();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data: ApiResponse<T> = await response.json();

        // Handle unauthorized responses
        if (response.status === 401) {
          await this.clearTokens();
          throw new Error('Authentication required');
        }

        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        data: null as unknown as T,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response: any = await this.makeRequest<{ user: any; tokens: AuthTokens }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    if (response.success && response.data) {
      await this.storeTokens(response.data.tokens);
      
      // Transform user data
      const transformedUser: User = {
        ...response.data.user,
        activityLevel: response.data.user.activity_level,
      };
      delete (transformedUser as any).activity_level;
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(transformedUser));
      
      return {
        ...response,
        data: {
          user: transformedUser,
          tokens: response.data.tokens,
        }
      };
    }

    return response;
  }

  async register(userData: RegisterData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    const response: any = await this.makeRequest<{ user: any; tokens: AuthTokens }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    if (response.success && response.data) {
      await this.storeTokens(response.data.tokens);
      
      // Transform user data
      const transformedUser: User = {
        ...response.data.user,
        activityLevel: response.data.user.activity_level,
      };
      delete (transformedUser as any).activity_level;
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(transformedUser));
      
      return {
        ...response,
        data: {
          user: transformedUser,
          tokens: response.data.tokens,
        }
      };
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      await this.clearTokens();
    }
  }

  // User profile methods
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.makeRequest<any>('/user/profile');
    
    if (response.success && response.data) {
      // Transform backend response to frontend format
      const transformedUser: User = {
        ...response.data,
        activityLevel: response.data.activity_level, // Transform snake_case to camelCase
      };
      delete (transformedUser as any).activity_level; // Remove the snake_case version
      
      return {
        ...response,
        data: transformedUser,
      };
    }
    
    return response;
  }

  async updateProfile(updates: ProfileUpdate): Promise<ApiResponse<User>> {
    const response = await this.makeRequest<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success && response.data) {
      // Transform backend response to frontend format
      const transformedUser: User = {
        ...response.data,
        activityLevel: response.data.activity_level, // Transform snake_case to camelCase
      };
      delete (transformedUser as any).activity_level; // Remove the snake_case version
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(transformedUser));
      
      return {
        ...response,
        data: transformedUser,
      };
    }

    return response;
  }

  // Utility methods
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      
      // Handle legacy data format - transform if needed
      if (user.activity_level && !user.activityLevel) {
        user.activityLevel = user.activity_level;
        delete user.activity_level;
        // Update storage with transformed data
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      }
      
      return user;
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidAccessToken();
    return !!token;
  }

  // Food methods
  async createFood(foodData: {
    name: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fats_per_100g: number;
    serving_size?: number;
    serving_unit?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/foods', {
      method: 'POST',
      body: JSON.stringify(foodData),
    });
  }

  // Food logging methods
  async logFood(logData: {
    food_id: string;
    portion_size: number;
    quantity: number;
    meal_type: string;
    logged_date?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest('/log', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async updateFoodLog(logId: string, updates: {
    portion_size?: number;
    meal_type?: string;
    logged_date?: string;
  }): Promise<ApiResponse<any>> {
    return this.makeRequest(`/logs/${logId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteFoodLog(logId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/logs/${logId}`, {
      method: 'DELETE',
    });
  }

  async getDailyLogs(date?: string): Promise<ApiResponse<any>> {
    const endpoint = date ? `/logs/date/${date}` : '/logs/today';
    return this.makeRequest(endpoint);
  }

  async getDailyLogsByMealType(date: string, mealType: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/logs/date/${date}?mealType=${mealType}`);
  }

  async getLogsRange(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/logs/range?start_date=${startDate}&end_date=${endDate}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }
}

export const ApisClient = new ApiClient();
// export default ApisClient;