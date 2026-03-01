# Habits Pioneer — Roadmap técnico

> Auditoría realizada por staff engineer. Plan de 5 sprints para llevar el proyecto a producción con calidad y escalabilidad.

---

## Estado actual (post Sprint 1)

- ✅ ESLint v9 flat config + Prettier + Husky + lint-staged
- ✅ Dead deps removidos (`react-native-swipeable-item`, `@gorhom/bottom-sheet`)
- ✅ `Crypto.randomUUID()` vía `expo-crypto` (reemplazó `Math.random()`)
- ✅ Todos los imports migrados a alias `@/`
- ✅ Cero `any` explícitos en toda la codebase
- ✅ `RootTabParamList` + `BottomTabBarProps` tipados en navigator
- ✅ `AppTheme` compatible con dark/light themes
- ✅ `Typography` exportado desde `@/theme`
- ✅ `i18n compatibilityJSON v4`
- ✅ **0 errores TS · 0 errores ESLint**

---

## Sprint 2 — Arquitectura de store y separación de concerns ✅ COMPLETADO

**Objetivo:** Romper el god-store monolítico, separar lógica de negocio de las pantallas.

### Tareas

- ✅ **`src/store/types.ts`** — Interfaces centralizadas (`HabitsSlice`, `TasksSlice`, `GoalsSlice`, `ShoppingSlice`, `SettingsSlice`, `StatsSlice`) + `type Store = intersection`. Evita dependencias circulares.
- ✅ **Slices independientes** — `src/store/slices/`:
  - `habitsSlice.ts` — habits[], history[], CRUD, `toggleHabitForDate`, `isHabitDoneOnDate`
  - `tasksSlice.ts` — tasks[], CRUD, `toggleTask`
  - `goalsSlice.ts` — weeklyGoals[], CRUD, `logGoalCompletion`, cálculo `weekStart`
  - `shoppingSlice.ts` — shoppingList[], CRUD, `toggleShoppingItem`
  - `settingsSlice.ts` — language, themeMode, setters
  - `statsSlice.ts` — `getProgressForDate(date)` lee habits/tasks/history via `get()`
  - `index.ts` — barrel re-export
- ✅ **`src/store/index.ts`** reescrito como thin combiner: `create<Store>()(persist((...a) => ({...slice1(...a), ...})))` con `StateCreator<Store, [], [], SliceType>`
- ✅ **Custom hooks por dominio** — `src/hooks/`:
  - `useHabits(selectedDate)` — habits por frecuencia, `isHabitDone`, `completedDates`, CRUD, `toggleHabit`
  - `useTasks(selectedDate)` — `tasksForDate`, conteos, `addTask(title, priority)`, CRUD
  - `useGoals()` — weeklyGoals + CRUD completo
  - `useShopping()` — lista + `grouped` por categoría, conteos, CRUD
  - `useProgress(selectedDate)` — `{habits, tasks, total}` como porcentajes, respeta frecuencia
  - `useHistory()` — `pctForDate`, `dataForDays(n)`, `totalCompleted`, `currentStreak`, `longestStreak`
  - `index.ts` — barrel
- ✅ **Barrel exports** — `index.ts` en cada subcarpeta de `src/components/` (common, habits, tasks, goals, shopping) + `src/hooks/`
- ✅ **Screens refactorizadas** — Solo llaman hooks, renderizan JSX, manejan UI local:
  - `TodayScreen` → `useHabits + useTasks + useProgress`
  - `GoalsScreen` → `useGoals`
  - `ShoppingScreen` → `useShopping`
  - `HistoryScreen` → `useHistory`
- ✅ **0 errores TS · 0 errores ESLint**

---

## Sprint 3 — Testing

**Objetivo:** Cobertura de tests en capas críticas.

### Setup

- [ ] Instalar Jest + Testing Library:
  ```bash
  npx expo install jest-expo @testing-library/react-native @testing-library/jest-native
  npm install --save-dev @types/jest
  ```
- [ ] Configurar `jest.config.js` con `jest-expo` preset
- [ ] Agregar script `"test": "jest"` y `"test:watch": "jest --watch"` en `package.json`

### Tests a escribir

- [ ] **Store slices (unit)** — Cada acción del store:
  - `addHabit`, `editHabit`, `removeHabit`, `toggleHabitToday`
  - `addTask`, `toggleTask`, `getTasksForToday`
  - `getTodayProgress` — casos edge (sin hábitos, 100%, 0%)
  - `seedStore` — verifica que puebla correctamente

- [ ] **Custom hooks (unit)** — Con `renderHook`:
  - `useProgress` — retorna porcentajes correctos
  - `useHistory` — streak y stats correctos

- [ ] **Componentes clave (integration)**:
  - `HabitItem` — render, toggle, swipe delete, swipe edit
  - `TaskItem` — render, toggle, prioridad visual
  - `EditModal` — render por tipo, submit con datos correctos, cierre

- [ ] **Screens smoke tests** — Que rendericen sin crashear:
  - `TodayScreen`, `GoalsScreen`, `ShoppingScreen`, `HistoryScreen`

---

## Sprint 4 — UX y polish visual

**Objetivo:** Pulir la experiencia para que se sienta producción.

### Tareas

- [ ] **Error Boundaries** — Envolver cada screen con un `ErrorBoundary`:
  ```tsx
  // src/components/common/ErrorBoundary.tsx
  class ErrorBoundary extends React.Component { ... }
  ```

- [ ] **Loading states** — Skeleton loaders en listas vacías mientras hydrata el store

- [ ] **Haptics consistentes** — Auditar todos los `Haptics.impactAsync()` para que sean coherentes:
  - Light: toggle check
  - Medium: swipe action
  - Heavy: eliminar ítem

- [ ] **Animaciones de lista** — `Animated.FlatList` con `entering/exiting` para items (Reanimated ya instalado)

- [ ] **HabitCard emoji bug** — El prop `emoji` de `HabitCard` actualmente se ignora; conectar al `Habit` model o eliminarlo del componente

- [ ] **Accesibilidad** — Agregar `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` en botones y toggles principales

- [ ] **i18n fechas** — Usar `date-fns/locale` para formatear fechas según idioma seleccionado:
  ```ts
  import { es, enUS, ptBR } from 'date-fns/locale';
  ```

---

## Sprint 5 — Infraestructura de build y distribución

**Objetivo:** CI/CD listo para TestFlight y Google Play Internal Testing.

### Tareas

- [ ] **EAS Build** — Configurar `eas.json`:
  ```json
  {
    "build": {
      "development": { "developmentClient": true },
      "preview": { "distribution": "internal" },
      "production": {}
    }
  }
  ```

- [ ] **GitHub Actions CI** — `.github/workflows/ci.yml`:
  - Trigger: PR → `main`
  - Steps: `npm ci` → `typecheck` → `lint` → `test`

- [ ] **GitHub Actions CD** — `.github/workflows/deploy.yml`:
  - Trigger: push → `main`
  - Steps: EAS Build preview → EAS Submit

- [ ] **Versioning automático** — `standard-version` o `changesets` para CHANGELOG + tags

- [ ] **Sentry** — `@sentry/react-native` para crash reporting en producción

- [ ] **Analytics** — Considerar Mixpanel o PostHog para entender uso real

---

## Deuda técnica conocida (backlog)

| Severidad | Item | Archivo |
|-----------|------|---------|
| 🔴 | `uuid` del store era `Math.random()` → ya corregido | `store/index.ts` |
| 🟠 | `react-native-uuid` todavía en `package.json` (instalado pero no usado) | `package.json` |
| 🟠 | `ProgressRing` y `SplashScreen` tienen warnings de `exhaustive-deps` en useEffect de animación | varios |
| 🟡 | `HistoryScreen` computa todo inline en el render (getDays, dataPoints, streaks) → mover a `useHistory` hook | `HistoryScreen.tsx` |
| 🟡 | `WeekStrip` no tiene tests ni tipos para el prop `selectedDate` | `WeekStrip.tsx` |
| 🟡 | `seed.ts` usa fechas hardcodeadas que caducan | `store/seed.ts` |
| 🟢 | `ThemedText` usa `Colors` (= DarkTheme) hardcodeado en lugar del tema activo | `ThemedText.tsx` |

---

## Arquitectura objetivo (post Sprint 2)

```
src/
├── components/
│   ├── common/          ← UI atómica reutilizable
│   ├── habits/
│   ├── tasks/
│   ├── goals/
│   └── shopping/
├── hooks/               ← lógica de negocio, 1 hook por dominio
├── screens/             ← solo layout + JSX + estado UI local
├── store/
│   ├── slices/          ← 1 slice por dominio
│   └── index.ts         ← combina slices + export StoreState
├── context/             ← ThemeContext (y futuros)
├── i18n/
├── theme/
└── types/
```

---

## Comandos útiles

```bash
# Verificar tipos
npm run typecheck

# Lint
npm run lint
npm run lint:fix

# Format
npm run format

# Tests (post Sprint 3)
npm test

# Build preview (post Sprint 5)
eas build --profile preview --platform all
```
