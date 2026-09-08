// scripts/setup_admin.js
// One-time script: creates the admin Supabase Auth user AND inserts the
// corresponding profiles row with role='admin'.
//
// Run: node scripts/setup_admin.js
// Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
//           SUPABASE_SERVICE_ROLE_KEY in .env.local

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  console.error("Missing Supabase credentials in .env.local");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Anon client — for signUp
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client — for inserting profiles row (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setupAdmin() {
  console.log("Creating admin user...");

  const { data, error } = await supabase.auth.signUp({
    email: 'st.dwi89@gmail.com',
    password: '54tu54mp4112',
  });

  if (error) {
    console.error("❌ Error creating admin auth user:", error.message);
    process.exit(1);
  }

  const userId = data.user?.id;
  if (!userId) {
    console.error("❌ signUp succeeded but no user ID returned. Email confirmation may be required.");
    console.log("   Check the inbox for st.dwi89@gmail.com and confirm the email,");
    console.log("   then manually insert a profiles row:");
    console.log("   INSERT INTO public.profiles (id, role, full_name)");
    console.log("   VALUES ('<user_id>', 'admin', 'Admin');");
    process.exit(1);
  }

  console.log("✅ Admin auth user created. User ID:", userId);

  // Insert profiles row with role='admin'
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      role: 'admin',
      full_name: 'Admin',
    }, { onConflict: 'id' });

  if (profileError) {
    console.error("❌ Failed to insert profiles row:", profileError.message);
    console.log("   Manually run this SQL in Supabase Dashboard > SQL Editor:");
    console.log(`   INSERT INTO public.profiles (id, role, full_name)`);
    console.log(`   VALUES ('${userId}', 'admin', 'Admin')`);
    console.log(`   ON CONFLICT (id) DO UPDATE SET role = 'admin';`);
    process.exit(1);
  }

  console.log("✅ profiles row inserted with role='admin'.");
  console.log("");
  console.log("Admin setup complete!");
  console.log("  Email:    st.dwi89@gmail.com");
  console.log("  Password: (as specified above)");
  console.log("  Role:     admin");
  console.log("");
  console.log("IMPORTANT: If email confirmation is enabled in Supabase,");
  console.log("  confirm the email before attempting to log in,");
  console.log("  or disable 'Confirm email' in Authentication → Providers → Email.");
}

setupAdmin();
