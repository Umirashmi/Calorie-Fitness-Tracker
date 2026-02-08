import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Searchbar,
  Chip,
  Button,
  List,
  ActivityIndicator,
  useTheme,
  Surface,
  Divider,
  FAB,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useNutrition } from "../../hooks/useNutrition";
import { useFreshData } from "../../hooks/useFreshData";
import { nutritionService } from "../../services/nutrition";
import { ApisClient } from "../../services/api";
import { Food, MealType, FoodEntry } from "../../types/nutrition";

const LogFoodScreen: React.FC = () => {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const {
    recentFoods,
    favoriteFoods,
    currentDate,
    isToday,
    addToRecentFoods,
  } = useNutrition();

  const { loadLogFoodData, isReady } = useFreshData();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loggedFoods, setLoggedFoods] = useState<FoodEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Valid meal types
  const validMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

  useEffect(() => {
    // Set meal type from URL parameter if valid
    const mealTypeFromUrl = params.mealType as string;
    if (mealTypeFromUrl && validMealTypes.includes(mealTypeFromUrl as MealType)) {
      setSelectedMealType(mealTypeFromUrl as MealType);
    }
    
    // Load fresh data on every page visit when authenticated
    if (isReady) {
      loadLogFoodData();
    }
  }, [params.mealType, isReady, loadLogFoodData]);

  useEffect(() => {
    loadLoggedFoods();
  }, [selectedMealType, currentDate]);

  const loadLoggedFoods = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await ApisClient.getDailyLogsByMealType(currentDate, selectedMealType);
      if (response.success && response.data) {
        setLoggedFoods(response.data.entries || []);
      } else {
        setLoggedFoods([]);
      }
    } catch (error) {
      console.error("Failed to load logged foods:", error);
      setLoggedFoods([]);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadLogFoodData(),
        loadLoggedFoods()
      ]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const searchFoods = async (query: string) => {
    if (query.trim()?.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response: any = await nutritionService.searchFoods(query.trim());
      if (response.success) {
        setSearchResults(response.data.foods || response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchFoods(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleFoodSelect = (food: Food) => {
    addToRecentFoods(food);
    router.push({
      pathname: "/food-search",
      params: {
        foodId: food.id,
        mealType: selectedMealType,
        date: currentDate,
      },
    });
  };

  const handleCreateCustomFood = () => {
    router.push("/create-food");
  };

  const handleDeleteLogEntry = async (logId: string) => {
    Alert.alert(
      "Delete Food Entry",
      "Are you sure you want to delete this food entry?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await ApisClient.deleteFoodLog(logId);
              if (response.success) {
                setLoggedFoods(loggedFoods.filter(entry => entry.id !== logId));
              } else {
                Alert.alert("Error", "Failed to delete food entry");
              }
            } catch (error) {
              console.error("Delete failed:", error);
              Alert.alert("Error", "Failed to delete food entry");
            }
          },
        },
      ]
    );
  };

  const mealTypeOptions: { value: MealType; label: string; icon: string }[] = [
    { value: "breakfast", label: "Breakfast", icon: "coffee-outline" },
    { value: "lunch", label: "Lunch", icon: "hamburger" },
    { value: "dinner", label: "Dinner", icon: "food-variant" },
    { value: "snack", label: "Snack", icon: "cookie-outline" },
  ];

  const handleMealTypeChange = (mealType: MealType) => {
    setSelectedMealType(mealType);
    // Update URL to reflect the selected meal type
    router.replace({
      pathname: '/log-food',
      params: { mealType }
    });
  };

  const renderMealTypeSelector = () => (
    <Surface
      style={[styles.mealSelector, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <Text variant="labelLarge" style={styles.selectorTitle}>
        Add to:
      </Text>
      <View style={styles.chipContainer}>
        {mealTypeOptions.map((option) => (
          <Chip
            key={option.value}
            mode={selectedMealType === option.value ? "flat" : "outlined"}
            selected={selectedMealType === option.value}
            onPress={() => handleMealTypeChange(option.value)}
            icon={option.icon}
            style={styles.mealChip}
          >
            {option.label}
          </Chip>
        ))}
      </View>
    </Surface>
  );

  const renderFoodItem = ({ item: food }: { item: any }) => (
    <List.Item
      title={food.name}
      description={`${food.calories_per_100g.toFixed(2) || food.calories.toFixed(2) || 0} cal • ${
        food.protein_per_100g.toFixed(2) || food.protein.toFixed(2) || 0
      }g protein `}
      right={(props) => (
        <View style={styles.foodItemRight}>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            per {food.serving_size || food.servingSize || 100}
            {food.serving_unit || food.servingSizeUnit || "g"}
          </Text>
        </View>
      )}
      onPress={() => handleFoodSelect(food)}
      style={styles.foodItem}
    />
  );

  const renderSearchResults = () => {
    if (!showSearchResults) return null;

    return (
      <Card
        style={[
          styles.searchResultsCard,
          { backgroundColor: theme.colors.surface },
        ]}
        elevation={2}
      >
        <Card.Content style={styles.searchResultsContent}>
          <Text variant="titleSmall" style={styles.searchResultsTitle}>
            Search Results
          </Text>

          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Searching...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.noResultsContainer}>
                {searchResults?.length === 0 && (
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    No foods found for "{searchQuery}"
                  </Text>
                )}
                <Button
                  mode="outlined"
                  onPress={handleCreateCustomFood}
                  style={styles.createFoodButton}
                  icon="plus"
                >
                  Create Custom Food
                </Button>
              </View>
              <FlatList
                data={searchResults}
                renderItem={renderFoodItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                maxToRenderPerBatch={10}
                windowSize={10}
                ItemSeparatorComponent={() => <Divider />}
              />
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderRecentFoods = () => {
    if (recentFoods?.length === 0) return null;

    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Recent Foods
          </Text>
          <FlatList
            data={recentFoods.slice(0, 5)}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            scrollEnabled={false}
          />
          {recentFoods?.length > 5 && (
            <Button
              mode="text"
              onPress={() => router.push("/food-search")}
              style={styles.viewAllButton}
            >
              View All Recent
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderFavoriteFoods = () => {
    if (favoriteFoods?.length === 0) return null;

    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Favorite Foods
          </Text>
          <FlatList
            data={favoriteFoods.slice(0, 5)}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider />}
            scrollEnabled={false}
          />
          {favoriteFoods?.length > 5 && (
            <Button
              mode="text"
              onPress={() => router.push("/food-search")}
              style={styles.viewAllButton}
            >
              View All Favorites
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderLoggedFoodEntry = ({ item: entry }: { item: FoodEntry }) => {
    // Correct calculation: food values are per 100g, servingSize is actual consumption in grams
    const totalCalories = (entry.food.calories * entry.servingSize) / 100;
    const totalProtein = (entry.food.protein * entry.servingSize) / 100;
    const totalCarbs = (entry.food.carbs * entry.servingSize) / 100;
    const totalFats = (entry.food.fats * entry.servingSize) / 100;
    
    return (
      <List.Item
        title={entry.food.name}
        description={`${totalCalories.toFixed(0)} cal • ${totalProtein.toFixed(1)}g protein • ${totalCarbs.toFixed(1)}g carbs • ${totalFats.toFixed(1)}g fats • ${entry.servingSize}g portion`}
        right={(props) => (
          <View style={styles.logEntryRight}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
            >
              {new Date(entry.loggedAt).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => handleDeleteLogEntry(entry.id)}
              textColor={theme.colors.error}
              style={styles.deleteButton}
            >
              Delete
            </Button>
          </View>
        )}
        style={styles.logEntry}
      />
    );
  };

  const renderFoodLog = () => {
    const mealLabel = selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1);
    
    return (
      <Card
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {mealLabel} Log
          </Text>
          
          {isLoadingLogs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Loading entries...
              </Text>
            </View>
          ) : loggedFoods.length > 0 ? (
            <FlatList
              data={loggedFoods}
              renderItem={renderLoggedFoodEntry}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <Divider />}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyLogContainer}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                No foods logged for {mealLabel.toLowerCase()} yet.
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <Card
      style={[
        styles.emptyCard,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
      elevation={1}
    >
      <Card.Content style={styles.emptyContent}>
        <List.Icon
          icon="food-apple-outline"
          // size={48}
          color={theme.colors.outline}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Start Logging Food
        </Text>
        <Text
          variant="bodyMedium"
          style={[
            styles.emptyDescription,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          Search for foods above or browse your recent and favorite items
        </Text>
        <Button
          mode="contained"
          onPress={handleCreateCustomFood}
          style={styles.createFoodButton}
          icon="plus"
        >
          Create Custom Food
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
      <Surface
        style={[styles.searchHeader, { backgroundColor: theme.colors.surface }]}
        elevation={1}
      >
        <Searchbar
          placeholder="Search foods..."
          onChangeText={handleSearchChange}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          icon="magnify"
          clearIcon="close"
        />
      </Surface>

      {renderMealTypeSelector()}

      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={[1]}
        renderItem={() => (
          <View>
            {showSearchResults && renderSearchResults()}

            {!showSearchResults && (
              <>
                {renderFoodLog()}
                {recentFoods?.length === 0 && favoriteFoods?.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <>
                    {renderFavoriteFoods()}
                    {renderRecentFoods()}
                  </>
                )}
              </>
            )}
          </View>
        )}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
        <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/create-food')}
        label={isToday ? "" : undefined}
      />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 20,
  },
  searchHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  searchbar: {
    elevation: 0,
  },
  searchInput: {
    fontSize: 16,
  },
  mealSelector: {
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  selectorTitle: {
    marginBottom: 8,
    fontWeight: "500",
  },
  chipContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  mealChip: {
    marginRight: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  searchResultsCard: {
    marginBottom: 16,
  },
  searchResultsContent: {
    padding: 16,
  },
  searchResultsTitle: {
    marginBottom: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginLeft: 12,
  },
  noResultsContainer: {
    alignItems: "center",
    padding: 24,
  },
  resultsList: {
    maxHeight: 300,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  foodItem: {
    paddingVertical: 8,
  },
  foodItemRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  viewAllButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  createFoodButton: {
    marginTop: 12,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyContent: {
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyDescription: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 16,
  },
  logEntry: {
    paddingVertical: 12,
  },
  logEntryRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 80,
  },
  deleteButton: {
    marginTop: 2,
    paddingHorizontal: 8,
  },
  emptyLogContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },
});

export default LogFoodScreen;
