/**
 * Authentication Service for BloodScan
 * Handles Firebase authentication with backend integration
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  AuthError,
  onAuthStateChanged,
  Unsubscribe
} from 'firebase/auth';
import { auth, getCurrentUser, getUserToken } from '../config/firebase';
import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  // Convert Firebase user to our auth user format
  private formatUser(firebaseUser: FirebaseUser): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  // Handle authentication errors
  private handleAuthError(error: AuthError): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return error.message || 'An authentication error occurred.';
    }
  }

  // Sign up with email and password
  async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      const { email, password, name } = data;
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, {
        displayName: name,
      });

      // Store user data locally
      const authUser = this.formatUser(firebaseUser);
      await this.storeUserData(authUser);

      // Test backend connection (optional - fail silently)
      try {
        await apiService.testAuthentication();
      } catch (error) {
        console.warn('Backend connection test failed during signup:', error);
      }

      return {
        success: true,
        user: authUser,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.handleAuthError(error as AuthError),
      };
    }
  }

  // Sign in with email and password
  async signIn(data: SignInData): Promise<AuthResult> {
    try {
      const { email, password } = data;
      
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Store user data locally
      const authUser = this.formatUser(firebaseUser);
      await this.storeUserData(authUser);

      // Test backend connection (optional - fail silently)
      try {
        await apiService.testAuthentication();
      } catch (error) {
        console.warn('Backend connection test failed during signin:', error);
      }

      return {
        success: true,
        user: authUser,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: this.handleAuthError(error as AuthError),
      };
    }
  }

  // Sign out
  async signOut(): Promise<AuthResult> {
    try {
      await signOut(auth);
      await this.clearUserData();
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: 'Failed to sign out. Please try again.',
      };
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    const firebaseUser = getCurrentUser();
    if (firebaseUser) {
      return this.formatUser(firebaseUser);
    }
    return null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return getCurrentUser() !== null;
  }

  // Get user token for API calls
  async getUserToken(): Promise<string | null> {
    return await getUserToken();
  }

  // Store user data locally
  private async storeUserData(user: AuthUser): Promise<void> {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('isAuthenticated', 'true');
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  // Clear local user data
  private async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['user', 'isAuthenticated', 'predictions']);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Load user data from storage (for app initialization)
  async loadStoredUser(): Promise<AuthUser | null> {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load stored user:', error);
    }
    return null;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const authUser = this.formatUser(firebaseUser);
        this.storeUserData(authUser);
        callback(authUser);
      } else {
        this.clearUserData();
        callback(null);
      }
    });
  }

  // Password reset
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.handleAuthError(error as AuthError),
      };
    }
  }

  // Update user profile
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<AuthResult> {
    try {
      const user = getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'No user is currently signed in.',
        };
      }

      await updateProfile(user, updates);
      
      const updatedUser = this.formatUser(user);
      await this.storeUserData(updatedUser);

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Failed to update profile. Please try again.',
      };
    }
  }
}

export const authService = new AuthService();
