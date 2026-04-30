import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cohorts = await prisma.cohort.findMany({
    where: {
      isActive: true,
      offering: {
        course: {
          slug: 'ai-native-fullstack-developer'
        }
      }
    }
  });
  console.log(`Found ${cohorts.length} active cohorts for ai-native-fullstack-developer`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
