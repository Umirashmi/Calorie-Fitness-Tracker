import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  TextInput, 
  Button, 
  Switch, 
  HelperText,
  useTheme,
  Surface,
  Divider,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useNutrition } from '../hooks/useNutrition';
import { useProfile } from '../hooks/useProfile';
import { MacroGoals } from '../types/nutrition';
import { AuthGuard } from '../components/AuthGuard';

const GoalSettingScreen: React.FC = () => {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const { dailyGoals, updateDailyGoals, isLoading } = useNutrition();
  const { calculatedMetrics, generateRecommendedGoals } = useProfile();

  const [goals, setGoals] = useState<MacroGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 65,
  });

  const [useRecommended, setUseRecommended] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dailyGoals) {
      setGoals(dailyGoals);
    }

    // Check if we have recommended goals from params
    if (params.recommended) {
      try {
        const recommendedGoals = JSON.parse(params.recommended as string);
        setGoals(recommendedGoals);
        setUseRecommended(true);
      } catch (error) {
        console.warn('Failed to parse recommended goals:', error);
      }
    }
  }, [dailyGoals, params.recommended]);

  const validateGoals = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (goals.calories < 800 || goals.calories > 5000) {
      newErrors.calories = 'Calories should be between 800 and 5000';
    }

    if (goals.protein < 20 || goals.protein > 400) {
      newErrors.protein = 'Protein should be between 20g and 400g';
    }

    if (goals.carbs < 20 || goals.carbs > 800) {
      newErrors.carbs = 'Carbs should be between 20g and 800g';
    }

    if (goals.fats < 15 || goals.fats > 200) {
      newErrors.fats = 'Fats should be between 15g and 200g';
    }


    // Check macro distribution makes sense
    const proteinCalories = goals.protein * 4;
    const carbCalories = goals.carbs * 4;
    const fatCalories = goals.fats * 9;
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

    if (Math.abs(totalMacroCalories - goals.calories) > goals.calories * 0.1) {
      newErrors.distribution = 'Macro distribution doesn\'t match calorie goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateGoals()) return;

    setIsSaving(true);
    try {
      const success = await updateDailyGoals(goals);
      if (success) {
        Alert.alert('Success', 'Your goals have been updated!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update goals. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseRecommended = () => {
    const recommended = generateRecommendedGoals();
    if (recommended) {
      setGoals(recommended);
      setUseRecommended(true);
      setErrors({});
    }
  };

  const handleReset = () => {
    if (dailyGoals) {
      setGoals(dailyGoals);
    }
    setUseRecommended(false);
    setErrors({});
  };

  const updateGoal = (key: keyof MacroGoals, value: number) => {
    setGoals(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
    setUseRecommended(false);
  };

  const renderMacroInput = (
    key: keyof MacroGoals,
    label: string,
    unit: string,
    icon: string
  ) => (
    <TextInput
      label={`${label} (${unit})`}
      value={goals[key]?.toString() || ''}
      onChangeText={(text) => {
        const value = parseFloat(text) || 0;
        updateGoal(key, value);
      }}
      keyboardType="decimal-pad"
      error={!!errors[key]}
      style={styles.input}
      left={<TextInput.Icon icon={icon} />}
      right={<TextInput.Affix text={unit} />}
    />
  );

  const renderCalorieBreakdown = () => {
    const proteinCalories = goals.protein * 4;
    const carbCalories = goals.carbs * 4;
    const fatCalories = goals.fats * 9;
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

    const proteinPercent = totalMacroCalories > 0 ? (proteinCalories / totalMacroCalories) * 100 : 0;
    const carbPercent = totalMacroCalories > 0 ? (carbCalories / totalMacroCalories) * 100 : 0;
    const fatPercent = totalMacroCalories > 0 ? (fatCalories / totalMacroCalories) * 100 : 0;

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Calorie Breakdown
          </Text>

          <View style={styles.breakdownContainer}>
            <Surface style={[styles.breakdownItem, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Text variant="headlineSmall" style={{ color: theme.colors.protein }}>
                {proteinPercent.toFixed(0)}%
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Protein
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {proteinCalories} cal
              </Text>
            </Surface>

            <Surface style={[styles.breakdownItem, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Text variant="headlineSmall" style={{ color: theme.colors.carbs }}>
                {carbPercent.toFixed(0)}%
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Carbs
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {carbCalories} cal
              </Text>
            </Surface>

            <Surface style={[styles.breakdownItem, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
              <Text variant="headlineSmall" style={{ color: theme.colors.fats }}>
                {fatPercent.toFixed(0)}%
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Fats
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {fatCalories} cal
              </Text>
            </Surface>
          </View>

          <View style={styles.totalCaloriesContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Total from macros: {totalMacroCalories} calories
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Target calories: {goals.calories} calories
            </Text>
            {Math.abs(totalMacroCalories - goals.calories) > goals.calories * 0.05 && (
              <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                Macro calories don't match target ({Math.abs(totalMacroCalories - goals.calories).toFixed(0)} cal difference)
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <AuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Nutrition Goals
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Set your daily macro targets
          </Text>
        </View>

        {calculatedMetrics.tdee > 0 && (
          <Card style={[styles.recommendedCard, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
            <Card.Content style={styles.recommendedContent}>
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                Recommended for you
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                Based on your profile: {calculatedMetrics.recommendedCalories} calories
              </Text>
              <Button
                mode="text"
                onPress={handleUseRecommended}
                style={styles.recommendedButton}
                textColor={theme.colors.onPrimaryContainer}
              >
                Use Recommended
              </Button>
            </Card.Content>
          </Card>
        )}

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Primary Macros
            </Text>

            {renderMacroInput('calories', 'Calories', 'cal', 'fire')}
            <HelperText type="error" visible={!!errors.calories}>
              {errors.calories}
            </HelperText>

            {renderMacroInput('protein', 'Protein', 'g', 'dumbbell')}
            <HelperText type="error" visible={!!errors.protein}>
              {errors.protein}
            </HelperText>

            {renderMacroInput('carbs', 'Carbohydrates', 'g', 'bread-slice')}
            <HelperText type="error" visible={!!errors.carbs}>
              {errors.carbs}
            </HelperText>

            {renderMacroInput('fats', 'Fats', 'g', 'butter')}
            <HelperText type="error" visible={!!errors.fats}>
              {errors.fats}
            </HelperText>

            {errors.distribution && (
              <HelperText type="error" visible={!!errors.distribution}>
                {errors.distribution}
              </HelperText>
            )}
          </Card.Content>
        </Card>

        {renderCalorieBreakdown()}


        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleReset}
            style={[styles.button, styles.resetButton]}
            disabled={isSaving}
          >
            Reset
          </Button>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={[styles.button, styles.saveButton]}
          >
            {isSaving ? 'Saving...' : 'Save Goals'}
          </Button>
        </View>
      </ScrollView>
      </View>
    </AuthGuard>
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
  recommendedCard: {
    marginBottom: 16,
  },
  recommendedContent: {
    alignItems: 'center',
  },
  recommendedButton: {
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  breakdownContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  breakdownItem: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalCaloriesContainer: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  resetButton: {
    marginRight: 0,
  },
  saveButton: {
    marginLeft: 0,
  },
});

export default GoalSettingScreen;