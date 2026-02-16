import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import EditTransactionScreen from '../screens/EditTransactionScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingScreen from '../screens/LoadingScreen';

import { useAuthStore, useThemeStore } from '../store';
import { lightTheme, darkTheme } from '../config/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Categories') {
            iconName = focused ? 'pricetags' : 'pricetags-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStack() {
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'Add Transaction' }}
      />
      <Stack.Screen
        name="EditTransaction"
        component={EditTransactionScreen}
        options={{ title: 'Edit Transaction' }}
      />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = isDark ? darkTheme : lightTheme;
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.surface,
          text: theme.text,
          border: theme.border,
          notification: theme.primary,
        },
      }}
    >
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}