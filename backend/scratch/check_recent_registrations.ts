
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const registrations = await prisma.registration.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { offering: true }
    });

    console.log('Most Recent Registrations:');
    registrations.forEach(r => {
        console.log({
            id: r.registrationId,
            name: r.fullName,
            email: r.email,
            offering: r.offering.title,
            createdAt: r.createdAt
        });
    });
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
