import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Fetching columns for physical table 'workshop_sessions'...");
  try {
    const columns: any[] = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cohorts'
    `;
    console.log("Columns of cohorts:");
    console.log(columns);
    
    // Check if there are any existing rows in the table
    const rows: any[] = await prisma.$queryRaw`
      SELECT * FROM cohorts LIMIT 5
    `;
    console.log("Sample rows in cohorts:");
    console.log(rows);
  } catch (err) {
    console.error("❌ Error listing columns:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
