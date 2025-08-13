import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

interface UseAccessibilityOptions {
  screenTitle?: string;
  onScreenReaderToggle?: (enabled: boolean) => void;
}

export function useAccessibility({ screenTitle, onScreenReaderToggle }: UseAccessibilityOptions = {}) {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Announce screen title when component mounts
    if (screenTitle) {
      AccessibilityInfo.announceForAccessibility(`${screenTitle} screen loaded`);
    }

    // Listen for screen reader changes
    let subscription: any;
    if (onScreenReaderToggle) {
      subscription = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        onScreenReaderToggle
      );
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [screenTitle, onScreenReaderToggle]);

  const announceMessage = (message: string) => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const isScreenReaderEnabled = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    return await AccessibilityInfo.isScreenReaderEnabled();
  };

  return {
    announceMessage,
    isScreenReaderEnabled,
  };
}

// Custom hook for focus management
export function useFocusManagement() {
  const setFocus = (elementRef: React.RefObject<any>) => {
    if (Platform.OS !== 'web' && elementRef.current) {
      AccessibilityInfo.setAccessibilityFocus(elementRef.current);
    }
  };

  return { setFocus };
}

// Accessibility helper functions
export const accessibilityLabels = {
  bloodGroupCard: (bloodGroup: string, confidence: number) => 
    `Blood group ${bloodGroup} with ${confidence}% confidence`,
  
  scanButton: 'Start fingerprint scan',
  
  historyItem: (bloodGroup: string, date: Date) => 
    `Scan result: ${bloodGroup}, performed on ${date.toLocaleDateString()}`,

  confidenceLevel: (confidence: number) => {
    if (confidence >= 90) return 'Very high accuracy';
    if (confidence >= 80) return 'High accuracy';
    if (confidence >= 70) return 'Good accuracy';
    return 'Moderate accuracy';
  },

  navigationTab: (tabName: string, isSelected: boolean) => 
    `${tabName} tab${isSelected ? ', selected' : ''}`,
};

// Accessibility hints
export const accessibilityHints = {
  scanButton: 'Double tap to open camera and start scanning your fingerprint',
  historyCard: 'Double tap to view detailed results',
  settingsItem: 'Double tap to modify this setting',
  backButton: 'Double tap to go back to previous screen',
};
