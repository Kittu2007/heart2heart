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

async function createBucket() {
  console.log('Creating storage bucket "memories"...');
  
  const { data, error } = await supabase.storage.createBucket('memories', {
    public: false
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "memories" already exists.');
    } else {
      console.error('Error creating bucket:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Bucket "memories" created successfully:', data);
  }
}

createBucket();
