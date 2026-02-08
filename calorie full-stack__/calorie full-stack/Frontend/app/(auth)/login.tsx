import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Card, 
  TextInput, 
  Button, 
  Text, 
  HelperText,
  Divider,
  useTheme,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { LoginCredentials } from '../../types/nutrition';

const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
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

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!credentials.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(credentials.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!credentials.password.trim()) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) return;

    clearError();
    const success = await login(credentials);
    
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleRegisterPress = (): void => {
    router.push('/(auth)/register');
  };

  const handleEmailChange = (text: string): void => {
    setCredentials(prev => ({ ...prev, email: text }));
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string): void => {
    setCredentials(prev => ({ ...prev, password: text }));
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: undefined }));
    }
  };

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
            Welcome Back
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Sign in to continue tracking your nutrition
          </Text>
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

            <TextInput
              label="Email"
              value={credentials.email}
              onChangeText={handleEmailChange}
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
              value={credentials.password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoComplete="password"
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

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Divider style={styles.divider} />

            <View style={styles.registerContainer}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Don't have an account?
              </Text>
              <Button
                mode="text"
                onPress={handleRegisterPress}
                style={styles.registerButton}
                labelStyle={{ color: theme.colors.primary }}
              >
                Sign Up
              </Button>
            </View>
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
  subtitle: {
    textAlign: 'center',
    marginHorizontal: 16,
  },
  card: {
    marginHorizontal: 4,
  },
  cardContent: {
    padding: 24,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  divider: {
    marginVertical: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerButton: {
    marginLeft: -8,
  },
});

export default LoginScreen;