import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  FAB, 
  Button, 
  Chip, 
  ProgressBar,
  useTheme,
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useNutrition, useMacroProgress, useWaterProgress, useQuickStats } from '../../hooks/useNutrition';
import { useFreshData } from '../../hooks/useFreshData';
import { MealType } from '../../types/nutrition';
import '../../theme/paperTheme';

const DashboardScreen: React.FC = () => {
  const theme: any = useTheme();
  const { user } = useAuth();
  const { 
    currentDate, 
    isToday, 
    refreshDailyData, 
    error,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    logWater,
    entriesByMeal,
  }: any = useNutrition();
  
  const { loadDashboardData, isReady } = useFreshData();
  const macroProgress = useMacroProgress();
  const waterProgress = useWaterProgress();
  const quickStats = useQuickStats();
  
  const [refreshing, setRefreshing] = useState(false);

  // Call API on every page visit when authenticated
  useEffect(() => {
    if (isReady) {
      loadDashboardData();
    }
  }, [isReady, loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogWater = async (amount: number) => {
    await logWater(amount, currentDate);
  };

  const formatDate = (date: string): string => {
    const dateObj = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date === today.toLocaleDateString('en-CA')) {
      return 'Today';
    } else if (date === yesterday.toLocaleDateString('en-CA')) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMealProgress = (mealType: MealType): number => {
    const entries = entriesByMeal[mealType];
    return entries.length > 0 ? 1 : 0;
  };

  const getMealCalories = (mealType: MealType): number => {
    return entriesByMeal[mealType].reduce((total: number, entry: any) => {
      // Correct calculation: food values are per 100g, servingSize is actual consumption in grams
      return total + (entry.food.calories * entry.servingSize) / 100;
    }, 0);
  };

  const renderProgressCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Daily Progress
        </Text>
        
        {macroProgress.calories.target > 0 ? (
          <View style={styles.macroContainer}>
            <View style={styles.macroItem}>
              <Text variant="bodySmall" style={{ color: theme.colors.calories }}>
                Calories
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.calories }}>
                {Math.round(macroProgress.calories.current)}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                / {macroProgress.calories.target}
              </Text>
              <ProgressBar 
                progress={macroProgress.calories.percentage / 100} 
                color={theme.colors.calories}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.macroItem}>
              <Text variant="bodySmall" style={{ color: theme.colors.protein }}>
                Protein
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.protein }}>
                {Math.round(macroProgress.protein.current)}g
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                / {macroProgress.protein.target}g
              </Text>
              <ProgressBar 
                progress={macroProgress.protein.percentage / 100} 
                color={theme.colors.protein}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.macroItem}>
              <Text variant="bodySmall" style={{ color: theme.colors.carbs }}>
                Carbs
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.carbs }}>
                {Math.round(macroProgress.carbs.current)}g
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                / {macroProgress.carbs.target}g
              </Text>
              <ProgressBar 
                progress={macroProgress.carbs.percentage / 100} 
                color={theme.colors.carbs}
                style={styles.progressBar}
              />
            </View>

            <View style={styles.macroItem}>
              <Text variant="bodySmall" style={{ color: theme.colors.fats }}>
                Fats
              </Text>
              <Text variant="headlineSmall" style={{ color: theme.colors.fats }}>
                {Math.round(macroProgress.fats.current)}g
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                / {macroProgress.fats.target}g
              </Text>
              <ProgressBar 
                progress={macroProgress.fats.percentage / 100} 
                color={theme.colors.fats}
                style={styles.progressBar}
              />
            </View>
          </View>
        ) : (
          <View style={styles.noGoalsContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 12 }}>
              No nutrition goals set yet
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/goal-setting')}
              style={{ alignSelf: 'center' }}
            >
              Set Goals
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderMealsCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Meals
        </Text>
        
        <View style={styles.mealsContainer}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
            <Surface 
              key={mealType}
              style={[
                styles.mealItem, 
                { backgroundColor: theme.colors.surfaceVariant }
              ]}
              elevation={1}
            >
              <View style={styles.mealHeader}>
                <Text variant="labelLarge" style={styles.mealTitle}>
                  {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                  {Math.round(getMealCalories(mealType))} cal
                </Text>
              </View>
              
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {entriesByMeal[mealType].length} items
              </Text>
              
              <Button 
                mode="text"
                compact
                onPress={() => router.push({
                  pathname: '/log-food',
                  params: { mealType }
                })}
                style={styles.mealButton}
              >
                {entriesByMeal[mealType].length > 0 ? 'View' : 'Add'}
              </Button>
            </Surface>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderWaterCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <View style={styles.waterHeader}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Water Intake
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            {waterProgress.current} / {waterProgress.target} ml
          </Text>
        </View>
        
        <ProgressBar 
          progress={waterProgress.percentage / 100}
          color={theme.colors.info}
          style={styles.waterProgressBar}
        />
        
        <View style={styles.waterButtons}>
          {[250, 500, 750].map((amount) => (
            <Chip
              key={amount}
              mode="outlined"
              onPress={() => handleLogWater(amount)}
              style={styles.waterChip}
            >
              +{amount}ml
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderQuickStatsCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Quick Stats
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {quickStats.weekly.consistency.toFixed(0)}%
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Week Consistency
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {quickStats.monthly.daysLogged}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Days Logged
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {Math.round(quickStats.weekly.averageCalories)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Avg Calories
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.dateHeader, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <IconButton
          icon="chevron-left"
          onPress={goToPreviousDay}
          iconColor={theme.colors.onSurface}
        />
        
        <View style={styles.dateContainer}>
          <Text variant="titleMedium" style={styles.dateText}>
            {formatDate(currentDate)}
          </Text>
          {!isToday && (
            <Button
              mode="text"
              compact
              onPress={goToToday}
              style={styles.todayButton}
            >
              Today
            </Button>
          )}
        </View>
        
        <IconButton
          icon="chevron-right"
          onPress={goToNextDay}
          iconColor={theme.colors.onSurface}
          disabled={isToday}
        />
      </Surface>

      <View style={styles.greeting}>
        <Text variant="headlineSmall" style={styles.greetingText}>
          Hello, {user?.name || 'there'}! 👋
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {isToday ? "Let's track your nutrition today" : `Viewing ${formatDate(currentDate)}`}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Card.Content>
              <Text style={{ color: theme.colors.onErrorContainer }}>
                {error}
              </Text>
            </Card.Content>
          </Card>
        )}

        {renderProgressCard()}
        {renderMealsCard()}
        {renderWaterCard()}
        {renderQuickStatsCard()}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/log-food')}
        label={isToday ? "Log Food" : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontWeight: '600',
  },
  todayButton: {
    marginTop: -4,
  },
  greeting: {
    padding: 16,
    paddingBottom: 8,
  },
  greetingText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  errorCard: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    marginTop: 8,
    height: 6,
    borderRadius: 3,
  },
  mealsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 8,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealTitle: {
    fontWeight: '500',
  },
  mealButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  waterProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 90,
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: -80
  },
  waterChip: {
    // flex: 1,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  noGoalsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
  },
});

export default DashboardScreen;