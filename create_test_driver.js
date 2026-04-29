const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qqfzjrowcneghrnxnhco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgwMzYwNSwiZXhwIjoyMDgxMzc5NjA1fQ.np-EYyoWEIo8IgBk5D-FF4AeLoT6rwAbHYHRxioHshw';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const newEmail = 'testdriver@choferes.cronos';
  // Create user in auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: newEmail,
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'driver', name: 'Test Driver' }
  });
  
  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }
  
  const userId = authData.user.id;
  
  // Add to drivers
  await supabaseAdmin.from('drivers').insert({
    user_id: userId,
    name: 'Test Driver',
    cuit: '11111111111',
    active: true
  });
  
  // Update users table to require password change
  await supabaseAdmin.from('users').update({ must_change_password: true, role: 'driver' }).eq('id', userId);
  
  console.log('Created test driver:', newEmail, 'ID:', userId);
}

run();