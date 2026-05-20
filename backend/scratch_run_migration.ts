import { Client } from "pg";

const connectionString = "postgresql://postgres.your-tenant-id:JjFjVMHezYNVdXWXxuhXiOLR3GFn5jFYp0s4MYqSeU@72.61.227.244:6543/postgres?sslmode=disable&pgbouncer=true";

async function main() {
  console.log("Connecting to database...");
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected successfully!");
    
    console.log("Adding columns if not exists...");
    await client.query(`
      ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS registration_starts_at timestamptz;
      ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS registration_ends_at timestamptz;
    `);
    console.log("Migration executed successfully!");
    
    console.log("Verifying columns in 'cohorts' table...");
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cohorts'
    `);
    console.log(res.rows);
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

main();
