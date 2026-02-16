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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store';
import { useThemeStore } from '../store';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp, setUser } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  // Commented out sign-up logic for now
  // const handleSignUp = async () => {
  //   if (!email || !password || !confirmPassword) {
  //     Alert.alert('Error', 'Please fill in all fields');
  //     return;
  //   }
  //   if (password !== confirmPassword) {
  //     Alert.alert('Error', 'Passwords do not match');
  //     return;
  //   }
  //   if (password.length < 6) {
  //     Alert.alert('Error', 'Password must be at least 6 characters');
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     await signUp(email, password);
  //     Alert.alert(
  //       'Success',
  //       'Account created successfully! Please log in to continue.',
  //       [
  //         { text: 'OK', onPress: () => navigation.navigate('Login') },
  //       ]
  //     );
  //   } catch (error) {
  //     Alert.alert('Error', error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Allow skipping sign-up
  const handleSkipSignUp = () => {
    // Set a dummy user with a valid UUID to simulate authentication
    setUser({ id: '00000000-0000-0000-0000-000000000000', email: 'guest@numo.app' });
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Start managing your finances today
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
                placeholder="Create a password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Confirm Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Confirm your password"
                placeholderTextColor={theme.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            
            {/* Commented out sign-up button */}
            {/*
            <TouchableOpacity
              style={[styles.button, theme.shadow]}
              onPress={handleSignUp}
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
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
            */}
            <TouchableOpacity
              style={[styles.button, theme.shadow, { marginTop: 16 }]}
              onPress={handleSkipSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Skip Sign-Up</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.link, { color: theme.primary }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
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
    textAlign: 'center',
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