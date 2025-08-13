/**
 * Firebase Configuration for BloodScan
 * Production-ready Firebase setup with authentication and Firestore
 */

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, Analytics, logEvent } from 'firebase/analytics';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Try to import React Native persistence
let getReactNativePersistence: any = null;
try {
  const authImports = require('firebase/auth');
  getReactNativePersistence = authImports.getReactNativePersistence;
} catch (error) {
  console.log('getReactNativePersistence not available, using fallback');
}

// Firebase configuration - Your actual project config
const firebaseConfig = {
  apiKey: "AIzaSyAzCNp73qi6gFbtb37iVCHYiTCP53ZdPyk",
  authDomain: "bloodscan-production.firebaseapp.com",
  projectId: "bloodscan-production",
  storageBucket: "bloodscan-production.firebasestorage.app",
  messagingSenderId: "913273310010",
  appId: "1:913273310010:web:b4ed81eecd43c00eff9e03",
  measurementId: "G-MRGH650D4H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth 
let auth: Auth;
if (Platform.OS !== 'web') {
  // For React Native, use initializeAuth with AsyncStorage persistence
  if (getReactNativePersistence) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } else {
    // Fallback to getAuth if persistence helper is not available
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Initialize Analytics (only on web platform)
let analytics: Analytics | null = null;
if (Platform.OS === 'web') {
  analytics = getAnalytics(app);
}

// Connect to emulator in development
if (__DEV__ && Platform.OS !== 'web') {
  // Uncomment for local Firebase emulator
  // connectFirestoreEmulator(firestore, 'localhost', 8080);
}

export { app, auth, firestore, storage, analytics };

// Auth helper functions
export const getCurrentUser = () => auth.currentUser;

export const getUserToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

export const isUserAuthenticated = () => {
  return auth.currentUser !== null;
};

// Analytics helper functions
export const logAnalyticsEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (analytics && Platform.OS === 'web') {
    logEvent(analytics, eventName, parameters);
  }
};
