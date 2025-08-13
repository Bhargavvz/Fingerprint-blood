import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { checkAuthStatus, isAuthenticated, hasCompletedOnboarding } = useAppContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initializeApp = async () => {
      await checkAuthStatus();
      
      setTimeout(() => {
        if (!hasCompletedOnboarding) {
          router.replace('/onboarding');
        } else if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/auth');
        }
      }, 2500);
    };

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    initializeApp();
  }, [hasCompletedOnboarding, isAuthenticated]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#2563EB', '#1D4ED8', '#1E40AF']} style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolate },
            ],
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Fingerprint size={60} color="#FFFFFF" strokeWidth={2} />
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>BloodScan</Text>
        <Text style={styles.subtitle}>Fingerprint Blood Group Detection</Text>
      </Animated.View>
      
      <Animated.View style={[styles.loader, { opacity: fadeAnim }]}>
        <View style={styles.loadingBar}>
          <Animated.View style={[styles.loadingProgress, { transform: [{ scaleX: scaleAnim }] }]} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
    textAlign: 'center',
  },
  loader: {
    position: 'absolute',
    bottom: 100,
    width: width * 0.6,
  },
  loadingBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
});