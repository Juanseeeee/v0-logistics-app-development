const { createClient } = require('@supabase/supabase-js');
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

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: trips, error: tripsError } = await supabase.from("trips").select("*").limit(2);
  const { data: l2_trips, error: l2Error } = await supabase.from("l2_trips").select("*").limit(2);
  const { data: expenses, error: expensesError } = await supabase.from("expenses").select("*").limit(2);

  const result = {
    trips: { error: tripsError, length: trips?.length, sample: trips },
    l2_trips: { error: l2Error, length: l2_trips?.length, sample: l2_trips },
    expenses: { error: expensesError, length: expenses?.length, sample: expenses }
  };
  
  writeFileSync('test_output.json', JSON.stringify(result, null, 2));
}

test();