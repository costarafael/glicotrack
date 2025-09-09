import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-icons';

import { useTheme } from '../context/ThemeContext';
import DailyLogScreen from '../screens/DailyLogScreen';
import MonthlyReportScreen from '../screens/MonthlyReportScreen';
import OptionsScreen from '../screens/OptionsScreen';
import SimpleRemindersScreen from '../screens/SimpleRemindersScreen';
import CompanionModeScreen from '../screens/CompanionModeScreen';
import AccompanimentScreen from '../screens/AccompanimentScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'DailyLog':
              iconName = 'today';
              break;
            case 'MonthlyReport':
              iconName = 'assessment';
              break;
            case 'Options':
              iconName = 'tune';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingTop: 8, // Increased top padding for better icon spacing
          paddingBottom: Math.max(insets.bottom, 12), // Dynamic bottom padding with minimum 12px
          height: 60 + Math.max(insets.bottom, 12), // Adjust height to accommodate bottom padding
        },
      })}
    >
      <Tab.Screen
        name="DailyLog"
        component={DailyLogScreen}
        options={{
          title: 'Registro Diário',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="MonthlyReport"
        component={MonthlyReportScreen}
        options={{
          title: 'Relatório Mensal',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Options"
        component={OptionsScreen}
        options={{
          title: 'Opções',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SimpleReminders"
            component={SimpleRemindersScreen}
            options={{
              title: 'Lembretes',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="CompanionMode"
            component={CompanionModeScreen}
            options={{
              title: 'Modo Acompanhamento',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="Accompaniment"
            component={AccompanimentScreen}
            options={{
              title: 'Acompanhamento',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen
            name="Account"
            component={AccountScreen}
            options={{
              title: 'Conta',
              headerBackTitleVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default AppNavigator;
