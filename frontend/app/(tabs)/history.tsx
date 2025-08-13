import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Clock, Fingerprint } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import BloodGroupCard from '@/components/BloodGroupCard';
import HistorySearch from '@/components/HistorySearch';
import { LoadingList } from '@/components/LoadingStates';

export default function HistoryScreen() {
  const { predictions } = useAppContext();
  const [filteredPredictions, setFilteredPredictions] = useState(predictions);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleFilter = (filtered: any[]) => {
    setFilteredPredictions(filtered);
  };

  React.useEffect(() => {
    setFilteredPredictions(predictions);
  }, [predictions]);

  if (refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>{predictions.length} total scans</Text>
        </View>
        <LoadingList count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>{predictions.length} total scans</Text>
      </View>

      {predictions.length > 0 && <HistorySearch onFilter={handleFilter} />}

      {predictions.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Clock size={48} color="#9CA3AF" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>Your scan history will appear here</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredPredictions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Fingerprint size={48} color="#9CA3AF" strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredPredictions.map((prediction) => (
                <BloodGroupCard
                  key={prediction.id}
                  bloodGroup={prediction.bloodGroup}
                  confidence={prediction.confidence}
                  date={prediction.date}
                  imageUri={prediction.imageUri}
                  onPress={() => router.push(`/result?bloodGroup=${prediction.bloodGroup}&confidence=${prediction.confidence}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  list: {
    padding: 24,
  },
});