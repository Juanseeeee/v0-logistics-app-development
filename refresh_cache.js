const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { resolve } = require('path');

const envPath = resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
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

async function run() {
  // 1. Run migration
  const sql = fs.readFileSync('supabase/migrations/20240101000056_add_bulk_blocks_dates.sql', 'utf-8');
  
  // Since we cannot run raw DDL via supabase-js without an RPC, let's try to reload the schema cache.
  // The error "Could not find the column in the schema cache" happens when you added the column via SQL Editor, 
  // but PostgREST hasn't realized yet. We can force a reload by calling a non-existent RPC or just letting it refresh naturally.
  // Actually, we can force a schema cache reload via the Supabase dashboard or by sending a NOTIFY to pgrst.
  const { data, error } = await supabase.rpc('refresh_schema_cache');
  console.log("Refresh RPC result:", { data, error });
}
run();