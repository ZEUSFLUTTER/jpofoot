/**
 * Application-wide enums for Match Status and Event Types.
 * These are used across the application to ensure Type-safety in both Server and Client Components.
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
