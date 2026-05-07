import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const offeringId = "e6b6ecfc-c85d-41a5-bccb-90d211921048"; // Fine-tuning SLM
  
  const offering = await prisma.courseOffering.findUnique({
    where: { offeringId }
  });

  if (!offering) {
    console.log("Offering not found");
    return;
  }

  const updatedSlots = [
    {
      "id": "slot1",
      "name": "30-5-2026 Saturday",
      "time": "6pm-8pm"
    }
  ];

  await prisma.courseOffering.update({
    where: { offeringId },
    data: {
      slotsJson: updatedSlots
    }
  });

  console.log("Updated workshop date to 30-5-2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
