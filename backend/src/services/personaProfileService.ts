import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { classifyLearnerPersona } from "../rag/openAiClient";
import { PERSONA_KEYS, PERSONA_PROFILE_VERSION, type PersonaKey } from "./personaPromptTemplates";

export type PersonaProfileResponse = {
  questionId: string;
  prompt: string;
  answer: string;
};

const KEYWORD_MAP: Record<PersonaKey, string[]> = {
  english_hesitant: ["english", "language", "hindi", "vernacular", "translate", "fluency", "grammar"],
  non_it_migrant: ["mechanical", "civil", "electrical", "non-it", "core branch", "manufacturing", "machines"],
  last_minute_panic: ["last minute", "deadline", "panic", "final sprint", "urgent", "cram", "tomorrow"],
  pseudo_coder: ["copy", "paste", "github", "template", "clone", "youtube", "snippet"],
  rote_memorizer: ["memorize", "theory", "definitions", "exam", "interview", "mcq"],
  default: [],
};

export const DEFAULT_PERSONA_KEY: string = "default";

function scorePersonaFromText(text: string): {
  personaKey: PersonaKey;
  reason: string;
} {
  const normalized = text.toLowerCase();
  const scorableKeys = PERSONA_KEYS.filter((k) => k !== "default");
  const scores = scorableKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  scorableKeys.forEach((key) => {
    const hits = KEYWORD_MAP[key].reduce((count, keyword) => {
      return normalized.includes(keyword) ? count + 1 : count;
    }, 0);
    scores[key] = hits;
  });

  const sorted = scorableKeys.sort((a, b) => scores[b] - scores[a]);
  const best = sorted[0];
  if (!best || scores[best] === 0) {
    return { personaKey: "default", reason: "No keyword signals detected; using default persona." };
  }
  return {
    personaKey: best as PersonaKey,
    reason: `Keyword-based classification: ${scores[best]} hits for "${best}".`,
  };
}

export async function analyzePersonaProfile(
  responses: PersonaProfileResponse[],
): Promise<{ personaKey: PersonaKey; analysisSummary: string; analysisVersion: string }> {
  const joined = responses
    .map((item) => `${item.prompt}\n${item.answer}`)
    .join("\n\n");

  try {
    const result = await classifyLearnerPersona({
      responses: responses.map((item) => ({ question: item.prompt, answer: item.answer })),
    });
    const personaKey = PERSONA_KEYS.find((key) => key === result.personaKey) ?? null;
    if (!personaKey) {
      throw new Error(`Unsupported personaKey: ${result.personaKey}`);
    }
    return {
      personaKey,
      analysisSummary: result.reasoning ?? "Persona classified by AI.",
      analysisVersion: PERSONA_PROFILE_VERSION,
    };
  } catch (error) {
    const fallback = scorePersonaFromText(joined);
    return {
      personaKey: fallback.personaKey,
      analysisSummary: fallback.reason,
      analysisVersion: `${PERSONA_PROFILE_VERSION}-fallback`,
    };
  }
}

/**
 * Resolves the persona for a learner strictly from their CohortMember record.
 * Returns "default" if no cohort persona is set — this is a READ-ONLY operation.
 * Persona assignment is handled exclusively by the admin side.
 */
export async function ensurePersonaProfile(params: {
  userId: string;
  courseId: string;
}): Promise<{ personaKey: string | null; updatedAt: Date }> {
  const user = await prisma.user.findUnique({
    where: { userId: params.userId },
    select: { email: true },
  });

  if (!user) {
    return { personaKey: null, updatedAt: new Date() };
  }

  const membership = await prisma.cohortMember.findFirst({
    where: {
      cohort: { offering: { courseId: params.courseId } },
      status: "active",
      OR: [
        { userId: params.userId },
        { email: { equals: user.email, mode: "insensitive" } },
      ],
    },
    select: { persona: true, addedAt: true },
  });

  if (membership?.persona) {
    return {
      personaKey: membership.persona,
      updatedAt: membership.addedAt,
    };
  }

  // No cohort persona assigned yet — return null
  return { personaKey: null, updatedAt: new Date() };
}

/**
 * Read-only lookup of the current persona from CohortMember.
 * Returns null if the user has no active membership for the course.
 */
export async function getPersonaProfile(params: { userId: string; courseId: string }) {
  const user = await prisma.user.findUnique({
    where: { userId: params.userId },
    select: { email: true },
  });

  if (!user) return null;

  const membership = await prisma.cohortMember.findFirst({
    where: {
      cohort: { offering: { courseId: params.courseId } },
      status: "active",
      OR: [
        { userId: params.userId },
        { email: { equals: user.email, mode: "insensitive" } },
      ],
    },
    select: { persona: true, addedAt: true },
  });

  if (!membership) return null;

  return {
    personaKey: membership.persona,
    updatedAt: membership.addedAt,
  };
}
