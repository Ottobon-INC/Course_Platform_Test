import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const offerings = await prisma.courseOffering.findMany({
    where: { programType: "workshop" },
    include: {
      course: true
    }
  });

  console.log(JSON.stringify(offerings, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
