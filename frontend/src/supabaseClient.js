import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Clear any stale Supabase auth data from localStorage
const clearStaleSupabaseData = () => {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('sb-') && key.includes('-auth-token')) {
                localStorage.removeItem(key);
            }
        });
    } catch (e) {
        // localStorage may not be available
    }
};

// Check if Supabase URL is reachable
const checkSupabaseConnectivity = async () => {
    if (!supabaseUrl) return false;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${supabaseUrl}/auth/v1/`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeout);
        return res.ok || res.status === 400;
    } catch {
        return false;
    }
};

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Supabase environment variables not found! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    // Minimal fallback to prevent crashes
    supabase = {
        auth: {
            getUser: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env' } }),
            signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            signOut: async () => ({ error: null })
        },
        from: () => ({
            select: () => ({ order: () => ({ limit: () => ({ single: async () => ({ data: null, error: { message: 'Not configured' } }) }) }), eq: () => ({ single: async () => ({ data: null, error: { message: 'Not configured' } }) }) }),
            insert: async () => ({ data: null, error: { message: 'Not configured' } }),
            update: async () => ({ data: null, error: { message: 'Not configured' } })
        }),
        channel: () => ({ on: () => ({ subscribe: () => { } }) }),
        removeChannel: () => { }
    };
} else {
    clearStaleSupabaseData();
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        }
    });
}

// Check connectivity — informational only, does NOT swap client
export const enableAutoRefresh = async () => {
    const isReachable = await checkSupabaseConnectivity();
    if (!isReachable) {
        console.warn('⚠️ Supabase may be unreachable. Check your project at https://supabase.com/dashboard');
    }
    return isReachable;
};

export { supabase };
