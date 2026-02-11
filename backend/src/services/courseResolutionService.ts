import { prisma } from "./prisma";

const LEGACY_COURSE_SLUGS: Record<string, string> = {
    "ai-in-web-development": "f26180b2-5dda-495a-a014-ae02e63f172f",
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a course identifier (UUID, slug, name, or legacy alias) to a valid Course UUID.
 * Returns null if the course cannot be found.
 */
export async function resolveCourseId(courseKey: string | null | undefined): Promise<string | null> {
    const trimmedKey = courseKey?.trim();
    if (!trimmedKey) {
        return null;
    }

    // 1. Direct UUID check
    if (uuidRegex.test(trimmedKey)) {
        return trimmedKey; // Assume valid if it matches UUID format (could add DB check if strict validation needed)
    }

    // 2. Decode URL component
    let decodedKey: string;
    try {
        decodedKey = decodeURIComponent(trimmedKey).trim();
    } catch {
        decodedKey = trimmedKey;
    }

    const normalizedSlug = decodedKey.toLowerCase();

    // 3. Legacy Alias Check
    const aliasMatch = LEGACY_COURSE_SLUGS[normalizedSlug];
    if (aliasMatch) {
        return aliasMatch;
    }

    // 4. Database Lookup (Slug or Name)
    // Try exact slug match first, then name match
    // Also try constructing a slug from the name (e.g. "AI in Web Dev" -> "ai-in-web-dev")

    const normalizedName = decodedKey.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

    // Prepare search candidates
    const searchValues = Array.from(new Set([
        normalizedSlug, // as slug
        decodedKey,     // as name (exact)
        normalizedName  // as name (normalized)
    ])).filter(v => v.length > 0);

    if (searchValues.length === 0) return null;

    const course = await prisma.course.findFirst({
        where: {
            OR: [
                { slug: { in: searchValues, mode: "insensitive" } },
                { courseName: { in: searchValues, mode: "insensitive" } }
            ]
        },
        select: { courseId: true },
    });

    return course?.courseId ?? null;
}
