import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Search, Filter, Calendar, TrendingUp, X } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import BloodGroupCard from './BloodGroupCard';

interface HistorySearchProps {
  onFilter: (filtered: any[]) => void;
}

export default function HistorySearch({ onFilter }: HistorySearchProps) {
  const { predictions } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'bloodGroup'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const applyFilters = () => {
    let filtered = [...predictions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.confidence.toString().includes(searchQuery)
      );
    }

    // Blood group filter
    if (selectedBloodGroup) {
      filtered = filtered.filter(p => p.bloodGroup === selectedBloodGroup);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'bloodGroup':
          comparison = a.bloodGroup.localeCompare(b.bloodGroup);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    onFilter(filtered);
  };

  React.useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedBloodGroup, sortBy, sortOrder, predictions]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBloodGroup('');
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by blood group or confidence..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#2563EB" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Blood Group Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Blood Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bloodGroupScroll}>
              <TouchableOpacity
                style={[
                  styles.bloodGroupChip,
                  selectedBloodGroup === '' && styles.bloodGroupChipActive
                ]}
                onPress={() => setSelectedBloodGroup('')}
              >
                <Text style={[
                  styles.bloodGroupChipText,
                  selectedBloodGroup === '' && styles.bloodGroupChipTextActive
                ]}>All</Text>
              </TouchableOpacity>
              {bloodGroups.map((group) => (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.bloodGroupChip,
                    selectedBloodGroup === group && styles.bloodGroupChipActive
                  ]}
                  onPress={() => setSelectedBloodGroup(group)}
                >
                  <Text style={[
                    styles.bloodGroupChipText,
                    selectedBloodGroup === group && styles.bloodGroupChipTextActive
                  ]}>{group}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'date', label: 'Date', icon: Calendar },
                { key: 'confidence', label: 'Confidence', icon: TrendingUp },
                { key: 'bloodGroup', label: 'Blood Group', icon: Filter },
              ].map(({ key, label, icon: Icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.sortOption,
                    sortBy === key && styles.sortOptionActive
                  ]}
                  onPress={() => setSortBy(key as any)}
                >
                  <Icon size={16} color={sortBy === key ? '#2563EB' : '#6B7280'} strokeWidth={2} />
                  <Text style={[
                    styles.sortOptionText,
                    sortBy === key && styles.sortOptionTextActive
                  ]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.sortOrder}>
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  sortOrder === 'desc' && styles.sortOrderButtonActive
                ]}
                onPress={() => setSortOrder('desc')}
              >
                <Text style={[
                  styles.sortOrderText,
                  sortOrder === 'desc' && styles.sortOrderTextActive
                ]}>Newest First</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  sortOrder === 'asc' && styles.sortOrderButtonActive
                ]}
                onPress={() => setSortOrder('asc')}
              >
                <Text style={[
                  styles.sortOrderText,
                  sortOrder === 'asc' && styles.sortOrderTextActive
                ]}>Oldest First</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    marginLeft: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersPanel: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  clearText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginBottom: 12,
  },
  bloodGroupScroll: {
    flexDirection: 'row',
  },
  bloodGroupChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  bloodGroupChipActive: {
    backgroundColor: '#2563EB',
  },
  bloodGroupChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  bloodGroupChipTextActive: {
    color: '#FFFFFF',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  sortOptionActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  sortOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 6,
  },
  sortOptionTextActive: {
    color: '#2563EB',
  },
  sortOrder: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOrderButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  sortOrderButtonActive: {
    backgroundColor: '#2563EB',
  },
  sortOrderText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  sortOrderTextActive: {
    color: '#FFFFFF',
  },
});
