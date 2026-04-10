import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing in .env. Storage uploads will fail.');
} else {
    console.log('Supabase client initialized with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
