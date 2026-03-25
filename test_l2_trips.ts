const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf8');
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

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

const { writeFileSync } = require('fs');

async function test() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .limit(1);
    
  writeFileSync('test_output.json', JSON.stringify({ error, length: data?.length, sample: data ? data[0] : null }, null, 2));
}

test();
