import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env.js';
let supabaseAdmin = null;
if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
    try {
        supabaseAdmin = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
        console.log('✅ Supabase Admin Client initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize Supabase Admin Client:', error);
    }
}
else {
    console.warn('⚠️ Supabase credentials not found. Operating with in-memory store for fallback.');
}
export { supabaseAdmin };
export const isSupabaseConfigured = () => !!supabaseAdmin;
