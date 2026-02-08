import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Card, 
  Text, 
  ProgressBar, 
  Surface, 
  useTheme,
  Button,
} from 'react-native-paper';
import { MacroGoals, NutritionSummary } from '../types/nutrition';

interface NutritionCardProps {
  title: string;
  current: NutritionSummary;
  target?: MacroGoals;
  showProgress?: boolean;
  onViewDetails?: () => void;
  style?: any;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  title,
  current,
  target,
  showProgress = true,
  onViewDetails,
  style,
}) => {
  const theme = useTheme();

  const calculatePercentage = (current: number, target: number): number => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0;
  };

  const macros = [
    {
      name: 'Calories',
      current: current.calories,
      target: target?.calories || 0,
      color: theme.colors.calories,
      unit: 'cal',
    },
    {
      name: 'Protein',
      current: current.protein,
      target: target?.protein || 0,
      color: theme.colors.protein,
      unit: 'g',
    },
    {
      name: 'Carbs',
      current: current.carbs,
      target: target?.carbs || 0,
      color: theme.colors.carbs,
      unit: 'g',
    },
    {
      name: 'Fats',
      current: current.fats,
      target: target?.fats || 0,
      color: theme.colors.fats,
      unit: 'g',
    },
  ];

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }, style]} elevation={2}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          {onViewDetails && (
            <Button mode="text" compact onPress={onViewDetails}>
              Details
            </Button>
          )}
        </View>

        {showProgress && target ? (
          <View style={styles.progressContainer}>
            {macros.map((macro) => (
              <View key={macro.name} style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text variant="labelMedium" style={{ color: macro.color }}>
                    {macro.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {Math.round(macro.current)}{macro.unit} / {macro.target}{macro.unit}
                  </Text>
                </View>
                <ProgressBar
                  progress={calculatePercentage(macro.current, macro.target) / 100}
                  color={macro.color}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {Math.round(calculatePercentage(macro.current, macro.target))}%
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            {macros.map((macro) => (
              <Surface
                key={macro.name}
                style={[
                  styles.summaryItem,
                  { backgroundColor: `${macro.color}20` }
                ]}
                elevation={1}
              >
                <Text variant="headlineSmall" style={{ color: macro.color }}>
                  {Math.round(macro.current)}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {macro.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {macro.unit}
                </Text>
              </Surface>
            ))}
          </View>
        )}

        {current.fiber !== undefined || current.sugar !== undefined || current.sodium !== undefined ? (
          <View style={styles.additionalNutrients}>
            <Text variant="labelMedium" style={styles.additionalTitle}>
              Additional Nutrients
            </Text>
            <View style={styles.additionalGrid}>
              {current.fiber !== undefined && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Fiber: {Math.round(current.fiber * 10) / 10}g
                </Text>
              )}
              {current.sugar !== undefined && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Sugar: {Math.round(current.sugar * 10) / 10}g
                </Text>
              )}
              {current.sodium !== undefined && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Sodium: {Math.round(current.sodium)}mg
                </Text>
              )}
            </View>
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
  },
  progressContainer: {
    gap: 12,
  },
  macroItem: {
    gap: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  additionalNutrients: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  additionalTitle: {
    marginBottom: 8,
    fontWeight: '500',
  },
  additionalGrid: {
    gap: 4,
  },
});

export default NutritionCard;