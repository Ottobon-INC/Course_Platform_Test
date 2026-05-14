import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

async function checkCounts() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res1 = await client.query("SELECT count(*) FROM learner_persona_profiles");
    console.log(`LearnerPersonaProfile count: ${res1.rows[0].count}`);
    
    const res2 = await client.query("SELECT count(*) FROM cohort_members WHERE persona IS NOT NULL");
    console.log(`CohortMember with persona count: ${res2.rows[0].count}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkCounts();
