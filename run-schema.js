// run-schema.js — applies schema.sql to Supabase via direct PostgreSQL connection
// Usage: node run-schema.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase project connection details
// Connection pooler (port 6543) = Session mode for DDL
const connectionString =
  process.env.DATABASE_URL ||
  // Direct connection (port 5432) — replace [YOUR-PASSWORD] if env not set
  `postgresql://postgres.jjtohlftdctlepdsneew:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`;

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected\n');

    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Running schema.sql...');
    await client.query(sql);
    console.log('✅ Schema applied successfully!');

    // Verify tables exist
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('\nTables in public schema:');
    rows.forEach(r => console.log(' -', r.table_name));
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
