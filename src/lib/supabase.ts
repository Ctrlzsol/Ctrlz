
import { createClient } from '@supabase/supabase-js';

// NEW PROJECT CREDENTIALS
const supabaseUrl = 'https://dyupivftbsiqsmpdkiab.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dXBpdmZ0YnNpcXNtcGRraWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzE4MjYsImV4cCI6MjA4MzY0NzgyNn0.OVQHXJ1ElYQOY2GOpVqfW8kIva_oOVBnpQZgItu1GlM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const isSupabaseConfigured = true;
