import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a mock client for when environment variables are missing
const createMockClient = () => ({
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null })
    },
    from: () => ({
        select: () => ({
            order: () => ({
                limit: () => ({
                    single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
                })
            }),
            eq: () => ({
                single: async () => ({ data: null, error: { message: 'Supabase not configured' } })
            })
        }),
        insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: async () => ({ data: null, error: { message: 'Supabase not configured' } })
    }),
    channel: () => ({
        on: () => ({ subscribe: () => { } })
    }),
    removeChannel: () => { }
});

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase environment variables not found!\n' +
        'Running in DEMO MODE with limited functionality.\n' +
        'To enable full features:\n' +
        '  - Vercel: Settings → Environment Variables\n' +
        '  - Locally: Add to .env file\n' +
        '  VITE_SUPABASE_URL=your_url\n' +
        '  VITE_SUPABASE_ANON_KEY=your_key'
    );
}

// Always export a valid client (real or mock)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockClient();

