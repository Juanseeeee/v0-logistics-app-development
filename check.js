const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) return [match[1], match[2].replace(/^["']|["']$/g, '').trim()];
      return [];
    })
    .filter((entry) => entry.length === 2)
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data: users, error: usersError } = await supabase.from('users').select('id, email, role, must_change_password').eq('email', '20231127209@choferes.cronos');
  console.log('Users Error:', usersError);
  console.log('Users:', users);
}

run();
