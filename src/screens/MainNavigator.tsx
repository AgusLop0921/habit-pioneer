import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import TodayScreen from './TodayScreen';
import GoalsScreen from './GoalsScreen';
import ShoppingScreen from './ShoppingScreen';
import HistoryScreen from './HistoryScreen';
import { Spacing } from '@/theme';
import type { RootTabParamList } from '@/types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const tabs = [
    { name: 'Today', icon: 'home-outline', iconActive: 'home', label: t('tabs.home') },
    {
      name: 'History',
      icon: 'bar-chart-outline',
      iconActive: 'bar-chart',
      label: t('tabs.history'),
    },
    { name: 'Goals', icon: 'trophy-outline', iconActive: 'trophy', label: t('tabs.goals') },
    { name: 'Shopping', icon: 'cart-outline', iconActive: 'cart', label: t('tabs.shopping') },
  ];

  return (
    // ✅ wrapper — mismo color que el bg de la pantalla
    <View style={[styles.wrapper, { backgroundColor: theme.bg }]}>
      <View style={[styles.pill, { backgroundColor: theme.surface }]}>
        {state.routes.map((route, i: number) => {
          const isFocused = state.index === i;
          const tab = tabs[i];
          return (
            <Pressable
              key={route.key}
              style={[styles.item, isFocused && { backgroundColor: theme.surface2 }]}
              onPress={() => navigation.navigate(route.name)}
            >
              <Ionicons
                name={
                  (isFocused ? tab.iconActive : tab.icon) as ComponentProps<typeof Ionicons>['name']
                }
                size={22}
                color={isFocused ? theme.accent : theme.textSecondary}
              />
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? theme.accent : theme.textSecondary },
                  isFocused && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainNavigator() {
  const { isDark, theme } = useTheme();

  // ✅ El background del navigator debe coincidir con theme.bg
  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.bg } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.bg } };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator tabBar={(p) => <PillTabBar {...p} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Shopping" component={ShoppingScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // ✅ SIN backgroundColor — transparente para que se vea el bg de la pantalla
    paddingHorizontal: Spacing.lg,
    paddingBottom: 28,
    paddingTop: 8,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 6,
    // Sombra sutil para que el pill se diferencie del fondo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    gap: 3,
  },
  label: { fontSize: 11, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
});
