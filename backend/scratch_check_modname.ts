import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.topic.findFirst({
    where: { courseId: 'f26180b2-5dda-495a-a014-ae02e63f172f', moduleNo: 1 }
  });
  console.log(t?.moduleName);
}
main().catch(console.error).finally(() => prisma.$disconnect());
