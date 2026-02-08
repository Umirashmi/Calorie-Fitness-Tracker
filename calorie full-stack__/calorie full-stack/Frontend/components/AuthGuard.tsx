import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  // Use try-catch to handle potential context issues
  let authState;
  try {
    authState = useAuth();
  } catch (error) {
    console.warn('AuthGuard: useAuth hook failed, showing loading state:', error);
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Initializing...
        </Text>
      </View>
    );
  }

  const { isAuthenticated, isLoading, user } = authState;

  useEffect(() => {
    if (!isLoading) {
      setIsAuthChecked(true);
      if (!isAuthenticated && !hasNavigated) {
        setHasNavigated(true);
        // Use setTimeout to ensure navigation happens after the current render cycle
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 100);
      }
    }
  }, [isAuthenticated, isLoading, hasNavigated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Redirecting to login...
        </Text>
      </View>
    );
  }

  // Only render children after authentication is confirmed
  if (!isAuthChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Verifying authentication...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    textAlign: 'center',
  },
});

export default AuthGuard;