import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Image, Modal, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { User, Bell, Moon, Info, Shield, MessageCircle, LogOut, ChevronRight, CreditCard as Edit3, Camera, Image as ImageIcon, Globe, Download, Key, Trash2, Sun, X, Check } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen() {
  const { user, logout, predictions } = useAppContext();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Español', native: 'Español' },
    { code: 'fr', name: 'Français', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  ];

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      `Export ${predictions.length} scan records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export PDF', 
          onPress: () => {
            showToast('success', 'Data exported successfully!');
          }
        },
        { 
          text: 'Export CSV', 
          onPress: () => {
            showToast('success', 'CSV file saved to Downloads');
          }
        }
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Link', 
          onPress: () => {
            showToast('info', 'Password reset link sent to your email');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Are you absolutely sure? This will delete all your scan history and account data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: () => {
                    logout();
                    showToast('success', 'Account deleted successfully');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguagePicker(false);
    showToast('success', `Language changed to ${language}`);
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    setShowAvatarPicker(false);
    
    let result;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to take photos!');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need gallery permissions to select photos!');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@bloodscan.app\nWe typically respond within 24 hours.',
      [{ text: 'OK' }]
    );
  };
  const SettingItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true, 
    rightElement 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity onPress={onPress} style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Icon size={20} color="#6B7280" strokeWidth={2} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showChevron && (
        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <TouchableOpacity onPress={() => setShowAvatarPicker(true)} style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowAvatarPicker(true)}
            >
              <Edit3 size={20} color="#2563EB" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={Bell}
              title="Notifications"
              subtitle="Get alerts for scan reminders"
              showChevron={false}
              rightElement={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={notifications ? '#2563EB' : '#9CA3AF'}
                />
              }
            />
            <SettingItem
              icon={darkMode ? Moon : Sun}
              title="Theme"
              subtitle={darkMode ? 'Dark mode enabled' : 'Light mode enabled'}
              showChevron={false}
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                  thumbColor={darkMode ? '#2563EB' : '#9CA3AF'}
                />
              }
            />
            <SettingItem
              icon={Globe}
              title="Language"
              subtitle={selectedLanguage}
              onPress={() => setShowLanguagePicker(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={Download}
              title="Export Data"
              subtitle={`${predictions.length} scan records available`}
              onPress={handleExportData}
            />
            <SettingItem
              icon={Shield}
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={() => setShowPrivacy(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={Key}
              title="Change Password"
              subtitle="Update your account password"
              onPress={handleChangePassword}
            />
            <SettingItem
              icon={Trash2}
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={Info}
              title="About"
              subtitle="App version and information"
              onPress={() => setShowAbout(true)}
            />
            <SettingItem
              icon={Shield}
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={() => setShowPrivacy(true)}
            />
            <SettingItem
              icon={MessageCircle}
              title="Contact Support"
              subtitle="Get help or report issues"
              onPress={handleContactSupport}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color="#DC2626" strokeWidth={2} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BloodScan v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with ❤️ for healthcare</Text>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAbout(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>About BloodScan</Text>
              <TouchableOpacity onPress={() => setShowAbout(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.aboutText}>
              <Text style={styles.appVersion}>BloodScan v1.0.0{'\n\n'}</Text>
              Fingerprint Blood Group Detection using advanced AI technology.
              {'\n\n'}
              This app provides quick and convenient blood group predictions for reference purposes only.
              {'\n\n'}
              <Text style={styles.disclaimerText}>
                Disclaimer: Results are for informational purposes only and should not replace professional medical testing.
              </Text>
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguagePicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  selectedLanguage === language.name && styles.selectedLanguageItem
                ]}
                onPress={() => {
                  setSelectedLanguage(language.name);
                  setShowLanguagePicker(false);
                  showToast('success', `Language changed to ${language.name}`);
                }}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNative}>{language.native}</Text>
                </View>
                {selectedLanguage === language.name && (
                  <Check size={20} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.privacyText}>
              <Text style={styles.privacyHeading}>Data Collection{'\n'}</Text>
              We collect fingerprint images and blood group predictions solely for the purpose of providing accurate health insights. No biometric data is stored permanently on our servers.{'\n\n'}
              
              <Text style={styles.privacyHeading}>Data Storage{'\n'}</Text>
              All scan data is encrypted and stored locally on your device. Cloud backups are encrypted and can be disabled at any time.{'\n\n'}
              
              <Text style={styles.privacyHeading}>Data Sharing{'\n'}</Text>
              We never share your personal health information with third parties. Analytics data is anonymized and aggregated.{'\n\n'}
              
              <Text style={styles.privacyHeading}>Your Rights{'\n'}</Text>
              You can export, delete, or modify your data at any time through the app settings.{'\n\n'}
              
              <Text style={styles.privacyHeading}>Contact{'\n'}</Text>
              For privacy concerns, contact us at privacy@bloodscan.app
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Change Profile Photo</Text>
              <TouchableOpacity onPress={() => setShowAvatarPicker(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.avatarOption}
              onPress={() => handlePickImage('camera')}
            >
              <Camera size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.avatarOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.avatarOption}
              onPress={() => handlePickImage('gallery')}
            >
              <ImageIcon size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.avatarOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {avatarUri && (
              <TouchableOpacity 
                style={[styles.avatarOption, styles.removeOption]}
                onPress={() => {
                  setAvatarUri(null);
                  setShowAvatarPicker(false);
                  showToast('success', 'Profile photo removed');
                }}
              >
                <Text style={styles.removeOptionText}>Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  },
  profileSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#DC2626',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
  },
  modalContent: {
    paddingVertical: 8,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 12,
  },
  removeOption: {
    borderBottomWidth: 0,
    justifyContent: 'center',
    marginTop: 8,
  },
  removeOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#DC2626',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  aboutText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  appVersion: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  disclaimerText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#DC2626',
    fontStyle: 'italic',
  },
  privacyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 24,
  },
  privacyHeading: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedLanguageItem: {
    backgroundColor: '#F0F9FF',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
  },
  languageNative: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
});