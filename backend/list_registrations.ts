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
                createdAt: true,
                offering: {
                    include: {
                        course: true
                    }
                }
            }
        });
        
        const formatter = regs.map(r => ({
            ID: r.registrationId,
            Name: r.fullName,
            Email: r.email,
            Course: r.offering?.course?.courseName || "Unknown",
            Program: r.offering?.programType || "Unknown",
            Plan: r.plan,
            Date: r.createdAt
        }));
        
        console.table(formatter);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

listRegistrations();
