# Architecture Audit & Design Flaws Report

## 1. Executive Summary
The Course Platform is functional and leverages modern technologies (React, Node.js, Prisma, pgvector). However, the system exhibits significant technical debt in two key areas: **Module Coupling** and **Logic Leakage**.

The Frontend (`CoursePlayerPage.tsx`) acts as a "God Component," handling routing, complex state, and business logic that belongs in the backend. 
The Backend service layer (`quizService.ts`) bypasses the ORM abstraction, creating a brittle dependency on raw SQL and specific PostgreSQL features.

## 2. Identified "Tight Coupling"

### 2.1 Database Coupling (High Severity)
The `quizService.ts` relies almost exclusively on `prisma.$queryRaw` and `Prisma.sql`. 
- **The Flaw**: Instead of using Prisma's type-safe schema methods (e.g., `prisma.quizattempt.create`), the Service layer writes raw SQL queries with manual type casting (`::uuid`, `::jsonb`).
- **Consequence**: 
    - The application is tightly coupled to PostgreSQL.
    - Types are manually defined (`DbQuestionRow`) rather than inferred from the schema.
    - Refactoring the database schema will silently break the code at runtime because TypeScript cannot validate raw SQL strings.

### 2.2 Frontend Data Coupling
The `CoursePlayerPage.tsx` component is tightly coupled to the internal data structure of the content blocks.
- **The Flaw**: The component contains inline logic to parse raw JSON strings (`parseContentBlocks`, lines 88-116) and manually handle data variants (`resolveTextVariant`, lines 118-134).
- **Consequence**: Any change to the content storage format in the backend requires a synchronized deployment of the frontend, as the parsing logic is duplicated/leaked to the client.

## 3. Design Flaws & Code Smells

### 3.1 The "God Component" (CoursePlayerPage.tsx)
- **Size**: >2,300 lines of code.
- **Responsibilities**:
    1.  Routing & URL params.
    2.  Data Validation (inline).
    3.  Complex State Management (15+ `useState` hooks).
    4.  Video Playback logic.
    5.  Chat/AI Integration.
    6.  Markdown Rendering & Styling.
    7.  Quiz State Machine.
- **Recommendation**: This component violates the Single Responsibility Principle. It should be refactored into:
    -   `useCourseData` (Custom Hook for data fetching).
    -   `useQuizEngine` (Custom Hook for quiz state).
    -   `<CourseVideoPlayer />` (Isolated component).
    -   `<AiTutorWidget />` (Isolated component).

### 3.2 logic Duplication (DRY Violation)
The logic to normalize video URLs is duplicated verbatim in both the Frontend and Backend.
- **Backend**: `backend/src/routes/lessons.ts` (lines 27-62)
- **Frontend**: `frontend/src/pages/CoursePlayerPage.tsx` (lines 45-75)
- **Risk**: If a new video provider is supported or a URL format changes, developers must remember to update both files. If they drift, the backend might validate a URL that the frontend fails to render (or vice versa).

### 3.3 Mixed Abstractions in Content Resolution
The file `lessons.ts` implements a complex `resolveContentLayout` function (lines 161-235) to handle "Persona" logic server-side. However, the frontend *also* contains logic (`resolveTextVariant`) to handle variants.
- **The Flaw**: It is unclear which layer owns the "Resolution" responsibility.
- **Ideal State**: The Backend should return the *final* resolved content to the Frontend. The Frontend should simply render what it receives, without knowing about "variants" or "personas."

## 4. Recommendations

| Severity | Issue | Remediation Plan |
|---|---|---|
| **Critical** | Raw SQL in `quizService` | Refactor `quizService.ts` to use standard Prisma Client methods (`findMany`, `create`, `update`). Remove manual SQL string construction. |
| **High** | God Component (`CoursePlayerPage`) | Extract logic into `hooks/useCoursePlayer.ts` and `hooks/useQuiz.ts`. Move UI sub-sections (Chat, Notes, Player) into separate folders. |
| **Medium** | Logic Duplication (`normalizeVideoUrl`) | Move this function to a shared package (if monorepo) or strictly enforce server-side normalization (Frontend receives a ready-to-use URL). |
| **Medium** | Logic Leakage (`parseContentBlocks`) | ensure the API returns parsed JSON objects, not stringified JSON that the frontend has to `JSON.parse` manually. |
