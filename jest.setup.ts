// Silence the AsyncStorage warning in tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules that depend on native asset registry
jest.mock('expo-asset', () => ({
  Asset: { fromModule: jest.fn(() => ({ downloadAsync: jest.fn() })) },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
  useFonts: jest.fn(() => [true, null]),
}));

// Mock @expo/vector-icons — just return string component names
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Feather: 'Feather',
  AntDesign: 'AntDesign',
  FontAwesome: 'FontAwesome',
}));

// Mock react-native-reanimated — Animated.View / entering / exiting props are
// no-ops in tests; the real module requires react-native-worklets native bindings.
jest.mock('react-native-reanimated', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: {
      ...RN.Animated,
      // Animated.View that accepts (and ignores) entering/exiting props
      View: ({ children, entering: _e, exiting: _x, ...rest }: Record<string, unknown>) =>
        RN.createElement(RN.View, rest, children),
    },
    // Animatable component factory — just forward to base RN component
    createAnimatedComponent: (C: unknown) => C,
    // Easing re-exports
    Easing: RN.Easing,
    // Animation builders used in HabitCard / TaskItem
    FadeInDown: { duration: () => ({ springify: () => undefined }) },
    FadeOutLeft: { duration: () => undefined },
    FadeIn: { duration: () => ({ springify: () => undefined }) },
    FadeOut: { duration: () => undefined },
    // Commonly used hooks
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    runOnJS: (fn: (...a: unknown[]) => unknown) => fn,
  };
});
