import { format, parseISO, startOfDay, endOfDay, subDays, addDays, isValid, differenceInDays } from 'date-fns';

export class DateHelpers {
  static formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  }

  static parseDate(dateString: string): Date {
    return parseISO(dateString);
  }

  static isValidDate(date: any): boolean {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj);
  }

  static getStartOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfDay(dateObj);
  }

  static getEndOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return endOfDay(dateObj);
  }

  static getToday(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  static getTodayDate(): Date {
    return startOfDay(new Date());
  }

  static getYesterday(): string {
    return format(subDays(new Date(), 1), 'yyyy-MM-dd');
  }

  static getTomorrow(): string {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  }

  static getDaysAgo(days: number): string {
    return format(subDays(new Date(), days), 'yyyy-MM-dd');
  }

  static getDaysFromNow(days: number): string {
    return format(addDays(new Date(), days), 'yyyy-MM-dd');
  }

  static getDateRange(startDate: string | Date, endDate: string | Date): string[] {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    const days: string[] = [];
    let currentDate = start;
    
    while (currentDate <= end) {
      days.push(format(currentDate, 'yyyy-MM-dd'));
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  }

  static getWeekRange(): { start: string; end: string } {
    const today = new Date();
    const start = subDays(today, 6);
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd'),
    };
  }

  static getMonthRange(): { start: string; end: string } {
    const today = new Date();
    const start = subDays(today, 29);
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd'),
    };
  }

  static daysBetween(startDate: string | Date, endDate: string | Date): number {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    return differenceInDays(end, start);
  }

  static isToday(date: string | Date): boolean {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    return dateStr === this.getToday();
  }

  static isYesterday(date: string | Date): boolean {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    return dateStr === this.getYesterday();
  }

  static isFutureDate(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = startOfDay(new Date());
    return dateObj > today;
  }

  static isPastDate(date: string | Date): boolean {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = startOfDay(new Date());
    return dateObj < today;
  }

  static formatDisplayDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (this.isToday(dateObj)) return 'Today';
    if (this.isYesterday(dateObj)) return 'Yesterday';
    
    return format(dateObj, 'MMM dd, yyyy');
  }

  static getDateForTimezone(date: Date | string, timezone: string = 'UTC'): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
  }

  static normalizeDate(date: any): string {
    if (!date) return this.getToday();
    
    if (typeof date === 'string') {
      if (this.isValidDate(date)) {
        return format(parseISO(date), 'yyyy-MM-dd');
      }
      return this.getToday();
    }
    
    if (date instanceof Date && this.isValidDate(date)) {
      return format(date, 'yyyy-MM-dd');
    }
    
    return this.getToday();
  }

  static createDateRangeArray(startDate: string, endDate: string, maxDays: number = 365): string[] {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (!this.isValidDate(start) || !this.isValidDate(end) || start > end) {
      return [];
    }
    
    const daysDiff = differenceInDays(end, start);
    if (daysDiff > maxDays) {
      return [];
    }
    
    return this.getDateRange(start, end);
  }

  static getWeekdayName(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'EEEE');
  }

  static getMonthName(date: string | Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMMM');
  }
}