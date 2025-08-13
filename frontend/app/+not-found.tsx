import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <LinearGradient colors={['#F8FAFC', '#EFF6FF']} style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={64} color="#DC2626" strokeWidth={2} />
          </View>
          
          <Text style={styles.title}>Oops! Page Not Found</Text>
          <Text style={styles.description}>
            The page you're looking for doesn't exist or has been moved.
          </Text>
          
          <View style={styles.actions}>
            <Link href="/" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.buttonGradient}>
                  <Home size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>Go Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Link>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => window.location.reload()}
            >
              <RefreshCw size={20} color="#6B7280" strokeWidth={2} />
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.footer}>
            If you continue to experience issues, please contact support.
          </Text>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  footer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
