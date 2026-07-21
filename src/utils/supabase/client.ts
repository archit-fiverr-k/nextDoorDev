import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qwivfvyuninzmhifqwxp.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_iamWoZto9O-uNyYMLYocqQ_uvEmQlEC";

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
