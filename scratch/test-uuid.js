const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function test() {
  console.log('Testing non-UUID insert...');
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: 'this-is-not-a-uuid',
      name: 'Test User'
    });
  
  if (error) {
    console.log('❌ Error:', error.message);
    if (error.message.includes('invalid input syntax for type uuid')) {
      console.log('✅ Theory confirmed: id column is UUID and rejects non-UUID strings.');
    }
  } else {
    console.log('✅ Success: id column accepts non-UUID strings.');
  }
}

test();
