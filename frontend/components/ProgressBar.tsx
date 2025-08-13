import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  color = '#2563EB',
  backgroundColor = '#E5E7EB',
  height = 6,
  animated = true,
}: ProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated]);

  const progressWidth = animated
    ? progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
      })
    : `${progress * 100}%`;

  return (
    <View style={[styles.container, { backgroundColor, height }]}>
      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: color,
            width: progressWidth as any,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 3,
  },
});