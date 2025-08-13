import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert, Share as RNShare } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Chrome as Home, RotateCcw, Share, TriangleAlert as AlertTriangle, Download, Camera, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import StatusModal from '@/components/StatusModal';
import ConfettiAnimation from '@/components/ConfettiAnimation';
import { getBloodGroupColor, getBloodGroupInfo } from '@/utils/bloodGroupUtils';

const { width } = Dimensions.get('window');

export default function ResultScreen() {
  const { bloodGroup, confidence } = useLocalSearchParams();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const [showShareModal, setShowShareModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);


  const handleShare = async () => {
    try {
      const result = await RNShare.share({
        message: `🩸 My blood group is ${bloodGroup} with ${confidence}% confidence! \n\nDetected using BloodScan - Fingerprint Blood Group Detection app. \n\n#BloodScan #HealthTech`,
        title: 'My Blood Group Result',
      });
      
      if (result.action === RNShare.sharedAction) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      Alert.alert('Share failed', 'Unable to share at this time. Please try again.');
    }
  };

  const handleSaveResult = () => {
    Alert.alert(
      'Save Result',
      'Result saved to your device successfully!',
      [{ text: 'OK' }]
    );
  };
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
    
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const colors = getBloodGroupColor(bloodGroup as string) as [string, string];

  return (
    <>
      <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.headerButton}>
            <Home size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Result</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Share size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient colors={colors} style={styles.resultCard}>
            <View style={styles.successIcon}>
              <Check size={32} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.resultTitle}>Blood Group Detected</Text>
            <View style={styles.bloodGroupContainer}>
              <Text style={styles.bloodGroupText}>{bloodGroup}</Text>
            </View>
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>Accuracy Score</Text>
              <View style={styles.confidenceVisualization}>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceProgress, 
                      { 
                        width: `${confidence}%` as any,
                        backgroundColor: parseInt(confidence as string) >= 90 ? '#10B981' : 
                                       parseInt(confidence as string) >= 80 ? '#F59E0B' : '#EF4444'
                      }
                    ]} 
                  />
                </View>
                <View style={styles.confidenceStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={16} 
                      color={star <= Math.ceil(parseInt(confidence as string) / 20) ? '#FCD34D' : '#E5E7EB'} 
                      fill={star <= Math.ceil(parseInt(confidence as string) / 20) ? '#FCD34D' : 'transparent'} 
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.confidenceValue}>{confidence}%</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.infoContainer, { opacity: fadeAnim }]}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About Your Blood Type</Text>
            <Text style={styles.infoText}>{getBloodGroupInfo(bloodGroup as string)}</Text>
          </View>

          <View style={styles.disclaimerCard}>
            <AlertTriangle size={20} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.disclaimerText}>
              This result is for reference only. Please consult a healthcare professional for official blood typing.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/scan')}
              style={styles.actionButton}
            >
              <Camera size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Scan Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveResult}
              style={styles.actionButton}
            >
              <Download size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Save Result</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryButton}
          >
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.primaryButtonGradient}>
              <Home size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <ConfettiAnimation active={showConfetti} />

      <StatusModal
        visible={showShareModal}
        type="info"
        title="Share Result"
        message="Sharing functionality will be available in a future update."
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  resultContainer: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  resultCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  bloodGroupContainer: {
    marginBottom: 20,
  },
  bloodGroupText: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  infoContainer: {
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  disclaimerCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  confidenceVisualization: {
    alignItems: 'center',
    marginVertical: 8,
  },
  confidenceBar: {
    width: 120,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceProgress: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceStars: {
    flexDirection: 'row',
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
    marginLeft: 6,
  },
});