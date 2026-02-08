import React, { useState, useEffect, useRef } from 'react';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/paperTheme';
import { AuthProvider } from '../context/AuthContext';
import { NutritionProvider } from '../context/NutritionContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

const THEME_STORAGE_KEY = '@nutrition_app_theme';

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    } finally {
      setIsLoadingTheme(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NutritionProvider 
          themeContext={{ 
            isDarkMode, 
            toggleTheme,
            theme 
          }}
        >
          {children}
        </NutritionProvider>
      </AuthProvider>
    </PaperProvider>
  );
};

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme | typeof darkTheme;
}

export default AppProviders;