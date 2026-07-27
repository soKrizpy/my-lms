const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const email = `test_${Date.now()}@student.mylms.app`;
  const mpin = "123456";
  const fullName = "Test Student";

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: mpin,
    email_confirm: true,
    user_metadata: { full_name: fullName, is_student: true },
  });

  if (authError) return console.error(authError);
  const userId = authData.user.id;
  
  const { error: profileError } = await supabase.from("profiles").insert({ id: userId, role: "student", full_name: fullName });
  if (profileError) console.error("Profile Error:", profileError);

  const { error: studentError } = await supabase.from("students").insert({
      id: userId,
      email_or_phone: email,
      full_name: fullName,
      grade: null,
      bio: null,
      mpin,
    });

  if (studentError) {
    console.error("Student error:", studentError);
  } else {
    console.log("Student profile created successfully!");
  }
}
run();
