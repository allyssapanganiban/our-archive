"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** The browser's Supabase client (one per tab). The session lives in cookies so the proxy can see it. */
export function supabase(): SupabaseClient {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
