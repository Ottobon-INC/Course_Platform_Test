import { prisma } from './src/services/prisma.js';

async function listRegistrations() {
    try {
        const regs = await prisma.registration.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                registrationId: true,
                fullName: true,
                email: true,
                plan: true,
                createdAt: true
            }
        });
        console.log(JSON.stringify(regs, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

listRegistrations();
