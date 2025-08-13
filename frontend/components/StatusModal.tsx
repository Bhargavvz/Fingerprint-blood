import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Check, X, TriangleAlert as AlertTriangle, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StatusModalProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const { width } = Dimensions.get('window');

export default function StatusModal({
  visible,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 3000,
}: StatusModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoClose && onClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: Check,
          colors: ['#059669', '#10B981'] as const,
          backgroundColor: '#ECFDF5',
          iconColor: '#FFFFFF',
        };
      case 'error':
        return {
          icon: X,
          colors: ['#DC2626', '#EF4444'] as const,
          backgroundColor: '#FEF2F2',
          iconColor: '#FFFFFF',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          colors: ['#F59E0B', '#FBBF24'] as const,
          backgroundColor: '#FFFBEB',
          iconColor: '#FFFFFF',
        };
      case 'info':
        return {
          icon: Info,
          colors: ['#2563EB', '#3B82F6'] as const,
          backgroundColor: '#EFF6FF',
          iconColor: '#FFFFFF',
        };
      default:
        return {
          icon: Info,
          colors: ['#6B7280', '#9CA3AF'] as const,
          backgroundColor: '#F9FAFB',
          iconColor: '#FFFFFF',
        };
    }
  };

  if (!visible) return null;

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={[styles.modal, { backgroundColor: config.backgroundColor }]}>
          <LinearGradient colors={config.colors} style={styles.iconContainer}>
            <IconComponent size={32} color={config.iconColor} strokeWidth={2} />
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width - 48,
    maxWidth: 320,
  },
  modal: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});