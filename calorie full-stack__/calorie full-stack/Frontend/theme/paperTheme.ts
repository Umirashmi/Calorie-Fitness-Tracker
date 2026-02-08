import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  web: {
    regular: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '100' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
  android: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: 'Roboto',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Roboto',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Roboto',
      fontWeight: '100' as const,
    },
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(0, 105, 92)',
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(151, 240, 219)',
    onPrimaryContainer: 'rgb(0, 32, 26)',
    secondary: 'rgb(76, 82, 89)',
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(207, 214, 222)',
    onSecondaryContainer: 'rgb(7, 15, 22)',
    tertiary: 'rgb(82, 94, 125)',
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(218, 226, 249)',
    onTertiaryContainer: 'rgb(12, 28, 56)',
    error: 'rgb(186, 26, 26)',
    onError: 'rgb(255, 255, 255)',
    errorContainer: 'rgb(255, 218, 214)',
    onErrorContainer: 'rgb(65, 0, 2)',
    background: 'rgb(251, 253, 252)',
    onBackground: 'rgb(25, 28, 27)',
    surface: 'rgb(251, 253, 252)',
    onSurface: 'rgb(25, 28, 27)',
    surfaceVariant: 'rgb(218, 229, 225)',
    onSurfaceVariant: 'rgb(64, 73, 70)',
    outline: 'rgb(112, 121, 118)',
    outlineVariant: 'rgb(190, 201, 197)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(46, 49, 48)',
    inverseOnSurface: 'rgb(239, 241, 240)',
    inversePrimary: 'rgb(123, 212, 191)',
    elevation: {
      ...MD3LightTheme.colors.elevation,
    },
    // Custom nutrition colors
    success: 'rgb(46, 125, 50)',
    warning: 'rgb(255, 152, 0)',
    info: 'rgb(33, 150, 243)',
    calories: 'rgb(255, 87, 34)',
    protein: 'rgb(139, 69, 19)',
    carbs: 'rgb(255, 193, 7)',
    fats: 'rgb(156, 39, 176)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(123, 212, 191)',
    onPrimary: 'rgb(0, 54, 45)',
    primaryContainer: 'rgb(0, 79, 68)',
    onPrimaryContainer: 'rgb(151, 240, 219)',
    secondary: 'rgb(179, 186, 194)',
    onSecondary: 'rgb(29, 37, 44)',
    secondaryContainer: 'rgb(52, 59, 66)',
    onSecondaryContainer: 'rgb(207, 214, 222)',
    tertiary: 'rgb(190, 198, 221)',
    onTertiary: 'rgb(34, 50, 78)',
    tertiaryContainer: 'rgb(58, 72, 101)',
    onTertiaryContainer: 'rgb(218, 226, 249)',
    error: 'rgb(255, 180, 171)',
    onError: 'rgb(105, 0, 5)',
    errorContainer: 'rgb(147, 0, 10)',
    onErrorContainer: 'rgb(255, 218, 214)',
    background: 'rgb(16, 20, 18)',
    onBackground: 'rgb(230, 225, 229)',
    surface: 'rgb(16, 20, 18)',
    onSurface: 'rgb(230, 225, 229)',
    surfaceVariant: 'rgb(64, 73, 70)',
    onSurfaceVariant: 'rgb(190, 201, 197)',
    outline: 'rgb(136, 147, 143)',
    outlineVariant: 'rgb(64, 73, 70)',
    shadow: 'rgb(0, 0, 0)',
    scrim: 'rgb(0, 0, 0)',
    inverseSurface: 'rgb(230, 225, 229)',
    inverseOnSurface: 'rgb(46, 49, 48)',
    inversePrimary: 'rgb(0, 105, 92)',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
    },
    // Custom nutrition colors (dark variants)
    success: 'rgb(102, 187, 106)',
    warning: 'rgb(255, 183, 77)',
    info: 'rgb(100, 181, 246)',
    calories: 'rgb(255, 138, 101)',
    protein: 'rgb(188, 170, 164)',
    carbs: 'rgb(255, 213, 79)',
    fats: 'rgb(186, 104, 200)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

export type AppTheme = typeof lightTheme;

declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      success: string;
      warning: string;
      info: string;
      calories: string;
      protein: string;
      carbs: string;
      fats: string;
    }
    
    interface Theme {
      spacing: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
      };
      borderRadius: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        full: number;
      };
    }
  }
}