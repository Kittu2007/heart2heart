const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('Fetching columns for "profiles" table...');
  
  // Try to get a single row to see columns
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching profiles:', error.message);
    // Fallback: try information_schema if possible (might fail)
    const { data: cols, error: colError } = await supabase
      .rpc('get_columns', { table_name: 'profiles' }); // Just a guess if they have a helper
    
    if (colError) {
      console.error('Could not get columns via RPC either.');
      process.exit(1);
    }
    console.log('Columns via RPC:', cols);
  } else {
    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
    } else {
      console.log('No data in profiles table, but successfully queried. No columns returned?');
      // If table is empty, we might not get keys.
      // Try to insert a dummy and rollback? No, better query information_schema if we can.
      console.log('Attempting to query information_schema via a trick...');
      const { data: info, error: infoError } = await supabase
        .from('profiles')
        .select('*')
        .limit(0);
      
      if (infoError) {
        console.error('Error:', infoError.message);
      } else {
        // Unfortunately Supabase client doesn't give metadata easily.
        console.log('Profiles table exists.');
      }
    }
  }
}

verifySchema();
