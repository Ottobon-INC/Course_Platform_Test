
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const offerings = await prisma.courseOffering.findMany({
        where: { isActive: true },
        include: { course: true }
    });

    console.log('Active Offerings:');
    offerings.forEach(o => {
        console.log(`- ${o.title} (${o.programType}): ${o.priceCents} cents, Assessment: ${o.assessmentRequired}`);
    });
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
