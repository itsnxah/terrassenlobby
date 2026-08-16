"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-Client für Client-Komponenten (Browser).
 * Nutzung: const supabase = createClient();
 *
 * Ohne <Database>-Generic – siehe Hinweis in server.ts.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
