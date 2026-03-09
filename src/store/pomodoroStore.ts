/**
 * pomodoroStore.ts
 * Standalone Zustand store for the Pomodoro Timer feature.
 * Kept separate from the main slice-based store because it manages
 * a long-running interval and session history independently.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import i18n from '@/i18n';
import { useStore } from './index';
import type { PomodoroMode, PomodoroStatus, PomodoroSession, PomodoroSettings } from '@/types';

// ── Default values ────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreak: false,
    soundEnabled: false,
};

// ── Colour palette (Focused Zen) ──────────────────────────────────────────────

export const POMODORO_COLORS = {
    work: '#7C3AED',
    shortBreak: '#10B981',
    longBreak: '#3B82F6',
} as const;

export const MOTIVATIONAL_MESSAGES = [
    '¡Sesión completada! Sos imparable 🔥',
    '¡Excelente foco! Descansá un momento 🌿',
    '¡Un paso más cerca de tus objetivos! 💜',
    '¡Así se hace! La constancia es tu superpoder 🚀',
    '¡Fantástico! Cada pomodoro cuenta 🍅',
    '¡Lo lograste! Ahora a recargar energías ⚡',
];

// ── Store interface ───────────────────────────────────────────────────────────

interface PomodoroStore {
    // Persisted state
    settings: PomodoroSettings;
    sessions: PomodoroSession[];

    // Ephemeral state (not persisted, reset on mount)
    currentMode: PomodoroMode;
    status: PomodoroStatus;
    secondsRemaining: number;
    sessionCount: number; // sessions completed in current cycle (resets after longBreak)
    linkedTaskId: string | null;
    isModalOpen: boolean;

    // Actions
    openModal: () => void;
    closeModal: () => void;
    startTimer: (mode?: PomodoroMode) => void;
    pauseTimer: () => void;
    resumeTimer: () => void;
    cancelTimer: () => void;
    completeSession: () => void;
    tick: () => void;
    linkTask: (taskId: string | null) => void;
    updateSettings: (settings: Partial<PomodoroSettings>) => void;

    // Selectors
    getTodaySessions: () => PomodoroSession[];
    getWeekSessions: () => PomodoroSession[];
    getTotalFocusMinutes: () => number;
    getAccentColor: () => string;
    getModeDurationSeconds: (mode: PomodoroMode) => number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePomodoroStore = create<PomodoroStore>()(
    persist(
        (set, get) => ({
            // Persisted
            settings: DEFAULT_SETTINGS,
            sessions: [],

            // Ephemeral (initial values)
            currentMode: 'work',
            status: 'idle',
            secondsRemaining: DEFAULT_SETTINGS.workDuration * 60,
            sessionCount: 0,
            linkedTaskId: null,
            isModalOpen: false,

            // ── Modal ──────────────────────────────────────────────────────
            openModal: () => set({ isModalOpen: true }),
            closeModal: () => set({ isModalOpen: false }),

            // ── Timer controls ─────────────────────────────────────────────
            startTimer: (mode) => {
                const { settings, sessionCount } = get();
                const targetMode = mode ?? 'work';
                const seconds = get().getModeDurationSeconds(targetMode);

                // (LiveActivity removed)

                set({
                    currentMode: targetMode,
                    status: 'running',
                    secondsRemaining: seconds,
                    sessionCount: targetMode === 'work' ? sessionCount : sessionCount,
                });
            },

            pauseTimer: () => {
                const { status } = get();
                if (status === 'running') {
                    set({ status: 'paused' });
                }
            },

            resumeTimer: () => {
                if (get().status === 'paused') {
                    set({ status: 'running' });
                }
            },

            cancelTimer: () => {
                const { settings } = get();
                // (LiveActivity removed)
                set({
                    status: 'idle',
                    currentMode: 'work',
                    secondsRemaining: settings.workDuration * 60,
                    linkedTaskId: null,
                });
            },

            completeSession: async () => {
                const { currentMode, settings, sessions, sessionCount, linkedTaskId } = get();
                LiveActivityService.stop();

                // 1. Record the session
                const durationSeconds = get().getModeDurationSeconds(currentMode);
                const newSession: PomodoroSession = {
                    id: Crypto.randomUUID(),
                    mode: currentMode,
                    linkedTaskId: linkedTaskId ?? undefined,
                    durationSeconds,
                    completedAt: new Date().toISOString(),
                };

                // 2. Determine next session count
                const newSessionCount = currentMode === 'work' ? sessionCount + 1 : sessionCount;

                // 3. Determine next suggested mode
                let nextMode: PomodoroMode = 'work';
                if (currentMode === 'work') {
                    nextMode =
                        newSessionCount % settings.sessionsUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';
                }

                // 4. Fire Notifications & Haptics
                try {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (err) {
                    console.error('Pomodoro haptics failed', err);
                }

                // 5. Auto-complete linked task
                if (currentMode === 'work' && linkedTaskId) {
                    useStore.getState().toggleTask(linkedTaskId);
                }

                set({
                    sessions: [...sessions, newSession],
                    status: 'completed',
                    sessionCount: newSessionCount,
                    // Pre-fill next mode seconds so FAB ring shows 100%
                    secondsRemaining: get().getModeDurationSeconds(nextMode),
                    currentMode: nextMode,
                });
            },

            // Called every second by PomodoroProvider's setInterval
            tick: () => {
                const { status, secondsRemaining } = get();
                if (status !== 'running') return;
                if (secondsRemaining <= 1) {
                    get().completeSession();
                } else {
                    set({ secondsRemaining: secondsRemaining - 1 });
                }
            },

            linkTask: (taskId) => set({ linkedTaskId: taskId }),

            updateSettings: (partial) => {
                const newSettings = { ...get().settings, ...partial };
                set({
                    settings: newSettings,
                    // Also reset timer duration if idle
                    ...(get().status === 'idle' && {
                        secondsRemaining: newSettings.workDuration * 60,
                    }),
                });
            },

            // ── Selectors ──────────────────────────────────────────────────
            getTodaySessions: () => {
                const today = new Date().toDateString();
                return get().sessions.filter(
                    (s) => new Date(s.completedAt).toDateString() === today,
                );
            },

            getWeekSessions: () => {
                const now = new Date();
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                return get().sessions.filter((s) => new Date(s.completedAt) >= weekStart);
            },

            getTotalFocusMinutes: () => {
                return Math.round(
                    get()
                        .sessions.filter((s) => s.mode === 'work')
                        .reduce((acc, s) => acc + s.durationSeconds, 0) / 60,
                );
            },

            getAccentColor: () => POMODORO_COLORS[get().currentMode],

            getModeDurationSeconds: (mode: PomodoroMode) => {
                const { settings } = get();
                if (mode === 'work') return settings.workDuration * 60;
                if (mode === 'shortBreak') return settings.shortBreakDuration * 60;
                return settings.longBreakDuration * 60;
            },
        }),
        {
            name: 'pomodoro-store-v1',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist settings and sessions — ephemeral timer state resets on launch
            partialize: (state) => ({
                settings: state.settings,
                sessions: state.sessions,
            }),
        },
    ),
);
