import { createBrowserClient } from "@supabase/ssr";

// Note: Generate proper types with `npx supabase gen types typescript` after running migrations
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
