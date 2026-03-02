import React from 'react';
import type { ComponentProps } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import TodayScreen from './TodayScreen';
import GoalsScreen from './GoalsScreen';
import ShoppingScreen from './ShoppingScreen';
import HistoryScreen from './HistoryScreen';
import SleepScreen from './sleep/SleepScreen';
import { Spacing } from '../theme';

const Tab = createBottomTabNavigator();
const INDIGO = '#6366f1';

const TABS = [
  { name: 'Today', icon: 'home-outline', active: 'home', label: 'Home' },
  { name: 'Sleep', icon: 'moon-outline', active: 'moon', label: 'Sueño' },
  { name: 'History', icon: 'bar-chart-outline', active: 'bar-chart', label: 'Stats' },
  { name: 'Goals', icon: 'trophy-outline', active: 'trophy', label: 'Goals' },
  { name: 'Shopping', icon: 'cart-outline', active: 'cart', label: 'Lista' },
];

function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  return (
    <View style={[s.wrapper, { backgroundColor: theme.bg }]}>
      <View style={[s.pill, { backgroundColor: theme.surface }]}>
        {state.routes.map((route: { key: string; name: string }, i: number) => {
          const focused = state.index === i;
          const tab = TABS[i];
          const isSleep = tab.name === 'Sleep';
          const color = focused ? (isSleep ? INDIGO : theme.accent) : theme.textSecondary;
          return (
            <Pressable
              key={route.key}
              style={[
                s.item,
                focused && { backgroundColor: isSleep ? `${INDIGO}18` : theme.surface2 },
              ]}
              onPress={() => navigation.navigate(route.name)}
            >
              <Ionicons
                name={(focused ? tab.active : tab.icon) as ComponentProps<typeof Ionicons>['name']}
                size={21}
                color={color}
              />
              <Text style={[s.label, { color }, focused && s.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainNavigator() {
  const { isDark, theme } = useTheme();
  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.bg } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.bg } };
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator tabBar={(p) => <PillTabBar {...p} />} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Sleep" component={SleepScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Goals" component={GoalsScreen} />
        <Tab.Screen name="Shopping" component={ShoppingScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const s = StyleSheet.create({
  wrapper: { paddingHorizontal: Spacing.md, paddingBottom: 28, paddingTop: 8 },
  pill: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 5,
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
    paddingVertical: 9,
    borderRadius: 999,
    gap: 3,
  },
  label: { fontSize: 10, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
});
