# API Reference

## 1. Overview
The API is built with Express and is mounted at `/`, with all routes mirrored under `/api` for convenience.
**Base URL**: `http://localhost:4000` (or `/api` prefix)

## 2. Authentication & Users

### Auth (`/auth`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/google` | Initiates Google OAuth flow (redirects to Google). |
| `GET` | `/google/callback` | OAuth callback. Sets session cookies and redirects to frontend. |
| `POST` | `/login` | Tutor/Admin email+password login. |
| `POST` | `/refresh` | Refreshes JWT access token using a refresh token. |
| `POST` | `/logout` | Invalidates the user session. |

### Users (`/users`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Returns the current user's profile and roles. |

### Tutors (`/tutors`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/me/courses` | Lists courses assigned to the current tutor. |
| `GET` | `/dashboard/stats` | Returns stats for the tutor dashboard. |

---

## 3. Course Content

### Courses (`/courses`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Lists all published courses. |
| `GET` | `/:slug` | Gets public details for a course. |
| `POST` | `/:courseId/enroll` | Enrolls the current user in a course (checks cohort eligibility). |

### Lessons (`/lessons`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/courses/:courseKey/topics` | **Heavy**. Returns all topics for a course, including resolved content blocks. |
| `PUT` | `/topics/:topicId/progress` | Updates completion status/progress for a topic. |
| `PUT` | `/topics/:topicId/persona` | Sets the user's "Study Persona" (e.g., Sports, Cooking) for a topic. |

### Cohort Projects (`/cohort-projects`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/:courseKey` | Returns the project brief for the user's cohort batch. |

---

## 4. AI Tutor & Services

### Assistant (`/assistant`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/query` | **Async**. Enqueues a RAG query. Returns `202 Accepted` + `jobId`. |
| `GET` | `/stream/:jobId` | **SSE**. Streams real-time updates for a job. |
| `GET` | `/session` | Returns chat history for the current course/topic context. |

### Landing Assistant (`/landing-assistant`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | **Async**. Sales chatbot for the landing page (public/unauthenticated). |
| `GET` | `/stream/:jobId` | **SSE**. Streams results for the landing bot. |

### Persona Profiles (`/persona-profiles`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/analyze` | Uses LLM to analyze survey answers and assign a "Tutor Persona". |
| `GET` | `/:courseId` | Gets the user's assigned persona for a course. |

---

## 5. Engagement & Interactive

### Quiz (`/quiz`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/:courseId/sections` | Returns quiz module mapping and lock status. |
| `POST` | `/:courseId/attempts` | Submits a quiz attempt. |

### Cold Call (`/cold-call`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/prompts` | Returns cold-call prompts for a topic. |
| `POST` | `/messages` | Posts a reply to a prompt. |
| `POST` | `/messages/:id/star` | Stars a helpful reply. |

### Activity (`/activity`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/events` | Batch ingestion of telemetry events (focus, blur, video_play). |
| `GET` | `/monitor` | **Tutor-only**. Returns live learner status (Engaged, Drift, Friction). |

---

## 6. Registration & Commerce

### Cart (`/cart`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Lists cart items. |
| `POST` | `/items` | Adds a course to the cart. |
| `DELETE` | `/items/:itemId` | Removes an item. |

### Registrations (`/registrations`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/offerings/:programType/:courseSlug` | Fetches offering details and assessment questions. |
| `POST` | `/` | Submits a new registration (multi-stage flow). |
| `GET` | `/:registrationId` | Checks registration status. |

---

## 7. System & Admin

### Health (`/health`)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Basic connectivity check. Returns 200 OK. |

### Admin (`/admin`)
| Method | Path | Description |
|---|---|---|
| `POST` | `/courses` | Creates a new course. |
| `GET` | `/applications` | Lists tutor applications. |
| `POST` | `/applications/:id/approve` | Approves a tutor application. |
