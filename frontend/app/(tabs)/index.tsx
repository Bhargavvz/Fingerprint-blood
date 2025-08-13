import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint, Plus, Clock, TrendingUp, BarChart3, Heart, Settings, History, Camera, FileText } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import BloodGroupCard from '@/components/BloodGroupCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, predictions } = useAppContext();
  const recentPredictions = predictions.slice(0, 3);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Calculate statistics
  const totalScans = predictions.length;
  const avgAccuracy = totalScans > 0 ? Math.round(predictions.reduce((acc, p) => acc + p.confidence, 0) / totalScans) : 0;
  const mostCommonBloodGroup = totalScans > 0 ? 
    predictions.reduce((acc, p) => {
      acc[p.bloodGroup] = (acc[p.bloodGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) : {};
  const topBloodGroup = Object.keys(mostCommonBloodGroup).reduce((a, b) => 
    mostCommonBloodGroup[a] > mostCommonBloodGroup[b] ? a : b, Object.keys(mostCommonBloodGroup)[0] || 'N/A');

  // Health tips based on most common blood group
  const getHealthTip = (bloodGroup: string) => {
    const tips: { [key: string]: string } = {
      'A+': 'Type A blood may benefit from a plant-based diet rich in fruits and vegetables.',
      'A-': 'Type A individuals often do well with stress management and regular meditation.',
      'B+': 'Type B blood types may thrive on a varied diet with moderate dairy consumption.',
      'B-': 'Type B individuals often benefit from balanced exercise routines.',
      'O+': 'Type O blood types may do well with high-protein diets and regular exercise.',
      'O-': 'Universal donors should maintain iron levels and stay hydrated.',
      'AB+': 'Type AB blood types may benefit from a balanced diet with smaller, frequent meals.',
      'AB-': 'Type AB individuals often do well with a combination of A and B type recommendations.',
    };
    return tips[bloodGroup] || 'Maintain a balanced diet and regular exercise for optimal health.';
  };


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greeting}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{user?.name || 'User'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => router.push('/scan')}
          style={styles.scanButton}
        >
          <LinearGradient colors={['#059669', '#047857']} style={styles.scanGradient}>
            <View style={styles.scanContent}>
              <View style={styles.scanIcon}>
                <Fingerprint size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <View style={styles.scanText}>
                <Text style={styles.scanTitle}>Scan Fingerprint</Text>
                <Text style={styles.scanSubtitle}>Detect your blood group instantly</Text>
              </View>
              <Plus size={24} color="#FFFFFF" strokeWidth={2} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={20} color="#2563EB" strokeWidth={2} />
            </View>
            <Text style={styles.statNumber}>{totalScans}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={20} color="#059669" strokeWidth={2} />
            </View>
            <Text style={styles.statNumber}>{avgAccuracy}%</Text>
            <Text style={styles.statLabel}>Avg Accuracy</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <BarChart3 size={20} color="#DC2626" strokeWidth={2} />
            </View>
            <Text style={styles.statNumber}>{topBloodGroup}</Text>
            <Text style={styles.statLabel}>Most Common</Text>
          </View>
        </View>

        {/* Quick Actions Menu */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Camera size={24} color="#2563EB" strokeWidth={2} />
              <Text style={styles.quickActionText}>New Scan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/history')}
            >
              <History size={24} color="#059669" strokeWidth={2} />
              <Text style={styles.quickActionText}>History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Settings size={24} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {/* Add export functionality */}}
            >
              <FileText size={24} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.quickActionText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Tips Section */}
        {topBloodGroup !== 'N/A' && (
          <View style={styles.healthTipContainer}>
            <View style={styles.healthTipCard}>
              <View style={styles.healthTipHeader}>
                <Heart size={20} color="#EF4444" strokeWidth={2} />
                <Text style={styles.healthTipTitle}>Health Tip for {topBloodGroup}</Text>
              </View>
              <Text style={styles.healthTipText}>{getHealthTip(topBloodGroup)}</Text>
            </View>
          </View>
        )}

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Predictions</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentPredictions.length === 0 ? (
            <View style={styles.emptyState}>
              <Fingerprint size={48} color="#9CA3AF" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No predictions yet</Text>
              <Text style={styles.emptySubtitle}>Start by scanning your fingerprint</Text>
            </View>
          ) : (
            <View style={styles.predictionsList}>
              {recentPredictions.map((prediction) => (
                <BloodGroupCard
                  key={prediction.id}
                  bloodGroup={prediction.bloodGroup}
                  confidence={prediction.confidence}
                  date={prediction.date}
                  onPress={() => router.push(`/result?bloodGroup=${prediction.bloodGroup}&confidence=${prediction.confidence}`)}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  scanButton: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scanGradient: {
    padding: 20,
  },
  scanContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scanText: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#E5E7EB',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  recentSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  predictionsList: {
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginTop: 8,
  },
  healthTipContainer: {
    marginBottom: 30,
  },
  healthTipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  healthTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthTipTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  healthTipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});