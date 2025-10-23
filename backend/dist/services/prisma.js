import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
const prismaClient = global.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: env.databaseUrl,
        },
    },
});
if (env.nodeEnv !== "production") {
    global.prisma = prismaClient;
}
export const prisma = prismaClient;
