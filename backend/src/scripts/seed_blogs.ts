import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding dummy blog...')
  try {
    await prisma.$executeRaw`
      INSERT INTO cp_blogs (id, title, description, summary, image_url, url, hashtags, created_at)
      VALUES (
        gen_random_uuid(),
        'Future of AI in Education',
        'Exploring how AI agents will revolutionize learning in 2026.',
        'A comprehensive look at AI-driven educational platforms and their impact on students.',
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
        'https://ottolearn.in/blog/future-ai-education',
        ARRAY['AI', 'Education', 'EdTech'],
        NOW()
      )
    `
    console.log('Dummy blog seeded successfully')
  } catch (err) {
    console.error('Error seeding blog:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
