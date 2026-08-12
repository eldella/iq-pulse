import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY - set them in .env.local"
  );
}

/**
 * Browser Supabase client using the anon/public key, safe to expose
 * client-side - access control is enforced by Supabase Row Level Security
 * policies on each table, not by keeping this key secret. The DB password
 * and service_role key must never end up here or in any client bundle.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
