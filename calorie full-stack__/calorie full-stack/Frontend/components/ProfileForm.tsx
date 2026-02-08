import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  TextInput, 
  SegmentedButtons, 
  Button, 
  Text, 
  HelperText,
  Card,
  useTheme,
} from 'react-native-paper';
import { User, ProfileUpdate, Gender, ActivityLevel } from '../types/nutrition';

interface ProfileFormProps {
  user: User | null;
  onSubmit: (updates: ProfileUpdate) => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorClear?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  user,
  onSubmit,
  isLoading = false,
  error,
  onErrorClear,
}) => {
  const theme = useTheme();

  const [formData, setFormData] = useState<ProfileUpdate>({
    name: user?.name || '',
    age: user?.age,
    weight: user?.weight,
    height: user?.height,
    gender: user?.gender,
    activityLevel: user?.activityLevel,
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        activityLevel: user.activityLevel,
      });
    }
  }, [user]);

  const validateField = (field: keyof ProfileUpdate, value: any): string | null => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 50) {
          return 'Name must be less than 50 characters';
        }
        return null;

      case 'age':
        if (value !== undefined && value !== null) {
          const age = Number(value);
          if (isNaN(age) || age < 13 || age > 120) {
            return 'Age must be between 13 and 120';
          }
        }
        return null;

      case 'weight':
        if (value !== undefined && value !== null) {
          const weight = Number(value);
          if (isNaN(weight) || weight < 30 || weight > 500) {
            return 'Weight must be between 30 and 500 kg';
          }
        }
        return null;

      case 'height':
        if (value !== undefined && value !== null) {
          const height = Number(value);
          if (isNaN(height) || height < 100 || height > 250) {
            return 'Height must be between 100 and 250 cm';
          }
        }
        return null;

      default:
        return null;
    }
  };

  const updateField = <K extends keyof ProfileUpdate>(
    field: K,
    value: ProfileUpdate[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error if it exists
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear global error
    if (error && onErrorClear) {
      onErrorClear();
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    Object.keys(formData).forEach((key) => {
      const field = key as keyof ProfileUpdate;
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const activityLevelOptions = [
    { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { value: 'lightly_active', label: 'Light', description: 'Light exercise 1-3 days/week' },
    { value: 'moderately_active', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
    { value: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
    { value: 'extra_active', label: 'Extra Active', description: 'Very hard exercise, physical job' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Basic Information
          </Text>

          <TextInput
            label="Full Name *"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            error={!!fieldErrors.name}
            style={styles.input}
            left={<TextInput.Icon icon="account-outline" />}
            autoCapitalize="words"
          />
          <HelperText type="error" visible={!!fieldErrors.name}>
            {fieldErrors.name}
          </HelperText>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Age"
                value={formData.age?.toString() || ''}
                onChangeText={(text) => updateField('age', text ? parseInt(text, 10) || undefined : undefined)}
                keyboardType="numeric"
                error={!!fieldErrors.age}
                style={styles.input}
                left={<TextInput.Icon icon="calendar-outline" />}
              />
              <HelperText type="error" visible={!!fieldErrors.age}>
                {fieldErrors.age}
              </HelperText>
            </View>

            <View style={styles.halfWidth}>
              <Text variant="labelMedium" style={styles.segmentedButtonLabel}>
                Gender
              </Text>
              <SegmentedButtons
                value={formData.gender || ''}
                onValueChange={(value) => updateField('gender', value as Gender)}
                buttons={genderOptions}
                style={styles.segmentedButtons}
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Physical Measurements
          </Text>
          <Text variant="bodySmall" style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            Used to calculate your daily caloric needs
          </Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <TextInput
                label="Weight (kg)"
                value={formData.weight?.toString() || ''}
                onChangeText={(text) => updateField('weight', text ? parseFloat(text) || undefined : undefined)}
                keyboardType="decimal-pad"
                error={!!fieldErrors.weight}
                style={styles.input}
                left={<TextInput.Icon icon="scale-bathroom" />}
              />
              <HelperText type="error" visible={!!fieldErrors.weight}>
                {fieldErrors.weight}
              </HelperText>
            </View>

            <View style={styles.halfWidth}>
              <TextInput
                label="Height (cm)"
                value={formData.height?.toString() || ''}
                onChangeText={(text) => updateField('height', text ? parseFloat(text) || undefined : undefined)}
                keyboardType="decimal-pad"
                error={!!fieldErrors.height}
                style={styles.input}
                left={<TextInput.Icon icon="human-male-height" />}
              />
              <HelperText type="error" visible={!!fieldErrors.height}>
                {fieldErrors.height}
              </HelperText>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Activity Level
          </Text>
          <Text variant="bodySmall" style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
            Choose the option that best describes your typical activity level
          </Text>

          <View style={styles.activityContainer}>
            {activityLevelOptions.map((option) => (
              <View key={option.value} style={styles.activityOption}>
                <Button
                  mode={formData.activityLevel === option.value ? 'contained' : 'outlined'}
                  onPress={() => updateField('activityLevel', option.value as ActivityLevel)}
                  style={styles.activityButton}
                  contentStyle={styles.activityButtonContent}
                >
                  <View style={styles.activityButtonText}>
                    <Text variant="labelLarge">{option.label}</Text>
                    <Text variant="bodySmall" style={{ textAlign: 'center' }}>
                      {option.description}
                    </Text>
                  </View>
                </Button>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {error && (
        <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]} elevation={1}>
          <Card.Content>
            <Text style={{ color: theme.colors.onErrorContainer }}>
              {error}
            </Text>
          </Card.Content>
        </Card>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  segmentedButtonLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  activityContainer: {
    gap: 8,
  },
  activityOption: {
    marginBottom: 8,
  },
  activityButton: {
    minHeight: 60,
  },
  activityButtonContent: {
    minHeight: 60,
    paddingVertical: 8,
  },
  activityButtonText: {
    alignItems: 'center',
    gap: 4,
  },
  errorCard: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});

export default ProfileForm;