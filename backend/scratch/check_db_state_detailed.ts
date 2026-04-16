
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const offerings = await prisma.courseOffering.findMany({
        include: { course: true }
    });

    console.log('Detailed Offerings:');
    offerings.forEach(o => {
        const slug = o.title.toLowerCase().replace(/ /g, '-');
        console.log({
            id: o.offeringId,
            title: o.title,
            slug: slug,
            programType: o.programType,
            priceCents: o.priceCents,
            assessmentRequired: o.assessmentRequired,
            isActive: o.isActive
        });
    });
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
