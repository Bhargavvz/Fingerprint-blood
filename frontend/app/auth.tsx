import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import Modal from '@/components/Modal';

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
  const { login } = useAppContext();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

    const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      login({
        uid: Date.now().toString(),
        id: Date.now().toString(),
        email: email,
        displayName: name || 'User',
        name: name || 'User'
      });
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Simulate forgot password API call
    setTimeout(() => {
      Alert.alert(
        'Reset Link Sent',
        'If an account with this email exists, you will receive a password reset link shortly.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
      setForgotEmail('');
    }, 1000);
  };

  const handleOAuthLogin = (provider: string) => {
    Alert.alert(
      `${provider} Login`,
      `This would normally redirect to ${provider} OAuth flow.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            login({
              uid: Date.now().toString(),
              id: Date.now().toString(),
              email: `user@${provider.toLowerCase()}.com`,
              displayName: 'OAuth User',
              name: 'OAuth User'
            });
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
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
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

            {/* OAuth Buttons */}
            <View style={styles.oauthContainer}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.oauthButtons}>
                <TouchableOpacity 
                  style={styles.oauthButton}
                  onPress={() => handleOAuthLogin('Google')}
                >
                  <Text style={styles.oauthButtonText}>Google</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.oauthButton}
                  onPress={() => handleOAuthLogin('Apple')}
                >
                  <Text style={styles.oauthButtonText}>Apple</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  oauthContainer: {
    marginTop: 30,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginHorizontal: 16,
  },
  oauthButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  oauthButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  oauthButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
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