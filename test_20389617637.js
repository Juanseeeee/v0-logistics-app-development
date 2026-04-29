const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qqfzjrowcneghrnxnhco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgwMzYwNSwiZXhwIjoyMDgxMzc5NjA1fQ.np-EYyoWEIo8IgBk5D-FF4AeLoT6rwAbHYHRxioHshw';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const userId = 'dc470f83-d657-4f39-88a4-df5f0f61536b'; // User ID for 20389617637
  const email = '20389617637@choferes.cronos';
  
  console.log('1. Resetting password for test user...');
  const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: 'TestPassword123'
  });
  if (resetError) {
    console.error('Failed to reset password:', resetError);
    return;
  }
  
  // Make sure must_change_password is true
  await supabaseAdmin.from('users').update({ must_change_password: true }).eq('id', userId);
  
  console.log('2. Simulating login...');
  const supabaseAnon = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDM2MDUsImV4cCI6MjA4MTM3OTYwNX0.3QNIuG7k7rAfQpjnQ8GKHU3om-D7i_Xam6kulb0145o');
  
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password: 'TestPassword123'
  });
  
  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  
  console.log('Login success:', authData.user.id);
  
  console.log('3. Simulating change-password/page.tsx logic...');
  const { error: updateAuthError } = await supabaseAnon.auth.updateUser({ password: 'NewTestPassword123' });
  if (updateAuthError) {
    console.error('Failed to update password:', updateAuthError.message);
  } else {
    console.log('Auth password updated');
  }
  
  const { error: updateDbError, data: updateData } = await supabaseAdmin
    .from('users')
    .update({ must_change_password: false })
    .eq('id', authData.user.id)
    .select();
    
  if (updateDbError) {
    console.error('Failed to update DB:', updateDbError.message);
  } else {
    console.log('DB updated:', updateData[0]);
  }
}

run();