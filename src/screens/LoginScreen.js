import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store';
import { useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.logo}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoText}>N</Text>
          </LinearGradient>
          
          <Text style={[styles.title, { color: theme.text }]}>
            Welcome to Numo
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Track your finances with ease
          </Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, theme.shadow]}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={[styles.link, { color: theme.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: '#FFF',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  input: {
    height: 56,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    borderWidth: 1,
  },
  button: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: fontSize.sm,
  },
  link: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});