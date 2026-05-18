import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Bulletproof Mock Fallback Auth to prevent synchronous bundle evaluation crashes
const mockAuth = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  signUp: async () => ({ data: { user: null }, error: new Error('Supabase client is not fully configured on this machine.') }),
  signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase client is not fully configured on this machine.') }),
  verifyOtp: async () => ({ data: { user: null }, error: new Error('Supabase client is not fully configured on this machine.') }),
  resend: async () => ({ error: new Error('Supabase client is not fully configured on this machine.') }),
  signOut: async () => {},
};

let supabaseInstance = { auth: mockAuth };

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('WARNING: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables are missing on the client. Falling back to secure mock safety interfaces.');
  }
} catch (err) {
  console.error('Supabase client failed to initialize gracefully:', err);
}

export const supabase = supabaseInstance;
