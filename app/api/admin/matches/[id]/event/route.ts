import { EventType, MatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      teamA: { include: { players: true } },
      teamB: { include: { players: true } },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  if (match.status !== MatchStatus.LIVE) {
    return NextResponse.json({ error: "Le match doit être en direct pour ajouter un événement" }, { status: 400 });
  }

  const teamPlayerIds = new Set([
    ...match.teamA.players.map((player) => player.id),
    ...match.teamB.players.map((player) => player.id),
  ]);

  if (!teamPlayerIds.has(parsed.data.playerId)) {
    return NextResponse.json({ error: "Le joueur sélectionné ne fait pas partie de ce match" }, { status: 400 });
  }

  if (parsed.data.relatedToId && !teamPlayerIds.has(parsed.data.relatedToId)) {
    return NextResponse.json({ error: "Le passeur sélectionné ne fait pas partie de ce match" }, { status: 400 });
  }

  const scorerIsTeamA = match.teamA.players.some((player) => player.id === parsed.data.playerId);

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.matchEvent.create({
      data: {
        matchId: id,
        playerId: parsed.data.playerId,
        minute: parsed.data.minute,
        type: parsed.data.type,
        relatedToId: parsed.data.relatedToId || null,
      },
      include: {
        player: true,
        relatedTo: true,
      },
    });

    if (parsed.data.type === EventType.GOAL) {
      await tx.match.update({
        where: { id },
        data: scorerIsTeamA ? { scoreA: { increment: 1 } } : { scoreB: { increment: 1 } },
      });

      await tx.playerStat.upsert({
        where: { playerId: parsed.data.playerId },
        create: { playerId: parsed.data.playerId, goals: 1 },
        update: { goals: { increment: 1 } },
      });

      if (parsed.data.relatedToId) {
        await tx.playerStat.upsert({
          where: { playerId: parsed.data.relatedToId },
          create: { playerId: parsed.data.relatedToId, assists: 1 },
          update: { assists: { increment: 1 } },
        });
      }
    }

    if (parsed.data.type === EventType.ASSIST) {
      await tx.playerStat.upsert({
        where: { playerId: parsed.data.playerId },
        create: { playerId: parsed.data.playerId, assists: 1 },
        update: { assists: { increment: 1 } },
      });
    }

    if (parsed.data.type === EventType.YELLOW) {
      await tx.playerStat.upsert({
        where: { playerId: parsed.data.playerId },
        create: { playerId: parsed.data.playerId, yellowCards: 1 },
        update: { yellowCards: { increment: 1 } },
      });
    }

    if (parsed.data.type === EventType.RED) {
      await tx.playerStat.upsert({
        where: { playerId: parsed.data.playerId },
        create: { playerId: parsed.data.playerId, redCards: 1 },
        update: { redCards: { increment: 1 } },
      });
    }

    await tx.match.update({
      where: { id },
      data: {
        liveMinute: parsed.data.minute,
      },
    });

    return event;
  });

  return NextResponse.json(result, { status: 201 });
}
