import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const email = 'eforeembedd@gmail.com'; // based on screenshot
    const members = await prisma.cohortMember.findMany({
        where: { email: { contains: 'efore' } }
    });
    const users = await prisma.user.findMany({
        where: { email: { contains: 'efore' } }
    });
    console.log("Users:", users);
    console.log("Cohort Members:", members);
}

check().finally(() => prisma.$disconnect());
