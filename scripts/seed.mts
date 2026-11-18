/**
 * npm run db:seed            → adds every Supabase user to `members`, and loads the starting
 *                              folders / pages / cards if the scrapbook is still empty.
 * npm run db:seed -- --reset → wipes folders, pages and cards and loads the starting content again.
 *
 * Uses SUPABASE_SECRET_KEY from .env.local (server-side only; never shipped to the browser).
 */
import { createClient } from "@supabase/supabase-js";
import { CARDS, FOLDERS, MEMORIES } from "../src/lib/sample-data.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const reset = process.argv.includes("--reset");

const fail = (what: string, error: { message: string } | null) => {
  if (!error) return;
  console.error(`✗ ${what}: ${error.message}`);
  if (/relation .* does not exist|schema cache/i.test(error.message)) console.error("  → run supabase/migrations/0001_scrapbook.sql in the SQL Editor first.");
  process.exit(1);
};

// 1. Members: everyone with an account (sign-ups are off, so that's just the two of you).
const { data: users, error: usersError } = await db.auth.admin.listUsers({ perPage: 50 });
fail("listing users", usersError);
if (!users.users.length) console.warn("! No users yet. Add both of you under Authentication → Users, then run this again.");
for (const u of users.users) {
  const { error } = await db.from("members").upsert({ user_id: u.id, email: u.email });
  fail(`adding ${u.email} to members`, error);
}
console.log(`✓ members: ${users.users.length}`);

// 2. Starting content.
const tables = [
  ["folders", FOLDERS.map((f) => ({ id: f.slug, data: f }))],
  ["memories", MEMORIES.map((m) => ({ id: m.id, data: m }))],
  ["cards", CARDS.map((c) => ({ id: c.id, data: c }))],
] as const;

let existing = 0;
for (const [t] of tables) {
  const { count, error } = await db.from(t).select("id", { count: "exact", head: true });
  fail(`counting ${t}`, error);
  existing += count ?? 0;
}
if (existing && !reset) {
  console.log(`✓ the scrapbook already has ${existing} rows, so the starting content was left alone (use --reset to start over).`);
  process.exit(0);
}
if (reset) {
  for (const [t] of tables) fail(`clearing ${t}`, (await db.from(t).delete().neq("id", "")).error);
  console.log("✓ cleared folders, pages and cards");
}
for (const [t, rows] of tables) {
  fail(`loading ${t}`, (await db.from(t).insert(rows as never)).error);
  console.log(`✓ ${t}: ${rows.length}`);
}
