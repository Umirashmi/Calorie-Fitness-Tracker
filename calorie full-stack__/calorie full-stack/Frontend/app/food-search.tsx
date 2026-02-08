import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
  Text,
  Card,
  TextInput,
  Button,
  SegmentedButtons,
  Divider,
  useTheme,
  Surface,
  IconButton,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useNutrition } from "../hooks/useNutrition";
import { nutritionService } from "../services/nutrition";
import { ApisClient } from "../services/api";
import { Food, MealType } from "../types/nutrition";
import { AuthGuard } from "../components/AuthGuard";

const FoodSearchScreen: React.FC = () => {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const { logFood, addToRecentFoods } = useNutrition();

  const [food, setFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [servingSize, setServingSize] = useState("100");
  const [mealType, setMealType] = useState<MealType>(
    (params.mealType as MealType) || "breakfast"
  );
  const [date, setDate] = useState(
    (params.date as string) || new Date().toISOString().split("T")[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (params.foodId) {
      loadFoodDetails(params.foodId as string);
    }
  }, [params.foodId]);

  const loadFoodDetails = async (foodId: string) => {
    setIsLoading(true);
    try {
      const response = await nutritionService.getFoodById(foodId);
      if (response.success) {
        const foodData = response.data;
        // Normalize food data for Backend compatibility
        const normalizedFood = {
          ...foodData,
          calories: foodData.calories_per_100g || foodData.calories || 0,
          protein: foodData.protein_per_100g || foodData.protein || 0,
          carbs: foodData.carbs_per_100g || foodData.carbs || 0,
          fats: foodData.fats_per_100g || foodData.fats || 0,
          servingSize: foodData.serving_size || foodData.servingSize || 100,
          servingSizeUnit:
            foodData.serving_unit || foodData.servingSizeUnit || "g",
        };
        setFood(normalizedFood);
        setServingSize(normalizedFood.servingSize.toString());
      } else {
        Alert.alert("Error", "Failed to load food details.");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load food details.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const calculateNutrition = () => {
    if (!food) return null;

    const quantityNum = parseFloat(quantity) || 0;
    const servingSizeNum = parseFloat(servingSize) || 100;
    const totalPortionSize = quantityNum * servingSizeNum;
    const multiplier = totalPortionSize / 100; // Since backend uses per 100g values

    return {
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein * multiplier * 10) / 10,
      carbs: Math.round(food.carbs * multiplier * 10) / 10,
      fats: Math.round(food.fats * multiplier * 10) / 10,
      fiber: food.fiber
        ? Math.round(food.fiber * multiplier * 10) / 10
        : undefined,
      sugar: food.sugar
        ? Math.round(food.sugar * multiplier * 10) / 10
        : undefined,
      sodium: food.sodium ? Math.round(food.sodium * multiplier) : undefined,
    };
  };

  const handleLogFood = async () => {
    if (!food) return;

    const quantityNum = parseFloat(quantity);
    const portionSize = parseFloat(servingSize) * quantityNum;

    if (!quantityNum || quantityNum <= 0) {
      Alert.alert("Error", "Please enter a valid quantity.");
      return;
    }

    if (!portionSize || portionSize <= 0) {
      Alert.alert("Error", "Please enter a valid serving size.");
      return;
    }

    setIsSaving(true);
    try {
      const logData = {
        food_id: food.id,
        portion_size: portionSize,
        quantity: quantityNum,
        meal_type: mealType,
        logged_date: date,
      };

      const response = await ApisClient.logFood(logData);

      if (response.success) {
        await addToRecentFoods(food);
        Alert.alert("Success", "Food logged successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(
          "Error",
          response.error || "Failed to log food. Please try again."
        );
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
      console.error("Log food error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const mealTypeOptions = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ];

  if (isLoading || !food) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text variant="bodyLarge">Loading food details...</Text>
      </View>
    );
  }

  const nutrition = calculateNutrition();

  return (
    <AuthGuard>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.content}>
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            elevation={2}
          >
            <Card.Content>
              <View style={styles.foodHeader}>
                <View style={styles.foodInfo}>
                  <Text variant="headlineSmall" style={styles.foodName}>
                    {food.name}
                  </Text>
                  {food.brand && (
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {food.brand}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.baseNutrition}>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Per {food.servingSize}
                  {food.servingSizeUnit}:
                </Text>
                <Text variant="bodyMedium">
                  {food.calories.toFixed(2)} cal • {food.protein.toFixed(2)}g
                  protein • {food.carbs.toFixed(2)}g carbs •{" "}
                  {food.fats.toFixed(2)}g fats
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            elevation={2}
          >
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Quantity & Serving
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  label="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.halfInput]}
                  left={<TextInput.Icon icon="numeric" />}
                />

                <TextInput
                  label={`Serving Size (${food.servingSizeUnit})`}
                  value={servingSize}
                  onChangeText={setServingSize}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.halfInput]}
                  left={<TextInput.Icon icon="scale-balance" />}
                />
              </View>

              <View style={styles.quickServings}>
                <Text variant="bodySmall" style={styles.quickServingsLabel}>
                  Quick amounts:
                </Text>
                <View style={styles.quickButtons}>
                  {[0.5, 1, 1.5, 2].map((amount) => (
                    <Button
                      key={amount}
                      mode="outlined"
                      compact
                      onPress={() => setQuantity(amount.toString())}
                      style={styles.quickButton}
                    >
                      {amount}x
                    </Button>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            elevation={2}
          >
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Add to Meal
              </Text>

              <SegmentedButtons
                value={mealType}
                onValueChange={(value) => setMealType(value as MealType)}
                buttons={mealTypeOptions}
                style={styles.segmentedButtons}
              />
            </Card.Content>
          </Card>

          {nutrition && (
            <Card
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              elevation={2}
            >
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  Total Nutrition
                </Text>

                <View style={styles.nutritionGrid}>
                  <Surface
                    style={[
                      styles.nutritionItem,
                      { backgroundColor: theme.colors.calories + "20" },
                    ]}
                    elevation={1}
                  >
                    <Text
                      variant="headlineSmall"
                    >
                      {nutrition.calories}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Calories
                    </Text>
                  </Surface>

                  <Surface
                    style={[
                      styles.nutritionItem,
                      { backgroundColor: theme.colors.protein + "20" },
                    ]}
                    elevation={1}
                  >
                    <Text
                      variant="headlineSmall"
                    >
                      {nutrition.protein}g
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Protein
                    </Text>
                  </Surface>

                  <Surface
                    style={[
                      styles.nutritionItem,
                      { backgroundColor: theme.colors.carbs + "20" },
                    ]}
                    elevation={1}
                  >
                    <Text
                      variant="headlineSmall"
                    >
                      {nutrition.carbs}g
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Carbs
                    </Text>
                  </Surface>

                  <Surface
                    style={[
                      styles.nutritionItem,
                      { backgroundColor: theme.colors.fats + "20" },
                    ]}
                    elevation={1}
                  >
                    <Text
                      variant="headlineSmall"
                    >
                      {nutrition.fats}g
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Fats
                    </Text>
                  </Surface>
                </View>

                {(nutrition.fiber || nutrition.sugar || nutrition.sodium) && (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.additionalNutrients}>
                      {nutrition.fiber && (
                        <Text variant="bodyMedium">
                          Fiber: {nutrition.fiber}g
                        </Text>
                      )}
                      {nutrition.sugar && (
                        <Text variant="bodyMedium">
                          Sugar: {nutrition.sugar}g
                        </Text>
                      )}
                      {nutrition.sodium && (
                        <Text variant="bodyMedium">
                          Sodium: {nutrition.sodium}mg
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={[styles.actionButton, styles.cancelButton]}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            mode="contained"
            onPress={handleLogFood}
            loading={isSaving}
            disabled={isSaving}
            style={[styles.actionButton, styles.logButton]}
          >
            {isSaving ? "Logging..." : "Log Food"}
          </Button>
        </View>
      </View>
    </AuthGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 62,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  foodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  baseNutrition: {
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  input: {
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  quickServings: {
    marginTop: 8,
  },
  quickServingsLabel: {
    marginBottom: 8,
  },
  quickButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quickButton: {
    minWidth: 60,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  nutritionItem: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  divider: {
    marginVertical: 12,
  },
  additionalNutrients: {
    gap: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  cancelButton: {
    marginRight: 0,
  },
  logButton: {
    marginLeft: 0,
  },
});

export default FoodSearchScreen;
