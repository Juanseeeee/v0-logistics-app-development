const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1]] = match[2].replace(/^["']|["']$/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('l2_trips').select('id').limit(1);
  console.log("Normal fetch:", data, error);
  
  // Try to insert a policy if possible, but we don't have exec_sql unless it was created.
  // We can try calling it.
  const res = await supabase.rpc('exec_sql', { sql: `
    ALTER TABLE l2_trips ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow all operations on l2_trips for authenticated users" ON l2_trips;
    CREATE POLICY "Allow all operations on l2_trips for authenticated users" ON l2_trips FOR ALL TO authenticated USING (true) WITH CHECK (true);
  `});
  console.log('exec_sql result:', res);
}

run();