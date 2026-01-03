import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin client using service role key - use only in server-side code (cron jobs, etc.)
// This bypasses RLS policies, so use with caution
// Note: Generate proper types with `npx supabase gen types typescript` after running migrations
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin credentials");
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
