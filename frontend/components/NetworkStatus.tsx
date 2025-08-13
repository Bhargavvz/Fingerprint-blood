import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Wifi, WifiOff } from 'lucide-react-native';

interface NetworkStatusProps {
  showOnlineMessage?: boolean;
}

export default function NetworkStatus({ showOnlineMessage = false }: NetworkStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showStatus, setShowStatus] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable;
      
      if (isConnected !== connected) {
        setIsConnected(connected);
        setShowStatus(true);
        
        // Show status bar
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Hide after 3 seconds if online, keep visible if offline
        if (connected) {
          setTimeout(() => {
            Animated.timing(slideAnim, {
              toValue: -60,
              duration: 300,
              useNativeDriver: true,
            }).start(() => setShowStatus(false));
          }, 3000);
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  if (!showStatus && (isConnected || !showOnlineMessage)) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isConnected ? '#059669' : '#DC2626',
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        {isConnected ? (
          <Wifi size={16} color="#FFFFFF" strokeWidth={2} />
        ) : (
          <WifiOff size={16} color="#FFFFFF" strokeWidth={2} />
        )}
        <Text style={styles.text}>
          {isConnected ? 'Back online' : 'No internet connection'}
        </Text>
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
    zIndex: 1000,
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
});
