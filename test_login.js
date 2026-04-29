const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qqfzjrowcneghrnxnhco.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDM2MDUsImV4cCI6MjA4MTM3OTYwNX0.3QNIuG7k7rAfQpjnQ8GKHU3om-D7i_Xam6kulb0145o';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgwMzYwNSwiZXhwIjoyMDgxMzc5NjA1fQ.np-EYyoWEIo8IgBk5D-FF4AeLoT6rwAbHYHRxioHshw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const email = '20231127209@choferes.cronos';
  
  console.log('1. Fetching current user status from admin...');
  let { data: users } = await supabaseAdmin.from('users').select('*').eq('email', email);
  console.log('Current user in DB:', users[0]);

  // Set to true to simulate the issue
  console.log('\n2. Resetting must_change_password to true for testing...');
  await supabaseAdmin.from('users').update({ must_change_password: true }).eq('email', email);
  
  // Login
  console.log('\n3. Logging in as driver...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: 'newpassword123'
  });

  let userToUpdate = authData?.user;

  if (authError) {
    console.error('Login error:', authError.message);
    const { data: authData2, error: authError2 } = await supabase.auth.signInWithPassword({
      email,
      password: 'newpassword1234'
    });
    if (authError2) {
       console.error('Login error 2:', authError2.message);
       userToUpdate = users[0]; // fallback
    } else {
       userToUpdate = authData2.user;
    }
  }

  console.log('Login success. User ID:', userToUpdate?.id || 'Unknown');

  if (userToUpdate && userToUpdate.id) {
      // Now simulate change password
      console.log('\n4. Simulating change password (like change-password/page.tsx does)...');
      const newPass = 'newpassword123';
      const { error: updateAuthError } = await supabase.auth.updateUser({ password: newPass });
      if (updateAuthError) {
        console.error('Auth password update error:', updateAuthError.message);
      } else {
        console.log('Auth password updated successfully.');
      }

      // Now simulate the admin update
      console.log('\n5. Simulating the admin update of must_change_password flag...');
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from('users')
        .update({ must_change_password: false })
        .eq('id', userToUpdate.id)
        .select();
        
      console.log('Update result:', { updateError, updateData });
  }

  // Verify
  console.log('\n6. Verifying final status...');
  let { data: finalUsers } = await supabaseAdmin.from('users').select('*').eq('email', email);
  console.log('Final user in DB:', finalUsers[0]);
}

run();
