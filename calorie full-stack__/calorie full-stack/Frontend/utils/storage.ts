import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface StorageItem {
  key: string;
  value: any;
  expiresAt?: number;
}

export interface SecureStorageItem {
  key: string;
  value: string;
}

/**
 * AsyncStorage utilities for non-sensitive data
 */
class AsyncStorageUtil {
  /**
   * Store data with optional expiration
   */
  static async setItem(key: string, value: any, expirationHours?: number): Promise<void> {
    try {
      const item: StorageItem = {
        key,
        value,
        expiresAt: expirationHours ? Date.now() + (expirationHours * 60 * 60 * 1000) : undefined,
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error(`Failed to store item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data with expiration check
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const item: StorageItem = JSON.parse(stored);
      
      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await this.removeItem(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      console.error(`Failed to retrieve item ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  static async hasItem(key: string): Promise<boolean> {
    const item = await this.getItem(key);
    return item !== null;
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
      throw error;
    }
  }

  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  static async multiGet(keys: string[]): Promise<{ [key: string]: any }> {
    try {
      const items = await AsyncStorage.multiGet(keys);
      const result: { [key: string]: any } = {};

      for (const [key, value] of items) {
        if (value) {
          try {
            const item: StorageItem = JSON.parse(value);
            
            // Check expiration
            if (item.expiresAt && Date.now() > item.expiresAt) {
              await this.removeItem(key);
              continue;
            }

            result[key] = item.value;
          } catch (parseError) {
            console.warn(`Failed to parse item ${key}:`, parseError);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get multiple items:', error);
      return {};
    }
  }

  static async multiSet(items: { key: string; value: any; expirationHours?: number }[]): Promise<void> {
    try {
      const pairs: [string, string][] = items.map(({ key, value, expirationHours }) => {
        const item: StorageItem = {
          key,
          value,
          expiresAt: expirationHours ? Date.now() + (expirationHours * 60 * 60 * 1000) : undefined,
        };
        return [key, JSON.stringify(item)];
      });

      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      console.error('Failed to set multiple items:', error);
      throw error;
    }
  }
}

class SecureStorageUtil {
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Failed to store secure item ${key}:`, error);
      throw error;
    }
  }


  static async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to retrieve secure item ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      throw error;
    }
  }

  static async hasItem(key: string): Promise<boolean> {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item !== null;
    } catch (error) {
      console.error(`Failed to check secure item ${key}:`, error);
      return false;
    }
  }

  static async setJSON(key: string, value: any): Promise<void> {
    try {
      await this.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to store secure JSON ${key}:`, error);
      throw error;
    }
  }

  static async getJSON<T>(key: string): Promise<T | null> {
    try {
      const stored = await this.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`Failed to retrieve secure JSON ${key}:`, error);
      return null;
    }
  }
}

class CacheUtil {
  private static readonly CACHE_PREFIX = 'cache_';

  static async set(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    await AsyncStorageUtil.setItem(cacheKey, data, ttlMinutes / 60);
  }

  static async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.CACHE_PREFIX + key;
    return await AsyncStorageUtil.getItem<T>(cacheKey);
  }


  static async remove(key: string): Promise<void> {
    const cacheKey = this.CACHE_PREFIX + key;
    await AsyncStorageUtil.removeItem(cacheKey);
  }

  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorageUtil.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      await Promise.all(
        cacheKeys.map(key => AsyncStorageUtil.removeItem(key))
      );
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }


  static async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttlMinutes: number = 60
  ): Promise<T> {
    let cached = await this.get<T>(key);
    
    if (cached === null) {
      cached = await fallbackFn();
      await this.set(key, cached, ttlMinutes);
    }
    
    return cached;
  }
}


export const STORAGE_KEYS = {
  // Auth related
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
  
  // App settings
  THEME_MODE: 'theme_mode',
  NOTIFICATION_SETTINGS: 'notification_settings',
  APP_SETTINGS: 'app_settings',
  
  // Nutrition data
  RECENT_FOODS: 'recent_foods',
  FAVORITE_FOODS: 'favorite_foods',
  DAILY_GOALS: 'daily_goals',
  OFFLINE_LOGS: 'offline_logs',
  SEARCH_HISTORY: 'search_history',
  
  // Cache keys
  FOOD_SEARCH_CACHE: 'food_search_',
  USER_PROFILE_CACHE: 'user_profile',
  NUTRITION_DATA_CACHE: 'nutrition_data_',
  
  // Onboarding and tutorials
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FEATURE_INTRODUCTIONS: 'feature_introductions',
};

class MigrationUtil {
  private static readonly MIGRATION_VERSION_KEY = 'storage_migration_version';
  private static readonly CURRENT_VERSION = 1;


  static async runMigrations(): Promise<void> {
    try {
      const currentVersion = await AsyncStorageUtil.getItem<number>(this.MIGRATION_VERSION_KEY) || 0;
      
      if (currentVersion < this.CURRENT_VERSION) {
        console.log(`Running storage migrations from v${currentVersion} to v${this.CURRENT_VERSION}`);
        
        // Run migrations in sequence
        for (let version = currentVersion + 1; version <= this.CURRENT_VERSION; version++) {
          await this.runMigration(version);
        }
        
        await AsyncStorageUtil.setItem(this.MIGRATION_VERSION_KEY, this.CURRENT_VERSION);
      }
    } catch (error) {
      console.error('Failed to run storage migrations:', error);
    }
  }

  private static async runMigration(version: number): Promise<void> {
    switch (version) {
      case 1:
        await this.migrationV1();
        break;
      // Add more migrations as needed
    }
  }

  private static async migrationV1(): Promise<void> {
    // Example migration: rename old keys to new format
    try {
      const oldUserData = await AsyncStorage.getItem('user');
      if (oldUserData) {
        await AsyncStorageUtil.setItem(STORAGE_KEYS.USER_DATA, JSON.parse(oldUserData));
        await AsyncStorage.removeItem('user');
      }
    } catch (error) {
      console.warn('Migration v1 failed:', error);
    }
  }
}

export {
  AsyncStorageUtil,
  SecureStorageUtil,
  CacheUtil,
  MigrationUtil,
};

export default {
  async: AsyncStorageUtil,
  secure: SecureStorageUtil,
  cache: CacheUtil,
  migration: MigrationUtil,
};