/**
 * Supabase client configuration.
 *
 * SETUP REQUIRED:
 * 1. Create a project at https://supabase.com
 * 2. Copy your Project URL and anon key from Project Settings → API
 * 3. Replace the placeholder values below with your actual credentials
 *
 * GOOGLE OAUTH SETUP:
 * 1. In Supabase Dashboard → Authentication → Providers → Google:
 *    - Enable Google provider
 *    - Add your Google OAuth client ID and secret
 *    - Add redirect URL: https://<your-project>.supabase.co/auth/v1/callback
 * 2. In Google Cloud Console → APIs & Services → Credentials:
 *    - Create an OAuth 2.0 Client ID (type: Web application)
 *    - Add Authorized redirect URIs:
 *        https://<your-project>.supabase.co/auth/v1/callback
 *    - For iOS: also add the bundle ID scheme (com.yourname.habitspioneer://)
 *    - For Android: add the package name scheme (com.yourname.habitspioneer://)
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Replace these with your actual Supabase project credentials ─────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use AsyncStorage to persist the session across app restarts
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured =
  SUPABASE_URL !== 'https://your-project.supabase.co' &&
  SUPABASE_ANON_KEY !== 'your-anon-key';
