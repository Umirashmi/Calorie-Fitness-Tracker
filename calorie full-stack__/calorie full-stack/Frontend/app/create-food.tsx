import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  HelperText,
  Menu,
  TouchableRipple,
  Divider,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { ApisClient } from '../services/api';

interface CustomFoodData {
  name: string;
  servingSize: string;
  servingSizeUnit: string;
  calories: string;
  protein: string;
  carbs: string;
  fats: string;
}

const UNITS = [
  { label: 'Gram (g)', value: 'g' },
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Ounce (oz)', value: 'oz' },
  { label: 'Pound (lb)', value: 'lb' },
  { label: 'Cup', value: 'cup' },
  { label: 'Tablespoon (tbsp)', value: 'tbsp' },
  { label: 'Teaspoon (tsp)', value: 'tsp' },
  { label: 'Milliliter (ml)', value: 'ml' },
  { label: 'Liter (L)', value: 'L' },
  { label: 'Piece (pcs)', value: 'pcs' },
  { label: 'Slice', value: 'slice' },
];

interface FormErrors {
  name?: string;
  servingSize?: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fats?: string;
}

export default function CreateFoodScreen() {
  // const { token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomFoodData>({
    name: '',
    servingSize: '100',
    servingSizeUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Food name is required';
    }

    if (!formData.servingSize || parseFloat(formData.servingSize) <= 0) {
      newErrors.servingSize = 'Valid serving size is required';
    }

    if (!formData.calories || parseFloat(formData.calories) < 0) {
      newErrors.calories = 'Valid calories value is required';
    }

    if (!formData.protein || parseFloat(formData.protein) < 0) {
      newErrors.protein = 'Valid protein value is required';
    }

    if (!formData.carbs || parseFloat(formData.carbs) < 0) {
      newErrors.carbs = 'Valid carbs value is required';
    }

    if (!formData.fats || parseFloat(formData.fats) < 0) {
      newErrors.fats = 'Valid fats value is required';
    }

    // Basic validation for reasonable values
    const calories = parseFloat(formData.calories || '0');
    const protein = parseFloat(formData.protein || '0');
    const carbs = parseFloat(formData.carbs || '0');
    const fats = parseFloat(formData.fats || '0');
    
    if (calories > 2000) {
      newErrors.calories = 'Calories seem high for a single serving';
    }
    
    if (protein > 100) {
      newErrors.protein = 'Protein value seems high';
    }
    
    if (carbs > 200) {
      newErrors.carbs = 'Carbs value seems high';
    }
    
    if (fats > 100) {
      newErrors.fats = 'Fats value seems high';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertToGrams = (value: number, unit: string): number => {
    switch (unit) {
      case 'kg': return value * 1000;
      case 'oz': return value * 28.35;
      case 'lb': return value * 453.59;
      case 'cup': return value * 240; // approximate for liquids
      case 'tbsp': return value * 15;
      case 'tsp': return value * 5;
      case 'ml': return value; // approximate 1:1 for liquids
      case 'L': return value * 1000;
      case 'pcs': case 'slice': return value * 30; // approximate
      default: return value; // grams
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors in the form.');
      return;
    }

    setLoading(true);

    try {
      // Convert to per 100g values based on serving size and unit
      const servingGrams = convertToGrams(parseFloat(formData.servingSize), formData.servingSizeUnit);
      const conversionFactor = 100 / servingGrams;
      
      const foodData = {
        name: formData.name.trim(),
        calories_per_100g: parseFloat(formData.calories) * conversionFactor,
        protein_per_100g: parseFloat(formData.protein) * conversionFactor,
        carbs_per_100g: parseFloat(formData.carbs) * conversionFactor,
        fats_per_100g: parseFloat(formData.fats) * conversionFactor,
        serving_size: parseFloat(formData.servingSize),
        serving_unit: formData.servingSizeUnit,
      };

      // // const ApisClient = new ApisClient();
      const response = await ApisClient.createFood(foodData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create custom food');
      }

      Alert.alert(
        'Success',
        'Custom food created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create custom food'
      );
    } finally {
      setLoading(false);
      router.back();
    }
  };

  const calculateMacroCalories = () => {
    const protein = parseFloat(formData.protein || '0');
    const carbs = parseFloat(formData.carbs || '0');
    const fats = parseFloat(formData.fats || '0');
    return Math.round(protein * 4 + carbs * 4 + fats * 9);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, margin: 20 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Basic Information */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Title>Basic Information</Title>
              
              <TextInput
                label="Food Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                error={!!errors.name}
                style={{ marginBottom: 8 }}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput
                  label="Serving Size *"
                  value={formData.servingSize}
                  onChangeText={(text) => setFormData({ ...formData, servingSize: text })}
                  keyboardType="numeric"
                  error={!!errors.servingSize}
                  style={{ flex: 1 }}
                  disabled={loading}
                />
                <View style={{ flex: 1 }}>
                  <Menu
                    visible={unitMenuVisible}
                    onDismiss={() => setUnitMenuVisible(false)}
                    anchor={
                      <TouchableRipple
                        onPress={() => setUnitMenuVisible(true)}
                        disabled={loading}
                      >
                        <TextInput
                          label="Unit"
                          value={UNITS.find(u => u.value === formData.servingSizeUnit)?.label || formData.servingSizeUnit}
                          editable={false}
                          right={<TextInput.Icon icon="chevron-down" />}
                          disabled={loading}
                        />
                      </TouchableRipple>
                    }
                  >
                    {UNITS.map((unit) => (
                      <Menu.Item
                        key={unit.value}
                        title={unit.label}
                        onPress={() => {
                          setFormData({ ...formData, servingSizeUnit: unit.value });
                          setUnitMenuVisible(false);
                        }}
                      />
                    ))}
                  </Menu>
                </View>
              </View>
              <HelperText type="error" visible={!!errors.servingSize}>
                {errors.servingSize}
              </HelperText>
            </Card.Content>
          </Card>

          {/* Macronutrients */}
          <Card style={{ marginBottom: 16 }}>
            <Card.Content>
              <Title>Macronutrients (per serving)</Title>
              
              <TextInput
                label="Calories *"
                value={formData.calories}
                onChangeText={(text) => setFormData({ ...formData, calories: text })}
                keyboardType="numeric"
                error={!!errors.calories}
                style={{ marginBottom: 8 }}
                disabled={loading}
                right={
                  <TextInput.Affix text={`≈${calculateMacroCalories()} cal`} />
                }
              />
              <HelperText type="error" visible={!!errors.calories}>
                {errors.calories}
              </HelperText>

              <TextInput
                label="Protein (g) *"
                value={formData.protein}
                onChangeText={(text) => setFormData({ ...formData, protein: text })}
                keyboardType="numeric"
                error={!!errors.protein}
                style={{ marginBottom: 8 }}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.protein}>
                {errors.protein}
              </HelperText>

              <TextInput
                label="Carbohydrates (g) *"
                value={formData.carbs}
                onChangeText={(text) => setFormData({ ...formData, carbs: text })}
                keyboardType="numeric"
                error={!!errors.carbs}
                style={{ marginBottom: 8 }}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.carbs}>
                {errors.carbs}
              </HelperText>

              <TextInput
                label="Fats (g) *"
                value={formData.fats}
                onChangeText={(text) => setFormData({ ...formData, fats: text })}
                keyboardType="numeric"
                error={!!errors.fats}
                style={{ marginBottom: 8 }}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.fats}>
                {errors.fats}
              </HelperText>
            </Card.Content>
          </Card>

          {/* Preview */}
          <Card style={{ marginBottom: 32 }}>
            <Card.Content>
              <Title>Preview</Title>
              <ThemedText>
                {formData.name || 'Food Name'}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Per {formData.servingSize || '100'} {UNITS.find(u => u.value === formData.servingSizeUnit)?.label || formData.servingSizeUnit}
              </ThemedText>
              
              <View style={{ marginTop: 12, gap: 4 }}>
                <ThemedText>🔥 {formData.calories || '0'} calories</ThemedText>
                <ThemedText>💪 {formData.protein || '0'}g protein</ThemedText>
                <ThemedText>🍞 {formData.carbs || '0'}g carbs</ThemedText>
                <ThemedText>🥑 {formData.fats || '0'}g fats</ThemedText>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>

        <View style={{ padding: 16 }}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={{ marginBottom: 8 }}
          >
            Create Food
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}