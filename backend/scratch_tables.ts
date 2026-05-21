import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Searching PostgreSQL tables for 'workshop' or 'session'...");
  try {
    const tables: any[] = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'
    `;
    const names = tables.map(t => t.tablename);
    const filtered = names.filter(n => n.includes("workshop") || n.includes("session"));
    console.log("Filtered database tables:", filtered);
  } catch (err) {
    console.error("❌ Error listing tables:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
