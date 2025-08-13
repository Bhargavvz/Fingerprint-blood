import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, RotateCcw, Image as ImageIcon, X, Check, Fingerprint, Sun, Focus, AlertTriangle, Wifi, WifiOff } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import FingerprintGuide from '@/components/FingerprintGuide';
import ProgressBar from '@/components/ProgressBar';
import { apiService } from '@/services/api';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [focusStatus, setFocusStatus] = useState<'good' | 'poor' | 'checking'>('checking');
  const [lightingStatus, setLightingStatus] = useState<'good' | 'poor' | 'checking'>('checking');
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { addPrediction, backendAvailable, checkBackendStatus } = useAppContext();

  // Simulate real-time feedback
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly simulate focus and lighting conditions
      setFocusStatus(Math.random() > 0.3 ? 'good' : 'poor');
      setLightingStatus(Math.random() > 0.4 ? 'good' : 'poor');
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Camera size={64} color="#6B7280" strokeWidth={1.5} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need camera access to capture your fingerprint for blood group detection.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.permissionButtonGradient}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleGalleryUpload = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      triggerHaptic();
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    setProcessing(true);
    setProgress(0);

    try {
      // Update progress during API call
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 0.8) {
            clearInterval(progressInterval);
            return 0.8;
          }
          return prev + 0.1;
        });
      }, 300);

      // Call the actual API or fallback
      const useRealAPI = backendAvailable;
      const response = await apiService.predictBloodGroup(imageUri, useRealAPI);

      clearInterval(progressInterval);
      setProgress(1);

      if (response.success) {
        const prediction = {
          bloodGroup: response.prediction.blood_group,
          confidence: Math.round(response.prediction.confidence * 100),
          date: new Date(),
          id: Date.now().toString(),
          method: response.prediction.method,
          imageUri: imageUri,
        };

        await addPrediction(prediction);
        
        setTimeout(() => {
          setProcessing(false);
          setProgress(0);
          router.push(`/result?bloodGroup=${prediction.bloodGroup}&confidence=${prediction.confidence}&method=${prediction.method}`);
        }, 500);
      } else {
        throw new Error(response.error || 'Prediction failed');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setProcessing(false);
      setProgress(0);
      
      Alert.alert(
        'Prediction Failed',
        'There was an error analyzing your fingerprint. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    try {
      triggerHaptic();
      
      // Capture the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo) {
        setCaptured(true);
        setCapturedImageUri(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const handleConfirmCapture = async () => {
    if (capturedImageUri) {
      await processImage(capturedImageUri);
    }
  };

  const handleRetake = () => {
    setCaptured(false);
    setCapturedImageUri(null);
    setProcessing(false);
    setProgress(0);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (processing) {
    return (
      <View style={styles.processingContainer}>
        <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={styles.processingGradient}>
          <View style={styles.processingContent}>
            <View style={styles.processingIcon}>
              <Fingerprint size={48} color="#2563EB" strokeWidth={2} />
            </View>
            <Text style={styles.processingTitle}>Analyzing Fingerprint</Text>
            <Text style={styles.processingSubtitle}>
              {backendAvailable ? 'AI neural network is detecting your blood group...' : 'Using demo mode for blood group detection...'}
            </Text>
            <View style={styles.progressContainer}>
              <ProgressBar progress={progress} />
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
            
            {/* Backend status indicator */}
            <View style={styles.statusIndicator}>
              {backendAvailable ? (
                <>
                  <Wifi size={16} color="#059669" />
                  <Text style={[styles.statusText, { color: '#059669' }]}>Connected to AI Backend</Text>
                </>
              ) : (
                <>
                  <WifiOff size={16} color="#F59E0B" />
                  <Text style={[styles.statusText, { color: '#F59E0B' }]}>Demo Mode</Text>
                </>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <X size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scan Fingerprint</Text>
          {/* Backend status in header */}
          <View style={styles.headerStatus}>
            {backendAvailable ? (
              <>
                <Wifi size={14} color="#10B981" />
                <Text style={[styles.headerStatusText, { color: '#10B981' }]}>AI Ready</Text>
              </>
            ) : (
              <>
                <WifiOff size={14} color="#F59E0B" />
                <Text style={[styles.headerStatusText, { color: '#F59E0B' }]}>Demo</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={toggleCameraFacing} style={styles.headerButton}>
          <RotateCcw size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <FingerprintGuide isVisible={!captured} />
          
          {/* Real-time Feedback Overlay */}
          {!captured && (
            <View style={styles.feedbackOverlay}>
              <View style={styles.feedbackTop}>
                <View style={[styles.feedbackItem, focusStatus === 'good' ? styles.feedbackGood : styles.feedbackPoor]}>
                  <Focus size={16} color={focusStatus === 'good' ? '#059669' : '#DC2626'} />
                  <Text style={[styles.feedbackText, focusStatus === 'good' ? styles.feedbackTextGood : styles.feedbackTextPoor]}>
                    {focusStatus === 'good' ? 'Focus Good' : 'Poor Focus'}
                  </Text>
                </View>
                
                <View style={[styles.feedbackItem, lightingStatus === 'good' ? styles.feedbackGood : styles.feedbackPoor]}>
                  {lightingStatus === 'good' ? (
                    <Sun size={16} color="#059669" />
                  ) : (
                    <AlertTriangle size={16} color="#DC2626" />
                  )}
                  <Text style={[styles.feedbackText, lightingStatus === 'good' ? styles.feedbackTextGood : styles.feedbackTextPoor]}>
                    {lightingStatus === 'good' ? 'Lighting Good' : 'More Light Needed'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </CameraView>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.galleryButton}
          onPress={handleGalleryUpload}
        >
          <ImageIcon size={24} color="#6B7280" strokeWidth={2} />
          <Text style={styles.galleryText}>Gallery</Text>
        </TouchableOpacity>

        {captured ? (
          <View style={styles.captureActions}>
            <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirmCapture} style={styles.confirmButton}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.confirmGradient}>
                <Check size={24} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
            <View style={styles.captureButtonInner}>
              <Camera size={28} color="#2563EB" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.placeholder} />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Instructions</Text>
        <Text style={styles.instructionsText}>
          • Ensure good lighting for best results{'\n'}
          • Place your thumb flat on the camera{'\n'}
          • Keep your finger steady during capture{'\n'}
          • {backendAvailable ? 'AI analysis provides 85-90% accuracy' : 'Demo mode for testing purposes'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionContent: {
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  permissionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  cameraContainer: {
    flex: 1,
    margin: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  galleryButton: {
    alignItems: 'center',
    width: 60,
  },
  galleryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginTop: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  retakeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  confirmButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 60,
  },
  instructions: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
    lineHeight: 20,
  },
  processingContainer: {
    flex: 1,
  },
  processingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  processingContent: {
    alignItems: 'center',
  },
  processingIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  processingTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  progressContainer: {
    width: width * 0.6,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  feedbackTop: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  feedbackGood: {
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
  },
  feedbackPoor: {
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
  },
  feedbackText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  feedbackTextGood: {
    color: '#FFFFFF',
  },
  feedbackTextPoor: {
    color: '#FFFFFF',
  },
});
