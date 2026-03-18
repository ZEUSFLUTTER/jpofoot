/**
 * Frontend-safe versions of Prisma enums.
 * These are used in Client Components to avoid importing directly from @prisma/client,
 * which can cause build errors on Vercel/Turbopack.
 */

export const MatchStatus = {
  PREVU: "PREVU",
  LIVE: "LIVE",
  FINI: "FINI",
} as const;

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const EventType = {
  GOAL: "GOAL",
  ASSIST: "ASSIST",
  YELLOW: "YELLOW",
  RED: "RED",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];
