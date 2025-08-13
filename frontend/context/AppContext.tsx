import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiService, UserStatistics } from '../services/api';

export interface User {
  uid: string;
  id?: string;
  email: string | null;
  displayName: string | null;
  name?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

export interface Prediction {
  id: string;
  bloodGroup: string;
  confidence: number;
  date: Date;
  method?: string;
  imageUri?: string;
}

interface AppContextType {
  user: User | null;
  predictions: Prediction[];
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  userStats: UserStatistics | null;
  backendAvailable: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  addPrediction: (prediction: Prediction) => Promise<void>;
  clearPredictions: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  checkBackendStatus: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const onboardingData = await AsyncStorage.getItem('hasCompletedOnboarding');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
      
      if (onboardingData) {
        setHasCompletedOnboarding(JSON.parse(onboardingData));
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };
  const loadStoredData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const predictionsData = await AsyncStorage.getItem('predictions');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
      
      if (predictionsData) {
        const parsedPredictions = JSON.parse(predictionsData).map((p: any) => ({
          ...p,
          date: new Date(p.date),
        }));
        setPredictions(parsedPredictions);
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  };

  const login = async (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setPredictions([]);
    await AsyncStorage.multiRemove(['user', 'predictions']);
    router.replace('/auth');
  };

  const addPrediction = async (prediction: Prediction) => {
    const newPredictions = [prediction, ...predictions].slice(0, 50); // Keep only last 50
    setPredictions(newPredictions);
    
    const storePredictions = newPredictions.map(p => ({
      ...p,
      date: p.date.toISOString(),
    }));
    
    await AsyncStorage.setItem('predictions', JSON.stringify(storePredictions));
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem('hasCompletedOnboarding', JSON.stringify(true));
  };

  const clearPredictions = async () => {
    setPredictions([]);
    await AsyncStorage.removeItem('predictions');
  };

  const refreshUserData = async () => {
    if (user?.uid && backendAvailable) {
      try {
        const stats = await apiService.getUserStatistics();
        setUserStats(stats);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const checkBackendStatus = async () => {
    try {
      const isHealthy = await apiService.healthCheck();
      setBackendAvailable(isHealthy);
    } catch (error) {
      console.error('Backend not available:', error);
      setBackendAvailable(false);
    }
  };

  const value: AppContextType = {
    user,
    predictions,
    isAuthenticated,
    hasCompletedOnboarding,
    userStats,
    backendAvailable,
    login,
    logout,
    addPrediction,
    clearPredictions,
    checkAuthStatus,
    completeOnboarding,
    refreshUserData,
    checkBackendStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}