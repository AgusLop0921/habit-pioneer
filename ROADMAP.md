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

## Sprint 3 — Testing ✅

**Objetivo:** Cobertura de tests en capas críticas.

### Setup

- [x] Instalar `jest@29` + `jest-expo@55` + `@testing-library/react-native@13` + `@types/jest`
- [x] Configurar `jest.config.js` con `jest-expo` preset, `@/` alias mapper, `transformIgnorePatterns`
- [x] Configurar `jest.setup.ts` con mocks de AsyncStorage, expo-asset, expo-font, vector-icons
- [x] Agregar scripts `"test"`, `"test:watch"`, `"test:coverage"` en `package.json`
- [x] Modificar `babel.config.js` para deshabilitar reanimated plugin en test env

### Tests escritos — 58/58 ✅

- [x] **Store slices (unit)** — `makeStore()` factory sin persistencia:
  - `habitsSlice` — 12 tests: `addHabit`, `editHabit`, `removeHabit`, `toggleHabitForDate`, `isHabitDoneOnDate`
  - `tasksSlice` — 10 tests: `addTask`, `editTask`, `removeTask`, `toggleTask`, date filtering
  - `goalsSlice` — 9 tests: `addWeeklyGoal`, `editWeeklyGoal`, `removeWeeklyGoal`, `logGoalCompletion`

- [x] **Custom hooks (unit)** — Con `renderHook`:
  - `useProgress` — 0%/50%/100%, daily/weekly/monthly, tasks por fecha, total combinado
  - `useHistory` — `pctForDate`, `dataForDays`, `currentStreak`, `longestStreak` (fix de algoritmo incluido)

- [x] **Screens smoke tests** — Que rendericen sin crashear:
  - `TodayScreen`, `GoalsScreen`, `ShoppingScreen`, `HistoryScreen` — 6 tests

---

## Sprint 4 — UX y polish visual ✅

**Objetivo:** Pulir la experiencia para que se sienta producción.

### Tareas

- [x] **Error Boundaries** — `src/components/common/ErrorBoundary.tsx` — class component con fallback UI + botón Reintentar; envuelve `<App>` en `App.tsx`

- [x] **Loading states** — `useHydration` hook: retorna `true` cuando Zustand termina de rehidratar AsyncStorage; `TodayScreen` muestra `ActivityIndicator` mientras espera

- [x] **Haptics consistentes** — Auditados todos los `Haptics.impactAsync()`:
  - Light: toggle check (HabitCard, TaskItem)
  - Medium: swipe open + swipe edit (SwipeableRow)
  - Heavy: eliminar ítem (SwipeableRow)

- [x] **Animaciones de lista** — `FadeInDown.springify()` al montar + `FadeOutLeft` al desmontar items via `react-native-reanimated` en `HabitCard` y `TaskItem`; Reanimated mock en `jest.setup.ts`

- [x] **HabitCard emoji bug** — Campo `emoji?: string` agregado al tipo `Habit`; badge de HabitCard muestra emoji si existe, sino ícono de frecuencia; campo en formulario de creación/edición de hábitos

- [x] **Accesibilidad** — `accessibilityRole`, `accessibilityLabel`, `accessibilityState` en: `OrangeButton`, `CheckCircle`, `SwipeableRow` (botones edit/delete), `HabitCard` (ring + info), `TaskItem`, `WeekStrip` (días)

- [x] **i18n fechas** — `useDateLocale` hook (`src/hooks/useDateLocale.ts`): mapea `i18n.language` → `date-fns Locale` (es/enUS/ptBR); usado en `TodayScreen`, `HistoryScreen`, `WeekStrip` (EEEEE para letras de días)

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
