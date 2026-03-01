# 🔥 Habits Pioneer

App de seguimiento de hábitos — React Native + Expo

## Stack
- React Native + Expo SDK 51
- TypeScript
- Zustand + AsyncStorage (persistencia offline)
- i18next (ES / EN / PT — detecta idioma del dispositivo)
- React Navigation (Bottom Tabs)
- react-native-reanimated

## Estructura

```
src/
  components/     # Componentes reutilizables
  screens/        # Pantallas (Splash, Motivational, Today, Goals, Shopping)
  store/          # Zustand store con persistencia
  i18n/           # Traducciones ES / EN / PT
  theme/          # Tokens de diseño (colores, espaciado, tipografía)
  types/          # Tipos TypeScript
```

## Correr en desarrollo

```bash
npx expo start
```

Luego escanear el QR con **Expo Go** (iOS/Android).

## Seed de datos de ejemplo

En `App.tsx`, descomentá estas líneas para cargar datos de prueba:

```tsx
import { seedStore } from './src/store/seed';
const store = useStore.getState();
if (__DEV__ && store.habits.length === 0) seedStore(store);
```

## Internacionalización

El idioma se detecta automáticamente del dispositivo.
Idiomas soportados: Español, Inglés, Portugués.

Para forzar un idioma:
```tsx
import i18n from './src/i18n';
i18n.changeLanguage('en');
```

# habit-pioneer
