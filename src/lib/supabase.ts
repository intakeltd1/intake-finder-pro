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
  // Your self-hosted Supabase URL (uncomment and update when leaving Lovable)
  // url: 'https://nnlowmcqtpmjmohuzzgf.supabase.co',
  
  // Your self-hosted anon key (uncomment and update when leaving Lovable)
  // anonKey: 'your-anon-key-here',
  
  // Current: Use Lovable Cloud (will be overridden when you update above)
  url: import.meta.env.VITE_SUPABASE_URL as string,
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
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
