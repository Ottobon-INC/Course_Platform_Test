
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const offering = await prisma.courseOffering.findFirst({
        where: { title: 'HR Interview' }
    });

    if (offering) {
        console.log(`Offering: ${offering.title}`);
        console.log('Slots:', JSON.stringify(offering.slotsJson, null, 2));
    } else {
        console.log('Offering not found');
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
