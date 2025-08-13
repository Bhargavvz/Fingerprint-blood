import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

interface ConfettiAnimationProps {
  active: boolean;
  colors?: string[];
  pieceCount?: number;
}

export default function ConfettiAnimation({
  active,
  colors = ['#2563EB', '#059669', '#DC2626', '#F59E0B', '#7C3AED'],
  pieceCount = 50,
}: ConfettiAnimationProps) {
  const confettiPieces = useRef<ConfettiPiece[]>([]);

  useEffect(() => {
    // Initialize confetti pieces
    confettiPieces.current = Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-20),
      rotation: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  useEffect(() => {
    if (active) {
      const animations = confettiPieces.current.map((piece) => {
        return Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotation, {
            toValue: 360 * (2 + Math.random() * 3),
            duration: 3000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.stagger(100, animations).start(() => {
        // Reset positions for next animation
        confettiPieces.current.forEach((piece) => {
          piece.y.setValue(-20);
          piece.rotation.setValue(0);
          piece.x.setValue(Math.random() * width);
        });
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map((piece) => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: piece.color,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});