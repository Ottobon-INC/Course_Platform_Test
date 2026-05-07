import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updatedSlots = [
    {
      "id": "slot1",
      "name": "30-5-2026 Saturday",
      "time": "6pm-8pm"
    }
  ];

  const result = await prisma.courseOffering.updateMany({
    where: { 
      programType: "workshop",
      isActive: true
    },
    data: {
      slotsJson: updatedSlots
    }
  });

  console.log(`Updated ${result.count} active workshops to 30-5-2026`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
