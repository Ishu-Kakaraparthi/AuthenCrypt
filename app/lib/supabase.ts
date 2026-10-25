
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Supabase storage environment variables are missing."
  );
}

try {
  const parsedUrl = new URL(supabaseUrl);

  console.log("Supabase URL diagnostic:", {
    configured: true,
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    pathname: parsedUrl.pathname,
    hasWhitespace: supabaseUrl !== supabaseUrl.trim(),
  });
} catch {
  console.error("Supabase URL diagnostic: Invalid URL format.");
}
;
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
