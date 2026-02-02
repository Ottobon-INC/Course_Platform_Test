import { prisma } from "./prisma";

export async function getLandingResouceContext(): Promise<string> {
    // Use lower limits to prevent token overflow
    const [courses, offerings, cohorts] = await Promise.all([
        prisma.course.findMany({
            select: {
                courseName: true,
                description: true,
                level: true,
                durationMinutes: true,
                rating: true,
                category: true,
            },
            take: 5, // Reduced from 20
        }),
        prisma.courseOffering.findMany({
            where: { isActive: true },
            select: {
                title: true,
                programType: true,
                priceCents: true,
                description: true,
            },
            take: 5, // Reduced from 20
        }),
        prisma.cohort.findMany({
            where: {
                isActive: true,
                startsAt: { gt: new Date() }
            },
            orderBy: { startsAt: 'asc' },
            select: {
                name: true,
                startsAt: true,
                endsAt: true,
                course: { select: { courseName: true } }
            },
            take: 3
        })
    ]);

    const courseSection = courses.map(c =>
        `- Course: "${c.courseName}" (${c.category})\n  Desc: ${(c.description || "").substring(0, 100)}...\n  Duration: ${Math.round(c.durationMinutes / 60)}h`
    ).join("\n");

    const offeringSection = offerings.map(o =>
        `- ${o.programType.toUpperCase()}: "${o.title}" - $${(o.priceCents / 100).toFixed(2)}`
    ).join("\n");

    const cohortSection = cohorts.map(c =>
        `- Cohort: "${c.name}" (${c.course.courseName}) starts ${c.startsAt?.toDateString()}`
    ).join("\n");

    return `
LATEST DB DATA:
### COURSES
${courseSection || "None."}

### OFFERINGS
${offeringSection || "None."}

### COHORTS
${cohortSection || "None."}
`;
}
