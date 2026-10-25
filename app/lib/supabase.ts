
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Supabase storage environment variables are missing."
  );
}
console.log("Supabase URL diagnostic:", {
  configured: Boolean(supabaseUrl),
  startsWithHttps: supabaseUrl?.startsWith("https://"),
  hasStorageSuffix: supabaseUrl?.includes("/storage/v1"),
  hasWhitespace: supabaseUrl !== supabaseUrl?.trim(),
});
const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabase;
