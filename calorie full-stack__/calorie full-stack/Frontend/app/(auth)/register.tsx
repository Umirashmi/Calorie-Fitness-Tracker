import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  TextInput, 
  Button, 
  Text, 
  HelperText,
  SegmentedButtons,
  Divider,
  useTheme,
  Chip,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { RegisterData, ActivityLevel, Gender } from '../../types/nutrition';

const RegisterScreen: React.FC = () => {
  const theme = useTheme();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [userData, setUserData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    age: undefined,
    weight: undefined,
    height: undefined,
    gender: undefined,
    activityLevel: undefined,
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep1 = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!userData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!userData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(userData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!userData.password.trim()) {
      errors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (userData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (userData.age !== undefined) {
      if (userData.age < 13 || userData.age > 120) {
        errors.age = 'Age must be between 13 and 120';
      }
    }

    if (userData.weight !== undefined) {
      if (userData.weight < 30 || userData.weight > 500) {
        errors.weight = 'Weight must be between 30 and 500 kg';
      }
    }

    if (userData.height !== undefined) {
      if (userData.height < 100 || userData.height > 250) {
        errors.height = 'Height must be between 100 and 250 cm';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = (): void => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = (): void => {
    setCurrentStep(1);
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateStep2()) return;

    clearError();
    const success = await register(userData);
    
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleLoginPress = (): void => {
    router.push('/(auth)/login');
  };

  const updateUserData = <K extends keyof RegisterData>(key: K, value: RegisterData[K]): void => {
    setUserData(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'lightly_active', label: 'Light' },
    { value: 'moderately_active', label: 'Moderate' },
    { value: 'very_active', label: 'Very Active' },
    { value: 'extra_active', label: 'Extra Active' },
  ];

  const renderStep1 = () => (
    <>
      <Text variant="headlineSmall" style={styles.stepTitle}>
        Create Your Account
      </Text>
      
      <TextInput
        label="Full Name"
        value={userData.name}
        onChangeText={(text) => updateUserData('name', text)}
        autoCapitalize="words"
        autoComplete="name"
        error={!!fieldErrors.name}
        style={styles.input}
        left={<TextInput.Icon icon="account-outline" />}
      />
      <HelperText type="error" visible={!!fieldErrors.name}>
        {fieldErrors.name}
      </HelperText>

      <TextInput
        label="Email"
        value={userData.email}
        onChangeText={(text) => updateUserData('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        error={!!fieldErrors.email}
        style={styles.input}
        left={<TextInput.Icon icon="email-outline" />}
      />
      <HelperText type="error" visible={!!fieldErrors.email}>
        {fieldErrors.email}
      </HelperText>

      <TextInput
        label="Password"
        value={userData.password}
        onChangeText={(text) => updateUserData('password', text)}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        autoCorrect={false}
        error={!!fieldErrors.password}
        style={styles.input}
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <HelperText type="error" visible={!!fieldErrors.password}>
        {fieldErrors.password}
      </HelperText>

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        autoComplete="new-password"
        autoCorrect={false}
        error={!!fieldErrors.confirmPassword}
        style={styles.input}
        left={<TextInput.Icon icon="lock-check-outline" />}
        right={
          <TextInput.Icon
            icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        }
      />
      <HelperText type="error" visible={!!fieldErrors.confirmPassword}>
        {fieldErrors.confirmPassword}
      </HelperText>

      <Button
        mode="contained"
        onPress={handleNextStep}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Continue
      </Button>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text variant="headlineSmall" style={styles.stepTitle}>
        Personal Information
      </Text>
      
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        This information helps us calculate your daily nutritional needs (optional)
      </Text>

      <View style={styles.row}>
        <TextInput
          label="Age"
          value={userData.age?.toString() || ''}
          onChangeText={(text) => updateUserData('age', text ? parseInt(text) || undefined : undefined)}
          keyboardType="numeric"
          error={!!fieldErrors.age}
          style={[styles.input, styles.halfInput]}
          left={<TextInput.Icon icon="calendar-outline" />}
        />
        
        <View style={styles.genderContainer}>
          <Text variant="labelMedium" style={styles.inputLabel}>
            Gender
          </Text>
          <View style={styles.chipContainer}>
            {genderOptions.map((option) => (
              <Chip
                key={option.value}
                selected={userData.gender === option.value}
                onPress={() => updateUserData('gender', option.value as Gender)}
                style={styles.chip}
                showSelectedOverlay
              >
                {option.label}
              </Chip>
            ))}
          </View>
        </View>
      </View>
      <HelperText type="error" visible={!!fieldErrors.age}>
        {fieldErrors.age}
      </HelperText>

      <View style={styles.row}>
        <TextInput
          label="Weight (kg)"
          value={userData.weight?.toString() || ''}
          onChangeText={(text) => updateUserData('weight', text ? parseFloat(text) || undefined : undefined)}
          keyboardType="decimal-pad"
          error={!!fieldErrors.weight}
          style={[styles.input, styles.halfInput]}
          left={<TextInput.Icon icon="scale-bathroom" />}
        />
        
        <TextInput
          label="Height (cm)"
          value={userData.height?.toString() || ''}
          onChangeText={(text) => updateUserData('height', text ? parseFloat(text) || undefined : undefined)}
          keyboardType="decimal-pad"
          error={!!fieldErrors.height}
          style={[styles.input, styles.halfInput]}
          left={<TextInput.Icon icon="human-male-height" />}
        />
      </View>
      <HelperText type="error" visible={!!fieldErrors.weight || !!fieldErrors.height}>
        {fieldErrors.weight || fieldErrors.height}
      </HelperText>

      <Text variant="labelMedium" style={styles.inputLabel}>
        Activity Level
      </Text>
      <View style={styles.chipContainer}>
        {activityOptions.map((option) => (
          <Chip
            key={option.value}
            selected={userData.activityLevel === option.value}
            onPress={() => updateUserData('activityLevel', option.value as ActivityLevel)}
            style={styles.chip}
            showSelectedOverlay
          >
            {option.label}
          </Chip>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <Button
          mode="outlined"
          onPress={handlePreviousStep}
          style={[styles.button, styles.halfButton]}
        >
          Back
        </Button>
        
        <Button
          mode="contained"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          style={[styles.button, styles.halfButton]}
          contentStyle={styles.buttonContent}
        >
          {isLoading ? 'Creating...' : 'Create Account'}
        </Button>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { margin: 20, backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text variant="displaySmall" style={styles.title}>
            Join Nutrition Tracker
          </Text>
          <View style={styles.stepIndicator}>
            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
              Step {currentStep} of 2
            </Text>
          </View>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer }}>
                  {error}
                </Text>
              </View>
            )}

            {currentStep === 1 ? renderStep1() : renderStep2()}

            {currentStep === 1 && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.loginContainer}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Already have an account?
                  </Text>
                  <Button
                    mode="text"
                    onPress={handleLoginPress}
                    style={styles.loginButton}
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    Sign In
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepIndicator: {
    marginTop: 4,
  },
  card: {
    marginHorizontal: 4,
  },
  cardContent: {
    padding: 24,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  inputLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    // flexDirection: 'row',
    gap: 12,
    // alignItems: 'flex-start',
  },
  halfInput: {
    flex: 1,
  },
  genderContainer: {
    flex: 1,
    marginBottom: 16
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginBottom: 4,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  halfButton: {
    flex: 1,
    margin: 0,
  },
  divider: {
    marginVertical: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButton: {
    marginLeft: -8,
  },
});

export default RegisterScreen;