# Seed + Ingestion Notes (Identifiers + One-offs)

## 1) Seed script
File: `backend/prisma/seed.ts`

### Hard-coded IDs
- Primary course UUID: `f26180b2-5dda-495a-a014-ae02e63f172f`
- Primary slug: `ai-in-web-development`

### Seeded records
1) **Admin user**
   - Email: `jaswanthvanapalli12@gmail.com`
   - Password: `Ottobon@2025` (hashed with scrypt)
   - Role: `admin`

2) **Courses**
   - Several courses are seeded; the primary is `AI in Web Development` with slug `ai-in-web-development`.
   - Additional courses (React, Python, etc.) are added for catalog views.

3) **Topics**
   - CSV file: `topics_all_modules.csv` (repo root).
   - Only rows with `course_id === COURSE_ID` are inserted.
   - Existing topics for the course are deleted before seeding.

4) **Simulation exercises**
   - One per topic; generated from topic names.

5) **Page content**
   - `page_content` records for `about`, `courses`, `become-a-tutor`.

## 2) RAG ingestion
### Default ingestion
Command:
```bash
cd backend
npm run rag:ingest "../Web Dev using AI Course Content.pdf" ai-in-web-development "AI Native Full Stack Developer"
```
- Chunk size: 900 chars
- Overlap: 150 chars
- Embedding model: `text-embedding-3-small` (default)
- Writes to `course_chunks` (pgvector)

### Import precomputed embeddings
Command:
```bash
cd backend
npm run rag:import <json-file>
```
- Default JSON path: `../neo4j_query_table_data_2025-12-24.json`
- Validates each row has `chunkId`, `courseId`, `content`, `embedding`.

## 3) Cohort allowlist
- Manual seeding required for `cohorts` + `cohort_members`.
- `cohort_members` must include either `userId` or `email` (email is normalized and later linked to userId).

## 4) Cold call prompts
- Seed `cold_call_prompts` per topic to enable cold calling UI.

## 5) Content assets
- For JSON block layouts with `contentKey`, seed `topic_content_assets` for each key.

