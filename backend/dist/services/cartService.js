import crypto from "node:crypto";
import { prisma } from "./prisma";
const METADATA_KEYS = [
    "description",
    "instructor",
    "duration",
    "rating",
    "students",
    "level",
    "thumbnail",
];
function extractMetadata(payload) {
    const metadata = {};
    for (const key of METADATA_KEYS) {
        const value = payload[key];
        if (value === undefined || value === null) {
            continue;
        }
        if (typeof value === "string" || typeof value === "number") {
            metadata[key] = value;
        }
    }
    return metadata;
}
function mapCartItemToResponse(item) {
    const metadata = (item.courseData ?? {});
    return {
        courseId: item.courseSlug,
        title: item.courseTitle,
        price: item.coursePrice,
        addedAt: item.addedAt.toISOString(),
        ...metadata,
    };
}
let cartTableReadyPromise = null;
async function ensureCartTable() {
    if (!cartTableReadyPromise) {
        cartTableReadyPromise = (async () => {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "cart_items" (
          "cart_item_id" UUID PRIMARY KEY,
          "user_id" UUID NOT NULL,
          "course_slug" TEXT NOT NULL,
          "course_title" TEXT NOT NULL,
          "course_price" INTEGER NOT NULL DEFAULT 0,
          "course_data" JSONB,
          "added_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT "cart_items_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
        )
      `);
            await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_cart_item_user_slug"
          ON "cart_items" ("user_id", "course_slug")
      `);
        })().catch((error) => {
            cartTableReadyPromise = null;
            throw error;
        });
    }
    await cartTableReadyPromise;
}
export async function getCartForUser(userId) {
    await ensureCartTable();
    const items = await prisma.cartItem.findMany({
        where: { userId },
        orderBy: { addedAt: "desc" },
    });
    return items.map(mapCartItemToResponse);
}
export async function addItemToCart(userId, course) {
    await ensureCartTable();
    const metadata = extractMetadata(course);
    await prisma.cartItem.upsert({
        where: {
            userId_courseSlug: {
                userId,
                courseSlug: course.id,
            },
        },
        create: {
            cartItemId: crypto.randomUUID(),
            userId,
            courseSlug: course.id,
            courseTitle: course.title,
            coursePrice: course.price,
            courseData: metadata,
        },
        update: {
            courseTitle: course.title,
            coursePrice: course.price,
            courseData: metadata,
            addedAt: new Date(),
        },
    });
    return getCartForUser(userId);
}
export async function removeItemFromCart(userId, courseSlug) {
    await ensureCartTable();
    await prisma.cartItem.deleteMany({
        where: {
            userId,
            courseSlug,
        },
    });
    return getCartForUser(userId);
}
export async function clearCartForUser(userId) {
    await ensureCartTable();
    await prisma.cartItem.deleteMany({
        where: { userId },
    });
    return [];
}
