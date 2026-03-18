import { EventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string; eventId: string }> };

export async function DELETE(request: Request, context: Context) {
  const { id: matchId, eventId } = await context.params;

  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    include: {
      match: {
        include: {
          teamA: { include: { players: true } },
          teamB: { include: { players: true } },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  }

  if (event.match.status === "FINI") {
    return NextResponse.json({ error: "Impossible de modifier un match terminé et validé." }, { status: 400 });
  }

  const scorerIsTeamA = event.match.teamA.players.some((player) => player.id === event.playerId);

  const result = await prisma.$transaction(async (tx) => {
    if (event.type === EventType.GOAL) {
      await tx.match.update({
        where: { id: matchId },
        data: scorerIsTeamA ? { scoreA: { decrement: 1 } } : { scoreB: { decrement: 1 } },
      });

      await tx.playerStat.update({
        where: { playerId: event.playerId },
        data: { goals: { decrement: 1 } },
      });

      if (event.relatedToId) {
        await tx.playerStat.update({
          where: { playerId: event.relatedToId },
          data: { assists: { decrement: 1 } },
        });
      }
    }

    if (event.type === EventType.ASSIST) {
      await tx.playerStat.update({
        where: { playerId: event.playerId },
        data: { assists: { decrement: 1 } },
      });
    }

    if (event.type === EventType.YELLOW) {
      await tx.playerStat.update({
        where: { playerId: event.playerId },
        data: { yellowCards: { decrement: 1 } },
      });
    }

    if (event.type === EventType.RED) {
      await tx.playerStat.update({
        where: { playerId: event.playerId },
        data: { redCards: { decrement: 1 } },
      });
    }

    await tx.matchEvent.delete({
      where: { id: eventId },
    });

    return { success: true };
  });

  return NextResponse.json(result);
}
