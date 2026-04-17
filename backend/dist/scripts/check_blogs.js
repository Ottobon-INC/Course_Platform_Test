import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const count = await prisma.$queryRaw `SELECT COUNT(*) FROM cp_blogs`;
        console.log('Blogs count:', count[0].count);
    }
    catch (err) {
        console.error('Error checking blogs:', err);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
