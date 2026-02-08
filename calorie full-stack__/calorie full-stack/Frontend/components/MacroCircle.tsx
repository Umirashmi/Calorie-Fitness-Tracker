import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

interface MacroCircleProps {
  size?: number;
  progress: number; // 0 to 100
  current: number;
  target: number;
  color: string;
  label: string;
  unit: string;
  strokeWidth?: number;
  style?: any;
}

export const MacroCircle: React.FC<MacroCircleProps> = ({
  size = 120,
  progress,
  current,
  target,
  color,
  label,
  unit,
  strokeWidth = 8,
  style,
}) => {
  const theme = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.outline}
          strokeOpacity={0.2}
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      
      <View style={styles.content}>
        <Text variant="headlineSmall" style={[styles.currentValue, { color }]}>
          {Math.round(current)}
        </Text>
        <Text variant="bodySmall" style={[styles.target, { color: theme.colors.onSurfaceVariant }]}>
          / {target}{unit}
        </Text>
        <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
        <Text variant="bodySmall" style={[styles.percentage, { color }]}>
          {Math.round(progress)}%
        </Text>
      </View>
    </View>
  );
};

interface MacroCircleGroupProps {
  calories: { current: number; target: number; percentage: number };
  protein: { current: number; target: number; percentage: number };
  carbs: { current: number; target: number; percentage: number };
  fats: { current: number; target: number; percentage: number };
  size?: number;
  style?: any;
}

export const MacroCircleGroup: React.FC<MacroCircleGroupProps> = ({
  calories,
  protein,
  carbs,
  fats,
  size = 100,
  style,
}) => {
  const theme = useTheme();

  const macros = [
    {
      ...calories,
      color: theme.colors.calories,
      label: 'Calories',
      unit: '',
    },
    {
      ...protein,
      color: theme.colors.protein,
      label: 'Protein',
      unit: 'g',
    },
    {
      ...carbs,
      color: theme.colors.carbs,
      label: 'Carbs',
      unit: 'g',
    },
    {
      ...fats,
      color: theme.colors.fats,
      label: 'Fats',
      unit: 'g',
    },
  ];

  return (
    <View style={[styles.groupContainer, style]}>
      {macros.map((macro) => (
        <MacroCircle
          key={macro.label}
          size={size}
          progress={macro.percentage}
          current={macro.current}
          target={macro.target}
          color={macro.color}
          label={macro.label}
          unit={macro.unit}
          style={styles.circleItem}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  currentValue: {
    fontWeight: '600',
    lineHeight: undefined,
  },
  target: {
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  percentage: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  groupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: 16,
  },
  circleItem: {
    flex: 1,
    minWidth: 100,
  },
});

export default MacroCircle;