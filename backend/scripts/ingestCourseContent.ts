import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { chunkText } from "../src/rag/textChunker";
import { createEmbedding } from "../src/rag/openAiClient";
import { replaceCourseChunks } from "../src/rag/ragService";

const DEFAULT_PDF_PATH = path.resolve(process.cwd(), "../Web Dev using AI Course Content.pdf");
const DEFAULT_COURSE_ID = "ai-in-web-development";
const DEFAULT_COURSE_TITLE = "AI in Web Development";

async function main() {
  const pdfPath = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_PDF_PATH);
  const courseId = process.argv[3] ?? DEFAULT_COURSE_ID;
  const courseTitle = process.argv[4] ?? DEFAULT_COURSE_TITLE;

  console.log(`[rag] ingesting ${pdfPath} for course ${courseId}`);

  const pdfBuffer = await fs.promises.readFile(pdfPath);
  const parser = new PDFParse({ data: pdfBuffer });
  const pdfData = await parser.getText();
  await parser.destroy();

  const chunks = chunkText(pdfData.text ?? "");
  if (chunks.length === 0) {
    throw new Error("No content extracted from the PDF.");
  }

  const payload = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const content = chunks[index];
    const embedding = await createEmbedding(content);
    payload.push({
      chunkId: `${courseId}-${index + 1}`,
      content,
      courseId,
      position: index,
      embedding,
    });
    console.log(`[rag] embedded chunk ${index + 1}/${chunks.length}`);
  }

  await replaceCourseChunks(courseTitle, payload);
  console.log("[rag] ingest complete");
}

main()
  .catch((error) => {
    console.error("[rag] ingest failed", error);
    process.exitCode = 1;
  });
