module.exports = function (api) {
  api.cache(true);
  // Jest sets NODE_ENV=test; avoid api.env() which conflicts with api.cache(true)
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      [
        'babel-preset-expo',
        // babel-preset-expo v55 auto-injects react-native-reanimated/plugin when
        // the package is present. Disable it in test env since the plugin needs
        // react-native-worklets/plugin which is a native peer dep, not installed.
        isTest ? { reanimated: false } : {},
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        },
      ],
      // Also skip the explicit plugin in test env (preset would add it anyway)
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
    ],
  };
};
