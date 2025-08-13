import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, Shield, Zap } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAppContext } from '@/context/AppContext';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: Fingerprint,
    title: 'Blood Group Prediction',
    description: 'Get your blood group detected instantly using just your fingerprint. No needles, no pain.',
    color: '#2563EB',
  },
  {
    id: 2,
    icon: Zap,
    title: 'Fast & Accurate',
    description: 'Advanced AI technology provides quick results with high accuracy. Results in seconds.',
    color: '#059669',
  },
  {
    id: 3,
    icon: Shield,
    title: 'Privacy First',
    description: 'Your fingerprint images are never stored or shared. Complete privacy guaranteed.',
    color: '#DC2626',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const progress = useSharedValue(0);
  const { completeOnboarding } = useAppContext();

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({ x: newIndex * width, animated: true });
      progress.value = withSpring((newIndex + 1) / onboardingData.length);
    } else {
      completeOnboarding();
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/auth');
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
          progress.value = withSpring((newIndex + 1) / onboardingData.length);
        }}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} style={styles.slide}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[item.color, `${item.color}80`]}
                style={styles.iconBackground}
              >
                <item.icon size={80} color="#FFFFFF" strokeWidth={1.5} />
              </LinearGradient>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.nextButtonGradient}>
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 60,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  pagination: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});