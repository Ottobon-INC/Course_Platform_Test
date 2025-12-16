# Task Progress Log

> Running log of notable tasks and changes completed on the backend + frontend stack of the Course Platform project.

## 2025-12-15 – Study personas + prompts
- Persisted saved personas even after learners switch back to Standard. Introduced `personaHistoryKey` on the client, strengthened `/lessons/courses/:slug/personalization`, and ensured the questionnaire reappears for Standard-only learners when they opt into Personalised narration mid-course.
- Updated the study-style dialog styling so text and buttons remain readable (plain black copy, muted subtitles, consistent CTA colors).
- Shipped curated prompt trees for the tutor dock along with the typed prompt quota enforcement (see also backend log). Frontend now surfaces suggestion chips with follow-ups, while the backend enforces module-level quotas and rate limits.

## 2025-12-05 – Enrollment autopilot, certificate polish
- Added the automatic enrollment call and idempotent server handler, so accepting the MetaLearn modal immediately writes to `enrollments`. Also routed learners with no persona preference through `/course/:slug/path` before the player.
- Refreshed the certificate preview page copy and CTA states, wiring the Razorpay stub to a clearer helper and emphasising the paid upgrade flow.
- Hardened tutor quota messaging so HTTP 429 responses show a friendly warning inside the chat dock.

## 2025-11-27 – Landing page redirect & nav cleanup
- Simplified routing so every CTA points to the course player, removed deprecated Dashboard/Courses/Cart links, and ensured unpublished courses show a "Coming soon" toast.

## 2025-11-25 – Quiz payload fix
- Updated the shared fetch helper to merge headers and restored per-user quiz attempts, unlocking module 2 as soon as both module-1 topic pairs pass.

## 2025-10-15 – Cart endpoints
- Created cart CRUD endpoints and migrations, rewired dashboard/cart screens to the API, and added optimistic updates plus logout cleanup.

## 2025-10-08 – Monorepo reboot
- Split the client/server workspaces, implemented Google OAuth, session heartbeat, initial course player scaffolding, and documented the refreshed architecture.
