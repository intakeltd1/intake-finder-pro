/**
 * Supabase Client Configuration
 * 
 * FUTURE-PROOFING: When you leave Lovable, update these credentials 
 * to point to your self-hosted Supabase project.
 * 
 * Your self-hosted project ID: nnlowmcqtpmjmohuzzgf
 * 
 * To customize magic link emails:
 * 1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/nnlowmcqtpmjmohuzzgf
 * 2. Navigate to Authentication > Email Templates
 * 3. Customize the "Magic Link" template with your branding
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// =============================================================================
// CONFIGURATION - UPDATE THESE WHEN LEAVING LOVABLE
// =============================================================================

// Option 1: Use environment variables (recommended for production)
// Option 2: Hardcode your self-hosted credentials here when you export to GitHub

const SUPABASE_CONFIG = {
  // NOW USING YOUR SELF-HOSTED SUPABASE (nnlowmcqtpmjmohuzzgf)
  url: 'https://nnlowmcqtpmjmohuzzgf.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubG93bWNxdHBtam1vaHV6emdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjYzNjIsImV4cCI6MjA4MDk0MjM2Mn0.H3-q7GJBZ8FLB1R4ZRAPyk-a8peSkaHJrp1Y0m1pg44',
};

// =============================================================================
// CLIENT CREATION - No changes needed below
// =============================================================================

export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export config for debugging
export const getSupabaseConfig = () => ({
  url: SUPABASE_CONFIG.url,
  isLovableCloud: SUPABASE_CONFIG.url?.includes('mpeqtdfuiqhprvmftqis'),
});
