const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qqfzjrowcneghrnxnhco.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgwMzYwNSwiZXhwIjoyMDgxMzc5NjA1fQ.np-EYyoWEIo8IgBk5D-FF4AeLoT6rwAbHYHRxioHshw';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const userId = 'dc470f83-d657-4f39-88a4-df5f0f61536b'; // User ID for 20389617637
  const cuit = '20389617637';

  console.log('Restableciendo contraseña al CUIT...');
  const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: cuit
  });
  if (resetError) {
    console.error('Error al restablecer contraseña:', resetError.message);
    return;
  }
  console.log('Contraseña restablecida a:', cuit);
  
  console.log('Restableciendo must_change_password a true...');
  const { error: updateDbError } = await supabaseAdmin
    .from('users')
    .update({ must_change_password: true })
    .eq('id', userId);
    
  if (updateDbError) {
    console.error('Error al actualizar BD:', updateDbError.message);
  } else {
    console.log('must_change_password actualizado a true.');
  }
}

run();