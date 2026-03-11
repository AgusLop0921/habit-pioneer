/**
 * authStore.ts
 * Manages authentication state, sync mode, and migration status.
 * Separate from the main store so auth state is always available.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SyncMode = 'undecided' | 'local' | 'cloud';
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface AuthState {
  // Persisted
  mode: SyncMode;
  onboardingComplete: boolean;
  lastSyncAt: string | null;

  // Runtime (not persisted, restored on auth state change)
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  isMigrating: boolean;
  migrationProgress: number; // 0-1
}

interface AuthActions {
  // Onboarding
  chooseLocalMode: () => void;
  completeOnboarding: () => void;

  // Auth
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;

  // Sync state
  setSyncStatus: (status: SyncStatus, error?: string) => void;
  setLastSyncAt: (ts: string) => void;
  setMigrating: (migrating: boolean, progress?: number) => void;
}

type AuthStore = AuthState & AuthActions;

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── Persisted defaults ────────────────────────────────────────────────
      mode: 'undecided',
      onboardingComplete: false,
      lastSyncAt: null,

      // ── Runtime defaults ──────────────────────────────────────────────────
      user: null,
      session: null,
      isAuthenticated: false,
      syncStatus: 'idle',
      syncError: null,
      isMigrating: false,
      migrationProgress: 0,

      // ── Onboarding ────────────────────────────────────────────────────────

      chooseLocalMode: () => {
        set({ mode: 'local', onboardingComplete: true });
      },

      completeOnboarding: () => {
        set({ onboardingComplete: true });
      },

      // ── Auth ──────────────────────────────────────────────────────────────

      signInWithGoogle: async () => {
        if (!isSupabaseConfigured) {
          return { error: 'Supabase not configured. Add credentials to src/lib/supabase.ts' };
        }

        try {
          // Use a fixed redirect URL so it's always consistent with what's
          // registered in Supabase Dashboard → Authentication → Redirect URLs
          const redirectUrl = 'habits-pioneer://auth-callback';

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true,
            },
          });

          if (error) return { error: error.message };
          if (!data.url) return { error: 'No OAuth URL received' };

          // Open browser for OAuth flow — intercept when URL starts with our scheme
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
          );

          if (result.type !== 'success') {
            return { error: result.type === 'cancel' ? 'cancelled' : 'OAuth flow failed' };
          }

          // Extract tokens from callback URL
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1] ?? url.split('?')[1] ?? '');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (!accessToken || !refreshToken) {
            return { error: 'Could not extract tokens from callback' };
          }

          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });

          if (sessionError) return { error: sessionError.message };

          set({
            user: sessionData.user,
            session: sessionData.session,
            isAuthenticated: true,
            mode: 'cloud',
          });

          return {};
        } catch (e) {
          return { error: e instanceof Error ? e.message : 'Unknown error' };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          mode: 'local',
          lastSyncAt: null,
          syncStatus: 'idle',
          syncError: null,
        });
      },

      restoreSession: async () => {
        if (!isSupabaseConfigured) return;

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
            // Keep mode as 'cloud' if it was already set
            mode: get().mode === 'cloud' ? 'cloud' : get().mode,
          });
        }

        // Listen for auth state changes (token refresh, sign out from another device, etc.)
        // Only clear auth on explicit SIGNED_OUT — not on intermediate null events
        // that occur during token refresh cycles when the app resumes.
        supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession) {
            set({ user: newSession.user, session: newSession, isAuthenticated: true });
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, session: null, isAuthenticated: false });
          }
        });
      },

      // ── Sync state ────────────────────────────────────────────────────────

      setSyncStatus: (syncStatus, syncError = undefined) => {
        set({ syncStatus, syncError: syncError ?? null });
      },

      setLastSyncAt: (lastSyncAt) => {
        set({ lastSyncAt });
      },

      setMigrating: (isMigrating, migrationProgress = 0) => {
        set({ isMigrating, migrationProgress });
      },
    }),
    {
      name: 'habits-pioneer-auth-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields — runtime state is restored on app start
      partialize: (state) => ({
        mode: state.mode,
        onboardingComplete: state.onboardingComplete,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectIsCloudMode = (s: AuthStore) => s.mode === 'cloud' && s.isAuthenticated;
export const selectNeedsOnboarding = (s: AuthStore) => !s.onboardingComplete;
