import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export default function LoadingSpinner({ size = 24, color = '#2563EB' }: LoadingSpinnerProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    
    spinAnimation.start();

    return () => spinAnimation.stop();
  }, [rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderColor: `${color}20`,
            borderTopColor: color,
            transform: [{ rotate }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 50,
  },
});