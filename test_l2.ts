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

async function run() {
  const { data, error } = await supabase.from('l2_trips').select('id, client_id, trip_amount, third_party_amount, invoice_date, payment_date, tons_delivered, clients(company)');
  console.log('Error:', error);
  console.log('Data length:', data?.length);
  if (data && data.length > 0) {
    console.log('Sample:', JSON.stringify(data[0], null, 2));
  }
}

run();