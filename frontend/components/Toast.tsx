import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Check, X, AlertTriangle, Info } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  message: string;
  duration?: number;
  onHide?: () => void;
}

export default function Toast({ visible, type, message, duration = 3000, onHide }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  };

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          icon: <Check size={20} color="#FFFFFF" strokeWidth={2} />,
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          icon: <X size={20} color="#FFFFFF" strokeWidth={2} />,
        };
      case 'warning':
        return {
          backgroundColor: '#F59E0B',
          icon: <AlertTriangle size={20} color="#FFFFFF" strokeWidth={2} />,
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          icon: <Info size={20} color="#FFFFFF" strokeWidth={2} />,
        };
      default:
        return {
          backgroundColor: '#6B7280',
          icon: <Info size={20} color="#FFFFFF" strokeWidth={2} />,
        };
    }
  };

  const config = getToastConfig(type);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        {config.icon}
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
});
