import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  const results: any = {}
  try {
    results.tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    try {
      results.cp_blogs_columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'cp_blogs'
      `
      results.sakhi_blogs_columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sakhi_blogs'
      `
      results.jobs_blogs_columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'jobs_blogs'
      `
    } catch (e) {
      results.blogs_error = 'One or more tables not found or error'
    }
    
    fs.writeFileSync('db_inspection.json', JSON.stringify(results, null, 2))
    console.log('Results written to db_inspection.json')
  } catch (err) {
    console.error('Error querying database:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
