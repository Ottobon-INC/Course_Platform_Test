import { prisma } from './src/services/prisma.js';

async function listOfferings() {
    try {
        const offerings = await prisma.courseOffering.findMany({
            select: {
                offeringId: true,
                title: true,
                programType: true
            }
        });
        console.log(JSON.stringify(offerings, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

listOfferings();
