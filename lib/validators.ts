import { EventType, MatchStatus } from "./types";
import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().url().optional().or(z.literal("")),
  colors: z.string().optional(),
  poule: z.string().optional(),
  coachFirstName: z.string().min(2),
  coachLastName: z.string().min(2),
});

export const updateTeamSchema = createTeamSchema.partial();

export const createPlayerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  number: z.coerce.number().int().min(1).max(99),
  teamId: z.string().min(1),
  position: z.string().optional(),
  photoUrl: z.string().optional().or(z.literal("")),
});

export const updatePlayerSchema = createPlayerSchema.partial();

export const createMatchSchema = z.object({
  teamAId: z.string().min(1),
  teamBId: z.string().min(1),
  date: z.string().datetime(),
  title: z.string().optional(),
  meetUrl: z.string().url().optional().or(z.literal("")),
});

export const updateMatchSchema = createMatchSchema.partial();

export const updateStatusSchema = z.object({
  status: z.nativeEnum(MatchStatus),
  liveMinute: z.coerce.number().int().min(0).max(130).optional(),
});

export const createEventSchema = z
  .object({
    type: z.nativeEnum(EventType),
    playerId: z.string().min(1),
    minute: z.coerce.number().int().min(0).max(130).optional(),
    relatedToId: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.type === EventType.GOAL && value.relatedToId && value.relatedToId === value.playerId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le passeur doit être différent du buteur",
        path: ["relatedToId"],
      });
    }
  });

export const finalizeMatchSchema = z.object({
  scoreA: z.coerce.number().int().min(0),
  scoreB: z.coerce.number().int().min(0),
});
