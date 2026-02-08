# API Calling Behavior Test Documentation

## Implementation Summary

I have successfully implemented the requested API calling strategy for your React Native calorie tracker app:

### ✅ Changes Made:

1. **AuthGuard Enhancement**: 
   - Added `isAuthChecked` state to ensure components only render after authentication is confirmed
   - Prevents any API calls before user login

2. **Fresh Data Hook (`useFreshData`)**:
   - Created a custom hook that handles page-specific API calls
   - Only calls APIs when user is authenticated
   - Provides separate methods for each page type

3. **Updated All Pages**:
   - **Dashboard**: Calls `loadDashboardData()` on every visit
   - **Log Food**: Calls `loadLogFoodData()` on every visit  
   - **Analytics**: Calls `loadAnalyticsData()` on every visit
   - **Profile**: Calls `loadProfileData()` on every visit

4. **Removed Automatic API Calls**:
   - Removed `useEffect` calls in `NutritionContext` that were auto-loading data
   - Each page now explicitly triggers its required API calls

5. **Updated Caching Strategy**:
   - Modified `getFavoriteFoods()` and `getDailyGoals()` to always fetch fresh data first
   - Cache is only used as fallback when API fails

### 🔄 API Calling Pattern:

**Before Login**: ❌ No API calls are made
**After Login**: ✅ Fresh API calls on every page visit

#### Page-Specific API Calls:

- **Dashboard**:
  - `refreshDailyData(currentDate)`
  - `loadRecentFoods()`
  - `loadFavoriteFoods()`
  - `nutritionService.getDailyGoals()`

- **Analytics**:
  - `refreshWeeklyStats()`
  - `refreshMonthlyStats()`
  - `refreshDailyData(currentDate)`

- **Log Food**:
  - `loadRecentFoods()`
  - `loadFavoriteFoods()`
  - `refreshDailyData(currentDate)`

- **Profile**:
  - `refreshDailyData(currentDate)`

### 📱 Testing Instructions:

1. **Start the app** - No API calls should be made initially
2. **Login** - Authentication APIs only
3. **Navigate to Dashboard** - Should trigger dashboard-specific API calls
4. **Switch to Analytics** - Should trigger analytics-specific API calls
5. **Go to Log Food** - Should trigger food-logging API calls
6. **Visit Profile** - Should trigger profile-specific API calls
7. **Switch between tabs** - Each visit should trigger fresh API calls

### ✨ Benefits:

- **Real-time data**: Always shows the latest information
- **Secure**: No API calls before authentication
- **Efficient**: Only calls relevant APIs for each page
- **Reliable**: Fresh data on every page visit
- **User-friendly**: Clear loading states and error handling

The implementation ensures that every page visit fetches the most current data from your backend, providing users with real-time information while maintaining security by preventing any API calls until after successful authentication.