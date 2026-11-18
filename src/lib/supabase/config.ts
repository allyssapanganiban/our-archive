/** Supabase is used when both public values are set in .env.local; otherwise saves stay in this browser. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
/** Private storage bucket for photos and card art (see supabase/migrations). */
export const BUCKET = "scrapbook";
