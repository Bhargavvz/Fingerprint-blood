import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Fingerprint } from 'lucide-react-native';

interface FingerprintGuideProps {
  isVisible: boolean;
}

export default function FingerprintGuide({ isVisible }: FingerprintGuideProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      fadeAnim.setValue(1);
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={styles.guidanceContainer}>
        <View style={styles.fingerprintOutline}>
          <Fingerprint size={80} color="#FFFFFF" strokeWidth={1.5} />
        </View>
        <Text style={styles.guidanceText}>Place your finger in the center</Text>
        <Text style={styles.subText}>Keep steady for best results</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  guidanceContainer: {
    alignItems: 'center',
  },
  fingerprintOutline: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guidanceText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
    textAlign: 'center',
  },
});