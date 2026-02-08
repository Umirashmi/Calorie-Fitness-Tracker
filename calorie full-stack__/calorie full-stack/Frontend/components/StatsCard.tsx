import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Card, 
  Text, 
  Surface, 
  useTheme,
  ProgressBar,
  Divider,
} from 'react-native-paper';

interface StatItem {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  progress?: number; // 0 to 1
  subtitle?: string;
}

interface StatsCardProps {
  title: string;
  stats: StatItem[];
  layout?: 'grid' | 'list' | 'horizontal';
  showProgress?: boolean;
  style?: any;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  stats,
  layout = 'grid',
  showProgress = false,
  style,
}) => {
  const theme = useTheme();

  const renderStatItem = (stat: StatItem, index: number) => {
    const isLast = index === stats.length - 1;
    
    if (layout === 'list') {
      return (
        <View key={index}>
          <View style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <Text variant="bodyMedium" style={styles.statLabel}>
                {stat.label}
              </Text>
              {stat.subtitle && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {stat.subtitle}
                </Text>
              )}
            </View>
            
            <View style={styles.listItemRight}>
              <Text variant="headlineSmall" style={{ 
                color: stat.color || theme.colors.primary 
              }}>
                {stat.value}
                {stat.unit && (
                  <Text variant="bodyMedium"> {stat.unit}</Text>
                )}
              </Text>
            </View>
          </View>
          
          {showProgress && stat.progress !== undefined && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={stat.progress}
                color={stat.color || theme.colors.primary}
                style={styles.progressBar}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {Math.round(stat.progress * 100)}%
              </Text>
            </View>
          )}
          
          {!isLast && <Divider style={styles.divider} />}
        </View>
      );
    }

    if (layout === 'horizontal') {
      return (
        <Surface 
          key={index}
          style={[
            styles.horizontalItem,
            { backgroundColor: stat.color ? `${stat.color}15` : theme.colors.surfaceVariant }
          ]} 
          elevation={1}
        >
          <Text variant="headlineSmall" style={{ 
            color: stat.color || theme.colors.primary 
          }}>
            {stat.value}
            {stat.unit && (
              <Text variant="bodyMedium">{stat.unit}</Text>
            )}
          </Text>
          <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            {stat.label}
          </Text>
          {stat.subtitle && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {stat.subtitle}
            </Text>
          )}
          {showProgress && stat.progress !== undefined && (
            <ProgressBar
              progress={stat.progress}
              color={stat.color || theme.colors.primary}
              style={styles.progressBar}
            />
          )}
        </Surface>
      );
    }

    // Grid layout (default)
    return (
      <Surface 
        key={index}
        style={[
          styles.gridItem,
          { backgroundColor: stat.color ? `${stat.color}15` : theme.colors.surfaceVariant }
        ]} 
        elevation={1}
      >
        <Text variant="headlineSmall" style={{ 
          color: stat.color || theme.colors.primary 
        }}>
          {stat.value}
          {stat.unit && (
            <Text variant="bodyMedium">{stat.unit}</Text>
          )}
        </Text>
        <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
          {stat.label}
        </Text>
        {stat.subtitle && (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {stat.subtitle}
          </Text>
        )}
        {showProgress && stat.progress !== undefined && (
          <ProgressBar
            progress={stat.progress}
            color={stat.color || theme.colors.primary}
            style={styles.progressBar}
          />
        )}
      </Surface>
    );
  };

  const getContainerStyle = () => {
    switch (layout) {
      case 'list':
        return styles.listContainer;
      case 'horizontal':
        return styles.horizontalContainer;
      default:
        return styles.gridContainer;
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }, style]} elevation={2}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        
        <View style={getContainerStyle()}>
          {stats.map((stat, index) => renderStatItem(stat, index))}
        </View>
      </Card.Content>
    </Card>
  );
};

interface QuickStatsProps {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fats: { current: number; target: number };
  style?: any;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  calories,
  protein,
  carbs,
  fats,
  style,
}) => {
  const theme = useTheme();

  const stats: StatItem[] = [
    {
      label: 'Calories',
      value: Math.round(calories.current),
      unit: 'cal',
      color: theme.colors.calories,
      progress: calories.target > 0 ? Math.min(calories.current / calories.target, 1) : 0,
      subtitle: `/ ${calories.target} cal`,
    },
    {
      label: 'Protein',
      value: Math.round(protein.current),
      unit: 'g',
      color: theme.colors.protein,
      progress: protein.target > 0 ? Math.min(protein.current / protein.target, 1) : 0,
      subtitle: `/ ${protein.target}g`,
    },
    {
      label: 'Carbs',
      value: Math.round(carbs.current),
      unit: 'g',
      color: theme.colors.carbs,
      progress: carbs.target > 0 ? Math.min(carbs.current / carbs.target, 1) : 0,
      subtitle: `/ ${carbs.target}g`,
    },
    {
      label: 'Fats',
      value: Math.round(fats.current),
      unit: 'g',
      color: theme.colors.fats,
      progress: fats.target > 0 ? Math.min(fats.current / fats.target, 1) : 0,
      subtitle: `/ ${fats.target}g`,
    },
  ];

  return (
    <StatsCard
      title="Today's Progress"
      stats={stats}
      layout="grid"
      showProgress={true}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  horizontalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  horizontalItem: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  listContainer: {
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  statLabel: {
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  progressContainer: {
    marginTop: 8,
    gap: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
});

export default StatsCard;