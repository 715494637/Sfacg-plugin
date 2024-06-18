import { createClient } from "@supabase/supabase-js";
import { SfacgConfig } from "./config.js";
const SupaBase = createClient(SfacgConfig.SUPABASE_URL, SfacgConfig.SUPABASE_SERVICE_KEY);
export { SupaBase };
