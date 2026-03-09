import { prisma } from './src/services/prisma.js';

async function test() {
    try {
        console.log("Testing Prisma with 'plan' field...");
        const reg = await prisma.registration.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        console.log("Found registration keys:", Object.keys(reg || {}));
        if (reg && 'plan' in reg) {
            console.log("SUCCESS: 'plan' field exists in Prisma client. Value:", (reg as any).plan);
        } else {
            console.log("ERROR: 'plan' field does NOT exist in Prisma client.");
        }
    } catch (error) {
        console.error("Prisma Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
