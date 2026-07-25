const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdmin() {
  console.log("Registering admin user...");
  
  const { data, error } = await supabase.auth.signUp({
    email: 'st.dwi89@gmail.com',
    password: '54tu54mp4112',
  });

  if (error) {
    console.error("Error creating admin:", error.message);
  } else {
    console.log("Admin user created successfully!");
    console.log("User ID:", data.user?.id);
    console.log("IMPORTANT: If email confirmation is enabled in your Supabase project, you will need to check the email st.dwi89@gmail.com or disable 'Confirm email' in Supabase Authentication -> Providers -> Email.");
  }
}

setupAdmin();
