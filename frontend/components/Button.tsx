import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const getColors = (): readonly [string, string] => {
    switch (variant) {
      case 'primary':
        return ['#2563EB', '#1D4ED8'] as const;
      case 'secondary':
        return ['#6B7280', '#4B5563'] as const;
      case 'danger':
        return ['#DC2626', '#B91C1C'] as const;
      default:
        return ['#2563EB', '#1D4ED8'] as const;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
      case 'medium':
        return { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const colors = getColors();
  const sizeStyle = getSize();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, style, disabled && styles.disabled]}
    >
      <LinearGradient
        colors={disabled ? ['#9CA3AF', '#6B7280'] as const : colors}
        style={[styles.gradient, { paddingVertical: sizeStyle.paddingVertical, paddingHorizontal: sizeStyle.paddingHorizontal }]}
      >
        <Text
          style={[
            styles.text,
            { fontSize: sizeStyle.fontSize },
            textStyle,
            disabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#D1D5DB',
  },
});