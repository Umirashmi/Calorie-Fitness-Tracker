import { environment } from '../config/environment';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static cache = new Map<string, CacheItem<any>>();

  static set<T>(key: string, data: T, ttl: number = environment.CACHE_TTL): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert seconds to milliseconds
    };
    
    this.cache.set(key, item);
  }

  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  static size(): number {
    return this.cache.size;
  }

  static cleanExpired(): number {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  static generateFoodSearchKey(query: string): string {
    return `food_search:${query.toLowerCase().trim()}`;
  }

  static generateUserProfileKey(userId: string): string {
    return `user_profile:${userId}`;
  }

  static generateGoalKey(userId: string): string {
    return `user_goals:${userId}`;
  }

  static generateDailySummaryKey(userId: string, date: string): string {
    return `daily_summary:${userId}:${date}`;
  }

  static startCleanupInterval(intervalMs: number = 300000): NodeJS.Timeout {
    return setInterval(() => {
      const deleted = this.cleanExpired();
      if (deleted > 0) {
        console.log(`Cache cleanup: removed ${deleted} expired items`);
      }
    }, intervalMs);
  }
}