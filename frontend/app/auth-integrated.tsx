import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User, Wifi, WifiOff } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Modal from '@/components/Modal';
import { authService } from '@/services/auth';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const { login, backendAvailable } = useAppContext();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!isLogin && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await authService.signIn({ email, password });
      } else {
        result = await authService.signUp({ email, password, name });
      }

      if (result.success && result.user) {
        await login(result.user);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Authentication Failed', result.error || 'An unknown error occurred');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(forgotEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const result = await authService.sendPasswordResetEmail(forgotEmail);
      
      if (result.success) {
        Alert.alert(
          'Reset Link Sent',
          'If an account with this email exists, you will receive a password reset link shortly.',
          [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
        );
        setForgotEmail('');
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    }
  };

  const handleDemoLogin = () => {
    Alert.alert(
      'Demo Mode',
      'This will log you in with a demo account. Your data will be stored locally only.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: async () => {
            const demoUser = {
              uid: 'demo-user-' + Date.now(),
              email: 'demo@bloodscan.app',
              displayName: 'Demo User',
              photoURL: null,
              emailVerified: true,
            };
            await login(demoUser);
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.logo}>
                <Text style={styles.logoText}>BS</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to continue your blood group detection journey' : 'Join us to start detecting your blood group'}
            </Text>
            
            {/* Backend Status Indicator */}
            <View style={styles.statusIndicator}>
              {backendAvailable ? (
                <>
                  <Wifi size={16} color="#10B981" />
                  <Text style={[styles.statusText, { color: '#10B981' }]}>Connected to AI Backend</Text>
                </>
              ) : (
                <>
                  <WifiOff size={16} color="#F59E0B" />
                  <Text style={[styles.statusText, { color: '#F59E0B' }]}>Demo Mode Available</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              style={styles.submitButton}
            >
              <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.submitGradient}>
                <Text style={styles.submitText}>
                  {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity 
                style={styles.forgotPassword}
                onPress={() => setShowForgotPassword(true)}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Demo Mode Button */}
            {!backendAvailable && (
              <TouchableOpacity 
                style={styles.demoButton}
                onPress={handleDemoLogin}
              >
                <Text style={styles.demoButtonText}>Try Demo Mode</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        title="Reset Password"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.submitButton}
          >
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.submitGradient}>
              <Text style={styles.submitText}>Send Reset Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563EB',
  },
  demoButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#D97706',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2563EB',
  },
  modalContent: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
});
