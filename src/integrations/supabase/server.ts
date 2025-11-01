import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}

if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or SUPABASE_SERVICE_ROLE_KEY to connect to Supabase"
  );
}

export const createServerSupabaseClient = () => {
  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY ?? "";

  return createClient<Database>(SUPABASE_URL, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
