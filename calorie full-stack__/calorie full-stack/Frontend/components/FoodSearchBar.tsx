import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { 
  Searchbar, 
  List, 
  Text, 
  Surface, 
  ActivityIndicator,
  useTheme,
  Button,
} from 'react-native-paper';
import { Food } from '../types/nutrition';
import { nutritionService } from '../services/nutrition';

interface FoodSearchBarProps {
  placeholder?: string;
  onFoodSelect: (food: Food) => void;
  onCreateCustomFood?: () => void;
  autoFocus?: boolean;
  style?: any;
}

export const FoodSearchBar: React.FC<FoodSearchBarProps> = ({
  placeholder = 'Search foods...',
  onFoodSelect,
  onCreateCustomFood,
  autoFocus = false,
  style,
}) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const response = await nutritionService.searchFoods(searchQuery.trim());
      if (response.success) {
        setResults(response.data.foods);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      performSearch(text);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleFoodSelect = (food: Food) => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onFoodSelect(food);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  const renderFoodItem = ({ item: food }: { item: Food }) => (
    <List.Item
      title={food.name}
      description={`${food.calories} cal • ${food.protein}g protein`}
      left={(props) => (
        <List.Icon 
          {...props} 
          icon={food.isVerified ? 'check-circle' : 'account-circle'} 
          color={food.isVerified ? theme.colors.primary : theme.colors.outline}
        />
      )}
      right={(props) => (
        <View style={styles.foodItemRight}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            per {food.servingSize}{food.servingSizeUnit}
          </Text>
          {food.brand && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {food.brand}
            </Text>
          )}
        </View>
      )}
      onPress={() => handleFoodSelect(food)}
      style={styles.foodItem}
    />
  );

  const renderSearchResults = () => {
    if (!showResults) return null;

    return (
      <Surface 
        style={[styles.resultsContainer, { backgroundColor: theme.colors.surface }]} 
        elevation={4}
      >
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
            <Text variant="bodyMedium" style={styles.loadingText}>
              Searching...
            </Text>
          </View>
        ) : (
          <>
            {results.length === 0 ? (
              <View style={styles.noResultsContainer}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  No foods found for "{query}"
                </Text>
                {onCreateCustomFood && (
                  <Button
                    mode="outlined"
                    onPress={() => {
                      handleClear();
                      onCreateCustomFood();
                    }}
                    style={styles.createButton}
                    icon="plus"
                  >
                    Create Custom Food
                  </Button>
                )}
              </View>
            ) : (
              <FlatList
                data={results}
                renderItem={renderFoodItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                maxToRenderPerBatch={10}
                windowSize={10}
              />
            )}
          </>
        )}
      </Surface>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Searchbar
        placeholder={placeholder}
        onChangeText={handleSearchChange}
        value={query}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        icon="magnify"
        clearIcon="close"
        onClearIconPress={handleClear}
        autoFocus={autoFocus}
      />
      {renderSearchResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchbar: {
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1001,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginLeft: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  createButton: {
    marginTop: 12,
  },
  resultsList: {
    flexGrow: 0,
  },
  foodItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  foodItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default FoodSearchBar;