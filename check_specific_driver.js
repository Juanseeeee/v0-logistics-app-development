const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qqfzjrowcneghrnxnhco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgwMzYwNSwiZXhwIjoyMDgxMzc5NjA1fQ.np-EYyoWEIo8IgBk5D-FF4AeLoT6rwAbHYHRxioHshw';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const cuit = '20389617637';
  const email = `${cuit}@choferes.cronos`;
  
  console.log(`Checking user with email: ${email}`);
  
  // Check auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError.message);
  } else {
    const authUser = authData.users.find(u => u.email === email);
    console.log('Auth user:', authUser ? { id: authUser.id, email: authUser.email } : 'Not found in auth.users');
  }
  
  // Check public.users
  const { data: publicUsers, error: publicError } = await supabaseAdmin.from('users').select('*').eq('email', email);
  if (publicError) {
    console.error('Error fetching public users:', publicError.message);
  } else {
    console.log('Public user:', publicUsers[0] || 'Not found in public.users');
  }
  
  // Check drivers
  const { data: drivers, error: driversError } = await supabaseAdmin.from('drivers').select('*').eq('cuit', cuit);
  if (driversError) {
    console.error('Error fetching driver:', driversError.message);
  } else {
    console.log('Driver record:', drivers[0] || 'Not found in drivers table');
  }
}

run();