const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    const blogs = await client.query('SELECT COUNT(*) FROM cp_blogs');
    console.log('cp_blogs count:', blogs.rows[0].count);

    if (blogs.rows[0].count === '0') {
      console.log('Seeding dummy blog...');
      await client.query(`
        INSERT INTO cp_blogs (id, title, description, summary, image_url, url, hashtags, created_at)
        VALUES (
          gen_random_uuid(),
          'Exploring AI in 2026',
          'A deep dive into the latest AI trends.',
          'Summary of AI trends in 2026.',
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
          'https://ottolearn.in/blog/ai-2026',
          ARRAY['AI', 'Future'],
          NOW()
        )
      `);
      console.log('Dummy blog seeded');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
