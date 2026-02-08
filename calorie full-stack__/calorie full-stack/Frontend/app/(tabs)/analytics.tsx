import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  SegmentedButtons,
  Surface,
  useTheme,
  Button,
  List,
  Chip,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useNutrition, useQuickStats } from '../../hooks/useNutrition';
import { useFreshData } from '../../hooks/useFreshData';
import '../../theme/paperTheme';

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 48;

type TimeRange = '7d' | '30d' | '90d';

const AnalyticsScreen: React.FC = () => {
  const theme = useTheme();
  const { 
    weeklyStats, 
    monthlyStats, 
    goalProgress,
    isLoading 
  } = useNutrition();

  const { loadAnalyticsData, isReady } = useFreshData();
  
  const quickStats = useQuickStats() || {
    weekly: { 
      daysLogged: 0, 
      consistency: 0, 
      averageCalories: 0 
    },
    monthly: { 
      daysLogged: 0, 
      goalAdherence: 0 
    }
  };
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Call API on every page visit when authenticated
  useEffect(() => {
    if (isReady) {
      loadAnalyticsData();
    }
  }, [isReady, loadAnalyticsData]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAnalyticsData();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurface,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: theme.colors.outline,
      strokeOpacity: 0.2,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  // Mock data for demonstration
  const generateMockCaloriesData = () => {
    const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      if (selectedRange === '7d') {
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      } else {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      
      // Mock data with some variation
      data.push(1800 + Math.random() * 800);
    }
    
    return { labels, datasets: [{ data }] };
  };

  const generateMockMacrosData = () => {
    return [
      {
        name: 'Protein',
        population: goalProgress?.current.protein || 120,
        color: theme.colors.protein,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 14,
      },
      {
        name: 'Carbs',
        population: goalProgress?.current.carbs || 200,
        color: theme.colors.carbs,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 14,
      },
      {
        name: 'Fats',
        population: goalProgress?.current.fats || 60,
        color: theme.colors.fats,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 14,
      },
    ];
  };

  const renderOverviewCard = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Overview
        </Text>
        
        <View style={styles.overviewGrid}>
          <View style={styles.overviewItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {quickStats?.weekly?.daysLogged || 0}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Days Logged
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              This Week
            </Text>
          </View>

          <View style={styles.overviewItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {(quickStats?.weekly?.consistency || 0).toFixed(0)}%
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Consistency
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              This Week
            </Text>
          </View>

          <View style={styles.overviewItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {Math.round(quickStats?.weekly?.averageCalories || 0)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Avg Calories
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Per Day
            </Text>
          </View>

          <View style={styles.overviewItem}>
            <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
              {(quickStats?.monthly?.goalAdherence || 0).toFixed(0)}%
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Goal Adherence
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              This Month
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // const renderCaloriesChart = () => (
  //   <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
  //     <Card.Content>
  //       <View style={styles.chartHeader}>
  //         <Text variant="titleMedium" style={styles.cardTitle}>
  //           Calorie Trends
  //         </Text>
  //         <SegmentedButtons
  //           value={selectedRange}
  //           onValueChange={(value) => setSelectedRange(value as TimeRange)}
  //           buttons={timeRangeOptions}
  //           style={styles.segmentedButtons}
  //         />
  //       </View>

  //       <ScrollView horizontal showsHorizontalScrollIndicator={false}>
  //         <LineChart
  //           data={generateMockCaloriesData()}
  //           width={Math.max(chartWidth, selectedRange === '90d' ? chartWidth * 2 : chartWidth)}
  //           height={220}
  //           chartConfig={chartConfig}
  //           bezier
  //           style={styles.chart}
  //           withInnerLines
  //           withOuterLines
  //           withVerticalLines
  //           withHorizontalLines
  //           withDots
  //           withShadow={false}
  //           fromZero
  //         />
  //       </ScrollView>

  //       {goalProgress && (
  //         <View style={styles.chartFooter}>
  //           <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
  //             Daily Goal: {goalProgress.target.calories} calories
  //           </Text>
  //         </View>
  //       )}
  //     </Card.Content>
  //   </Card>
  // );

  const renderMacrosChart = () => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          Today's Macros
        </Text>

        <PieChart
          data={generateMockMacrosData()}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft=''
          absolute
        />

        {goalProgress && (
          <View style={styles.macroSummary}>
            <View style={styles.macroRow}>
              <View style={[styles.macroIndicator, { backgroundColor: theme.colors.protein }]} />
              <Text variant="bodyMedium">
                Protein: {Math.round(goalProgress.current.protein)}g / {goalProgress.target.protein}g
              </Text>
            </View>
            <View style={styles.macroRow}>
              <View style={[styles.macroIndicator, { backgroundColor: theme.colors.carbs }]} />
              <Text variant="bodyMedium">
                Carbs: {Math.round(goalProgress.current.carbs)}g / {goalProgress.target.carbs}g
              </Text>
            </View>
            <View style={styles.macroRow}>
              <View style={[styles.macroIndicator, { backgroundColor: theme.colors.fats }]} />
              <Text variant="bodyMedium">
                Fats: {Math.round(goalProgress.current.fats)}g / {goalProgress.target.fats}g
              </Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Analytics
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Track your nutrition progress
        </Text>
      </View>

      {renderOverviewCard()}
      {/* {renderCaloriesChart()} */}
      {renderMacrosChart()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    lineHeight: 20,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  overviewItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  segmentedButtons: {
    width: 200,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
  macroSummary: {
    marginTop: 16,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  insightItem: {
    marginBottom: 8,
  },
  insightListItem: {
    paddingHorizontal: 0,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  streakItem: {
    alignItems: 'center',
  },
  achievementContainer: {
    marginTop: 16,
  },
  achievementTitle: {
    marginBottom: 12,
    fontWeight: '500',
  },
  achievementChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  achievementChip: {
    marginRight: 0,
  },
});

export default AnalyticsScreen;