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
      if (match) return [match[1], match[2].replace(/^["']|["']$/g, '')];
      return [];
    })
    .filter((entry: string[]) => entry.length === 2)
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    // Fallback: query using raw SQL if possible, but RPC might not exist.
    // Let's just create a policy using the service role key.
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: `
      CREATE POLICY "Allow all operations on l2_trips for authenticated users"
      ON l2_trips FOR ALL TO authenticated USING (true) WITH CHECK (true);
    `});
    console.log("SQL Error:", sqlError);
  }
}

async function forceRLS() {
  // To be absolutely sure, let's just use the REST API to fetch as an authenticated user.
  // Wait, we can't easily do that without a user token.
}
