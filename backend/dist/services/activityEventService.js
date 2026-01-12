import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
const VIDEO_EVENT_PREFIXES = ["video.play", "video.resume", "video.buffer.end", "progress.snapshot", "persona.", "notes.", "lesson.", "cold_call.", "tutor.response"];
const FRICTION_EVENT_PREFIXES = ["quiz.fail", "quiz.retry", "tutor.prompt", "cold_call.star", "cold_call.submit", "tutor.response_received", "content.friction"];
const ATTENTION_EVENT_PREFIXES = ["idle.", "video.pause", "video.buffer.start", "lesson.locked_click"];
export function classifyEvent(eventType, payload) {
    const normalized = eventType.toLowerCase();
    if (ATTENTION_EVENT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
        return {
            derivedStatus: "attention_drift",
            statusReason: buildReason(eventType, payload, "Idle or pause pattern detected"),
        };
    }
    if (FRICTION_EVENT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
        return {
            derivedStatus: "content_friction",
            statusReason: buildReason(eventType, payload, "Learner signaled friction"),
        };
    }
    if (VIDEO_EVENT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
        return {
            derivedStatus: "engaged",
            statusReason: buildReason(eventType, payload, "Learner interacting with content"),
        };
    }
    return {};
}
function buildReason(eventType, payload, fallback) {
    if (typeof payload === "object" && payload && "reason" in payload) {
        const possible = payload.reason;
        if (typeof possible === "string" && possible.trim()) {
            return possible;
        }
    }
    return `${fallback} (${eventType})`;
}
export async function recordActivityEvents(userId, events) {
    if (events.length === 0) {
        return;
    }
    const rows = events.map((event) => {
        const { derivedStatus, statusReason } = classifyEvent(event.eventType, event.payload);
        return {
            userId,
            courseId: event.courseId,
            moduleNo: event.moduleNo ?? null,
            topicId: event.topicId ?? null,
            eventType: event.eventType,
            payload: event.payload ?? Prisma.JsonNull,
            derivedStatus: derivedStatus ?? null,
            statusReason: statusReason ?? null,
            createdAt: event.occurredAt ?? new Date(),
        };
    });
    await prisma.learnerActivityEvent.createMany({
        data: rows,
    });
}
export async function getLatestStatusesForCourse(courseId) {
    const windowedEvents = await prisma.$queryRaw(Prisma.sql `
    SELECT
      ranked.event_id AS "eventId",
      ranked.user_id AS "userId",
      ranked.course_id AS "courseId",
      ranked.module_no AS "moduleNo",
      ranked.topic_id AS "topicId",
      ranked.event_type AS "eventType",
      ranked.derived_status AS "derivedStatus",
      ranked.status_reason AS "statusReason",
      ranked.created_at AS "createdAt"
    FROM (
      SELECT
        event_id,
        user_id,
        course_id,
        module_no,
        topic_id,
        event_type,
        derived_status,
        status_reason,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
      FROM learner_activity_events
      WHERE course_id = ${courseId}::uuid
    ) ranked
    WHERE ranked.rn <= 20
  `);
    const grouped = new Map();
    windowedEvents.forEach((row) => {
        const list = grouped.get(row.userId) ?? [];
        list.push(row);
        grouped.set(row.userId, list);
    });
    const summaries = [];
    grouped.forEach((events) => {
        const summary = deriveStatusFromEvents(events);
        if (summary) {
            summaries.push(summary);
        }
    });
    return summaries;
}
export async function getLearnerHistory(params) {
    const { userId, courseId, limit, before } = params;
    const beforeFilter = before ? Prisma.sql `AND created_at < ${before}` : Prisma.sql ``;
    const rows = await prisma.$queryRaw(Prisma.sql `
    SELECT
      event_id AS "eventId",
      user_id AS "userId",
      course_id AS "courseId",
      module_no AS "moduleNo",
      topic_id AS "topicId",
      event_type AS "eventType",
      derived_status AS "derivedStatus",
      status_reason AS "statusReason",
      created_at AS "createdAt"
    FROM learner_activity_events
    WHERE user_id = ${userId}::uuid
      AND course_id = ${courseId}::uuid
      ${beforeFilter}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
    return rows;
}
export async function ensureTutorOrAdminAccess(userId, courseId, role) {
    if (role === "admin") {
        return;
    }
    const assignment = await prisma.courseTutor.findFirst({
        where: {
            courseId,
            isActive: true,
            tutor: { userId },
        },
        select: { courseTutorId: true },
    });
    if (!assignment) {
        throw Object.assign(new Error("Tutor is not assigned to this course"), { status: 403 });
    }
}
function deriveStatusFromEvents(events) {
    if (events.length === 0) {
        return null;
    }
    const sorted = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const frictionEvent = sorted.find((event) => event.derivedStatus === "content_friction");
    const attentionEvent = sorted.find((event) => event.derivedStatus === "attention_drift");
    const engagedEvent = sorted.find((event) => event.derivedStatus === "engaged");
    const fallback = sorted[0];
    if (frictionEvent) {
        return { ...frictionEvent, derivedStatus: "content_friction" };
    }
    if (attentionEvent) {
        return { ...attentionEvent, derivedStatus: "attention_drift" };
    }
    if (engagedEvent) {
        return { ...engagedEvent, derivedStatus: "engaged" };
    }
    return fallback;
}
