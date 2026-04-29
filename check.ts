import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter((line: string) => line && !line.startsWith('#'))
    .map((line: string) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) return [match[1], match[2].replace(/^["']|["']$/g, '').trim()];
      return [];
    })
    .filter((entry: string[]) => entry.length === 2)
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('users').select('id, email, role, must_change_password').eq('role', 'driver');
  console.log('Error:', error);
  console.log('Drivers:', data);
}

run();
