import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** The publishable/anon key is safe in a static site. Row Level Security protects data. */
export const supabase = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || "merv9280@gmail.com";
