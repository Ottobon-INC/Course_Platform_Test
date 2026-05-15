const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const offerings = await prisma.courseOffering.findMany({ include: { course: true }, take: 10 });
  console.log(JSON.stringify(offerings.map(o => ({ offeringName: o.name, slug: o.slug, parentCourse: o.course.name, offeringType: o.offeringType })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
