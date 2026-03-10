/**
 * Supabase browser client
 * Use this in Client Components (e.g. pages that use useState, onClick, etc.).
 * Runs in the browser; never put the service_role key here.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
