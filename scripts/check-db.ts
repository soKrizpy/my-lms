import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  const { data, error } = await supabase.from('meetings').select('*').limit(1);
  console.log("meetings:", data);
  const { data: ms, error: mse } = await supabase.from('meeting_students').select('*').limit(1);
  console.log("meeting_students:", ms);
  const { data: st, error: ste } = await supabase.from('students').select('*').limit(1);
  console.log("students:", st);
}
run();
