import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint } from 'lucide-react-native';
import { formatDate } from '../utils/bloodGroupUtils';

interface BloodGroupCardProps {
  bloodGroup: string;
  confidence: number;
  date: Date;
  imageUri?: string;
  onPress?: () => void;
}

export default function BloodGroupCard({ bloodGroup, confidence, date, imageUri, onPress }: BloodGroupCardProps) {
  const getBloodGroupColor = (bg: string) => {
    const colors: { [key: string]: string[] } = {
      'A+': ['#DC2626', '#EF4444'], 'A-': ['#EF4444', '#F87171'],
      'B+': ['#2563EB', '#3B82F6'], 'B-': ['#3B82F6', '#60A5FA'],
      'O+': ['#059669', '#10B981'], 'O-': ['#10B981', '#34D399'],
      'AB+': ['#7C3AED', '#8B5CF6'], 'AB-': ['#8B5CF6', '#A78BFA'],
    };
    return colors[bg] || ['#6B7280', '#9CA3AF'];
  };

  const colors = getBloodGroupColor(bloodGroup);

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.card}>
        {/* Image thumbnail or fingerprint icon */}
        <View style={styles.thumbnailContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Fingerprint size={24} color="#6B7280" strokeWidth={1.5} />
            </View>
          )}
        </View>
        
        <LinearGradient colors={colors as [string, string]} style={styles.bloodGroupBadge}>
          <Text style={styles.bloodGroupText}>{bloodGroup}</Text>
        </LinearGradient>
        
        <View style={styles.details}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          <Text style={styles.confidenceText}>{confidence}% confidence</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bloodGroupBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bloodGroupText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  details: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  placeholderThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});