const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qqfzjrowcneghrnxnhco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZnpqcm93Y25lZ2hybnhuaGNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgwMzYwNSwiZXhwIjoyMDgxMzc5NjA1fQ.np-EYyoWEIo8IgBk5D-FF4AeLoT6rwAbHYHRxioHshw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: alerts } = await supabase.from('document_alerts').select('id');
  const critical = alerts || [];
  
  console.log('Current SQL Alerts count:', critical.length);
}

run();