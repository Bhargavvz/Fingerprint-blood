import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export class BiometricAuth {
  static async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    return hasHardware && isEnrolled;
  }

  static async getSupportedTypes(): Promise<string[]> {
    if (Platform.OS === 'web') return [];
    
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map((type: any) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
  }

  static async authenticate(reason: string = 'Please authenticate to continue'): Promise<BiometricAuthResult> {
    try {
      if (Platform.OS === 'web') {
        return { success: false, error: 'Biometric authentication not available on web' };
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return { 
          success: false, 
          error: 'Biometric authentication is not available on this device' 
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        requireConfirmation: false,
      });

      if (result.success) {
        const types = await this.getSupportedTypes();
        return { 
          success: true, 
          biometricType: types[0] || 'Biometric' 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Authentication failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication error' 
      };
    }
  }

  static async authenticateForScan(): Promise<BiometricAuthResult> {
    return this.authenticate('Authenticate to start fingerprint scan');
  }

  static async authenticateForSettings(): Promise<BiometricAuthResult> {
    return this.authenticate('Authenticate to access sensitive settings');
  }

  static async authenticateForExport(): Promise<BiometricAuthResult> {
    return this.authenticate('Authenticate to export your data');
  }

  static showBiometricPrompt(onSuccess: () => void, onError?: (error: string) => void) {
    this.isAvailable().then(available => {
      if (!available) {
        Alert.alert(
          'Biometric Authentication',
          'Biometric authentication is not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      this.authenticate().then(result => {
        if (result.success) {
          onSuccess();
        } else {
          const message = result.error || 'Authentication failed';
          if (onError) {
            onError(message);
          } else {
            Alert.alert('Authentication Failed', message, [{ text: 'OK' }]);
          }
        }
      });
    });
  }
}

// Utility hook for biometric authentication
export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [supportedTypes, setSupportedTypes] = React.useState<string[]>([]);

  React.useEffect(() => {
    BiometricAuth.isAvailable().then(setIsAvailable);
    BiometricAuth.getSupportedTypes().then(setSupportedTypes);
  }, []);

  const authenticateAsync = async (reason?: string) => {
    return await BiometricAuth.authenticate(reason);
  };

  const showPrompt = (onSuccess: () => void, onError?: (error: string) => void) => {
    BiometricAuth.showBiometricPrompt(onSuccess, onError);
  };

  return {
    isAvailable,
    supportedTypes,
    authenticate: authenticateAsync,
    showPrompt,
  };
}

// We need to import React for the hook
import React from 'react';
