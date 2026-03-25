const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const envPath = resolve(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) return [match[1], match[2].replace(/^["']|["']$/g, '')];
      return [];
    })
    .filter(entry => entry.length === 2)
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
  const res = await fetch(`${url}/rest/v1/l2_trips?select=client_id,trip_amount,third_party_amount,invoice_date,payment_date,tons_delivered,clients(company)&limit=5`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  const data = await res.json();
  writeFileSync('test_output2.json', JSON.stringify(data, null, 2));
}

check().catch(e => writeFileSync('test_output2.json', JSON.stringify({error: e.message})));
