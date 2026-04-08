import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const courseSlug = 'ai-native-fullstack-developer'
  const course = await prisma.course.findUnique({ where: { slug: courseSlug } })
  console.log('Course found:', course?.courseName)
  
  if (course) {
    const offerings = await prisma.courseOffering.findMany({
      where: { courseId: course.courseId },
    })
    console.log('Offerings count:', offerings.length)
    offerings.forEach(o => {
      console.log(`- ${o.title} (Active: ${o.isActive}, Type: ${o.programType})`)
    })
  }
}

test().finally(() => prisma.$disconnect())
