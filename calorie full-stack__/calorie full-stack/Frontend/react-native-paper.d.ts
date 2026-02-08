// react-native-paper.d.ts
import 'react-native-paper';

declare module 'react-native-paper' {
  interface MD3Colors {
    success: string;
    warning: string;
    info: string;
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
  }
  interface MD3Theme {
    spacing: {
      xs: number; sm: number; md: number; lg: number; xl: number; xxl: number;
    };
    borderRadius: {
      xs: number; sm: number; md: number; lg: number; xl: number; full: number;
    };
  }
}
