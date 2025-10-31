import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COURSE_ID = "f26180b2-5dda-495a-a014-ae02e63f172f";

type CsvTopicRow = {
  topic_id: string;
  course_id: string;
  module_no: string;
  module_name: string;
  topic_number: string;
  topic_name: string;
  content_type: string | null;
  video_url: string | null;
  text_content: string | null;
  is_preview: string | null;
};

function toBoolean(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function normaliseLineEndings(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.replace(/\r\n/g, "\n").trim();
}

async function loadTopicsFromCsv(csvPath: string, courseId: string): Promise<Prisma.TopicCreateManyInput[]> {
  try {
    const raw = await fs.readFile(csvPath, "utf8");
    const records = parse(raw, {
      columns: true,
      skip_empty_lines: true,
    }) as CsvTopicRow[];

    return records
      .filter((record) => record.course_id === courseId)
      .map((record) => {
      const moduleNo = Number.parseInt(record.module_no, 10);
      const topicNumber = Number.parseInt(record.topic_number, 10);

      return {
        topicId: record.topic_id,
        courseId: record.course_id,
        moduleNo: Number.isNaN(moduleNo) ? 0 : moduleNo,
        moduleName: record.module_name?.trim() ?? "",
        topicNumber: Number.isNaN(topicNumber) ? 0 : topicNumber,
        topicName: record.topic_name?.trim() ?? "",
        contentType: record.content_type?.trim().toLowerCase() ?? "video",
        videoUrl: record.video_url?.trim() || null,
        textContent: normaliseLineEndings(record.text_content),
        isPreview: toBoolean(record.is_preview),
      };
    });
  } catch (error) {
    console.error("Failed to parse topics CSV", error);
    throw error;
  }
}

async function seedCourse(): Promise<void> {
  await prisma.course.upsert({
    where: { courseId: COURSE_ID },
    create: {
      courseId: COURSE_ID,
      courseName: "AI in Web Development",
      description:
        "Master the integration of AI technologies in modern web development while building a complete end-to-end application with guided prompts and real project workflows.",
      priceCents: 399900,
    },
    update: {
      courseName: "AI in Web Development",
      description:
        "Master the integration of AI technologies in modern web development while building a complete end-to-end application with guided prompts and real project workflows.",
      priceCents: 399900,
    },
  });
}

async function seedTopics(topics: Prisma.TopicCreateManyInput[]): Promise<void> {
  if (topics.length === 0) {
    console.warn("No topics found in CSV; skipping topic seeding.");
    return;
  }

  await prisma.topic.deleteMany({
    where: { courseId: COURSE_ID },
  });

  const chunkSize = 100;
  for (let index = 0; index < topics.length; index += chunkSize) {
    const chunk = topics.slice(index, index + chunkSize);
    await prisma.topic.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }

  console.log(`Seeded ${topics.length} topics from CSV`);
}

async function main(): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const csvPath = path.resolve(__dirname, "..", "..", "topics_all_modules.csv");

  console.log("Seeding database...");
  await seedCourse();
  const topics = await loadTopicsFromCsv(csvPath, COURSE_ID);
  await seedTopics(topics);
  console.log("Database seed completed.");
}

main()
  .catch((error) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
