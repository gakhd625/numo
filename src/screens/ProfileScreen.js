import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useThemeStore, useTransactionStore } from '../store';
import { useSpendingLimitStore } from '../store/spendingLimitsStore';
import { lightTheme, darkTheme, spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuthStore();
  const { clearData } = useTransactionStore();
  const { isDark, toggleTheme } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  const [loggingOut, setLoggingOut] = useState(false);
  const { clearLimits } = useSpendingLimitStore();

  const handleLogout = () => {
    setLoggingOut(true);
    // Clear state first so UI switches to Login immediately (no reliance on Alert callback).
    signOut();
    clearData();
    clearLimits();
    setLoggingOut(false);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.profileIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.profileIconText}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </Text>
        </LinearGradient>
        
        <Text style={[styles.email, { color: theme.text }]}>
          {user?.email}
        </Text>
        <Text style={[styles.memberSince, { color: theme.textSecondary }]}>
          Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}
        </Text>
      </View>
      
      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Preferences
        </Text>
        
        <View
          style={[
            styles.settingCard,
            { backgroundColor: theme.surface },
            theme.shadow,
          ]}
        >
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: theme.primary + '20' },
                ]}
              >
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Dark Mode
                </Text>
                <Text
                  style={[styles.settingDescription, { color: theme.textSecondary }]}
                >
                  Toggle dark theme
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
            />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: spacing.sm }} />

          {/* Spending Limits */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('SpendingLimits')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: '#F59E0B20' },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color="#F59E0B"
                />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  Spending Limits
                </Text>
                <Text
                  style={[styles.settingDescription, { color: theme.textSecondary }]}
                >
                  Daily, weekly, monthly caps
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Account
        </Text>
        
        <TouchableOpacity
          style={[
            styles.actionCard,
            { backgroundColor: theme.surface },
            theme.shadow,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.actionLeft}>
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.expense + '20' },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={theme.expense}
              />
            </View>
            <Text style={[styles.actionTitle, { color: theme.text }]}>
              Logout
            </Text>
          </View>
          {loggingOut ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>
      
      {/* App Info */}
      <View style={styles.footer}>
        <Text style={[styles.appName, { color: theme.primary }]}>Numo</Text>
        <Text style={[styles.version, { color: theme.textSecondary }]}>
          Version 1.0.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  profileIconText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: '#FFF',
  },
  email: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  memberSince: {
    fontSize: fontSize.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  settingCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: fontSize.sm,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: spacing.xxl,
  },
  appName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: fontSize.sm,
  },
});