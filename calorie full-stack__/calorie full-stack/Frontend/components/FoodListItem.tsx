import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { 
  List, 
  Text, 
  IconButton, 
  useTheme,
  Menu,
  Surface,
  Chip,
} from 'react-native-paper';
import { Food, FoodEntry } from '../types/nutrition';

interface FoodListItemProps {
  food?: Food;
  foodEntry?: FoodEntry;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: (foodId: string) => void;
  isFavorite?: boolean;
  showNutrition?: boolean;
  showServingInfo?: boolean;
  showActions?: boolean;
  style?: any;
}

export const FoodListItem: React.FC<FoodListItemProps> = ({
  food,
  foodEntry,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite = false,
  showNutrition = true,
  showServingInfo = true,
  showActions = true,
  style,
}) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const item = foodEntry || food;
  const displayFood = foodEntry?.food || food;
  
  if (!item || !displayFood) return null;

  const calculateDisplayNutrition = () => {
    if (foodEntry) {
      const multiplier = (foodEntry.quantity * foodEntry.servingSize) / displayFood.servingSize;
      return {
        calories: Math.round(displayFood.calories * multiplier),
        protein: Math.round(displayFood.protein * multiplier * 10) / 10,
        carbs: Math.round(displayFood.carbs * multiplier * 10) / 10,
        fats: Math.round(displayFood.fats * multiplier * 10) / 10,
      };
    }
    return {
      calories: displayFood.calories,
      protein: displayFood.protein,
      carbs: displayFood.carbs,
      fats: displayFood.fats,
    };
  };

  const nutrition = calculateDisplayNutrition();

  const getServingText = () => {
    if (foodEntry) {
      return `${foodEntry.quantity} x ${foodEntry.servingSize}${displayFood.servingSizeUnit}`;
    }
    return `per ${displayFood.servingSize}${displayFood.servingSizeUnit}`;
  };

  const getNutritionText = () => {
    if (!showNutrition) return '';
    return `${nutrition.calories} cal • ${nutrition.protein}g protein • ${nutrition.carbs}g carbs • ${nutrition.fats}g fats`;
  };

  const getDescriptionText = () => {
    const parts = [];
    
    if (showServingInfo) {
      parts.push(getServingText());
    }
    
    if (showNutrition) {
      parts.push(getNutritionText());
    }
    
    if (displayFood.brand) {
      parts.push(displayFood.brand);
    }
    
    return parts.filter(Boolean).join(' • ');
  };

  const handleMenuAction = (action: 'edit' | 'delete' | 'favorite') => {
    setMenuVisible(false);
    
    switch (action) {
      case 'edit':
        onEdit?.();
        break;
      case 'delete':
        Alert.alert(
          'Delete Food',
          'Are you sure you want to delete this food entry?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: onDelete 
            }
          ]
        );
        break;
      case 'favorite':
        onToggleFavorite?.(displayFood.id);
        break;
    }
  };

  const renderLeftIcon = (props: any) => (
    <View style={styles.leftIconContainer}>
      <List.Icon 
        {...props} 
        icon={displayFood.isVerified ? 'check-circle' : 'account-circle'} 
        color={displayFood.isVerified ? theme.colors.primary : theme.colors.outline}
      />
      {foodEntry && (
        <Surface style={[styles.mealTypeChip, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
          <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
            {foodEntry.mealType.charAt(0).toUpperCase() + foodEntry.mealType.slice(1)}
          </Text>
        </Surface>
      )}
    </View>
  );

  const renderRightContent = (props: any) => {
    if (!showActions) {
      return (
        <View style={styles.rightContent}>
          <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
            {nutrition.calories}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            cal
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.rightContent}>
        <View style={styles.calorieInfo}>
          <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
            {nutrition.calories}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            cal
          </Text>
        </View>
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              iconColor={theme.colors.onSurfaceVariant}
              size={20}
            />
          }
        >
          {onEdit && (
            <Menu.Item 
              onPress={() => handleMenuAction('edit')}
              title="Edit" 
              leadingIcon="pencil"
            />
          )}
          
          {onToggleFavorite && (
            <Menu.Item
              onPress={() => handleMenuAction('favorite')}
              title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              leadingIcon={isFavorite ? 'heart-off' : 'heart'}
            />
          )}
          
          {onDelete && (
            <Menu.Item
              onPress={() => handleMenuAction('delete')}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: theme.colors.error }}
            />
          )}
        </Menu>
      </View>
    );
  };

  return (
    <List.Item
      title={displayFood.name}
      description={getDescriptionText()}
      descriptionNumberOfLines={2}
      left={renderLeftIcon}
      right={renderRightContent}
      onPress={onPress}
      style={[styles.listItem, style]}
      titleStyle={styles.title}
      descriptionStyle={styles.description}
    />
  );
};

interface FoodListProps {
  foods?: Food[];
  foodEntries?: FoodEntry[];
  onFoodPress?: (food: Food) => void;
  onEntryPress?: (entry: FoodEntry) => void;
  onEntryEdit?: (entry: FoodEntry) => void;
  onEntryDelete?: (entryId: string) => void;
  onToggleFavorite?: (foodId: string) => void;
  favoriteIds?: string[];
  emptyMessage?: string;
  style?: any;
}

export const FoodList: React.FC<FoodListProps> = ({
  foods,
  foodEntries,
  onFoodPress,
  onEntryPress,
  onEntryEdit,
  onEntryDelete,
  onToggleFavorite,
  favoriteIds = [],
  emptyMessage = 'No foods found',
  style,
}) => {
  const theme = useTheme();

  const items = foodEntries || foods || [];
  
  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {items.map((item, index) => (
        <FoodListItem
          key={foodEntries ? (item as FoodEntry).id : (item as Food).id}
          food={foods ? item as Food : undefined}
          foodEntry={foodEntries ? item as FoodEntry : undefined}
          onPress={() => {
            if (foodEntries && onEntryPress) {
              onEntryPress(item as FoodEntry);
            } else if (foods && onFoodPress) {
              onFoodPress(item as Food);
            }
          }}
          onEdit={foodEntries && onEntryEdit ? () => onEntryEdit(item as FoodEntry) : undefined}
          onDelete={foodEntries && onEntryDelete ? () => onEntryDelete((item as FoodEntry).id) : undefined}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favoriteIds.includes(
            foodEntries ? (item as FoodEntry).food.id : (item as Food).id
          )}
          showActions={!!foodEntries}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 18,
  },
  leftIconContainer: {
    alignItems: 'center',
    gap: 4,
  },
  mealTypeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calorieInfo: {
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FoodListItem;