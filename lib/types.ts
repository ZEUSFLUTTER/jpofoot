/**
 * Application-wide enums for Match Status and Event Types.
 * These are used across the application to ensure Type-safety in both Server and Client Components.
 */

export const MatchStatus = {
  PREVU: "PREVU",
  LIVE: "LIVE", // Mi-temps 1
  MT: "MT",     // Mi-temps
  MT2: "MT2",   // Mi-temps 2
  PROLO: "PROLO", // Prolongations
  TAB: "TAB",     // Tirs au but
  FINI: "FINI",
} as const;

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const EventType = {
  GOAL: "GOAL",
  ASSIST: "ASSIST",
  YELLOW: "YELLOW",
  RED: "RED",
  SUB: "SUB",
  TAB_SCORE: "TAB_SCORE",
  TAB_MISS: "TAB_MISS",
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export type Manager = {
  id: string;
  firstName: string;
  password?: string;
  assignedMatchIds?: string[];
};
