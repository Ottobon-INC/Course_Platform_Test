const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.$queryRawUnsafe('SELECT COUNT(*) FROM cp_blogs')
    console.log('Blogs count:', count[0].count)
  } catch (err) {
    console.error('Error checking blogs:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
