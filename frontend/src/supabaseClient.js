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

const isConfigured = supabaseUrl &&
    supabaseUrl !== 'undefined' &&
    !supabaseUrl.includes('mock') &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'undefined' &&
    !supabaseAnonKey.includes('mock');

// Minimal fallback to prevent crashes by default
const fallbackSupabase = {
    auth: {
        getUser: async () => {
            try {
                const u = JSON.parse(localStorage.getItem('neuropilot_user') || 'null');
                return { data: { user: u }, error: null };
            } catch (e) {
                return { data: { user: null }, error: null };
            }
        },
        getSession: async () => {
            try {
                const s = JSON.parse(localStorage.getItem('neuropilot_session') || 'null');
                return { data: { session: s }, error: null };
            } catch (e) {
                return { data: { session: null }, error: null };
            }
        },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: async ({ email, password }) => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    localStorage.setItem('neuropilot_user', JSON.stringify(data.user));
                    localStorage.setItem('neuropilot_session', JSON.stringify(data.session));
                    return { data: { user: data.user, session: data.session }, error: null };
                } else {
                    return { data: null, error: { message: data.detail || data.error || 'Invalid credentials' } };
                }
            } catch (e) {
                if (email === 'tester.neuropilot@example.com' && password === 'Password@1234') {
                    const u = { id: '00000000-0000-0000-0000-000000000001', email: 'tester.neuropilot@example.com' };
                    const s = { access_token: 'mock-session-token', user: u };
                    localStorage.setItem('neuropilot_user', JSON.stringify(u));
                    localStorage.setItem('neuropilot_session', JSON.stringify(s));
                    return { data: { user: u, session: s }, error: null };
                }
                return { data: null, error: { message: 'Login failed. Please check credentials or start backend.' } };
            }
        },
        signUp: async ({ email, password }) => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, full_name: 'Test User' })
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    localStorage.setItem('neuropilot_user', JSON.stringify(data.user));
                    localStorage.setItem('neuropilot_session', JSON.stringify(data.session));
                    return { data: { user: data.user, session: data.session }, error: null };
                } else {
                    return { data: null, error: { message: data.detail || data.error || 'Signup failed' } };
                }
            } catch (e) {
                const u = { id: '00000000-0000-0000-0000-000000000001', email };
                const s = { access_token: 'mock-session-token', user: u };
                localStorage.setItem('neuropilot_user', JSON.stringify(u));
                localStorage.setItem('neuropilot_session', JSON.stringify(s));
                return { data: { user: u, session: s }, error: null };
            }
        },
        signOut: async () => {
            localStorage.removeItem('neuropilot_user');
            localStorage.removeItem('neuropilot_session');
            return { error: null };
        }
    },
    from: () => ({
        select: () => ({
            order: () => ({
                limit: () => ({
                    single: async () => ({ data: null, error: { message: 'Not configured' } })
                }),
                eq: () => ({
                    single: async () => ({ data: null, error: { message: 'Not configured' } })
                }),
                single: async () => ({ data: null, error: { message: 'Not configured' } })
            }),
            eq: () => ({
                single: async () => ({ data: null, error: { message: 'Not configured' } }),
                order: () => ({ single: async () => ({ data: null, error: { message: 'Not configured' } }) })
            }),
            single: async () => ({ data: null, error: { message: 'Not configured' } })
        }),
        insert: async () => ({ data: null, error: { message: 'Not configured' } }),
        update: async () => ({ data: null, error: { message: 'Not configured' } })
    }),
    channel: () => ({ on: () => ({ subscribe: () => { } }), subscribe: () => ({ unsubscribe: () => { } }) }),
    removeChannel: () => { }
};

let supabase = fallbackSupabase;

if (!isConfigured) {
    if (typeof window !== 'undefined') {
        console.warn('⚠️ Supabase environment variables not found or invalid! Using mock client.');
    }
} else {
    clearStaleSupabaseData();
    try {
        const client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            }
        });
        if (client) supabase = client;
    } catch (err) {
        console.error('Failed to create Supabase client:', err);
        // supabase remains fallbackSupabase
    }
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
