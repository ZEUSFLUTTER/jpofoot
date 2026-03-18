import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPlayerSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  const players = await prisma.player.findMany({
    where: teamId ? { teamId } : undefined,
    include: {
      team: true,
      stats: true,
    },
    orderBy: [{ teamId: "asc" }, { number: "asc" }, { lastName: "asc" }],
  });

  return NextResponse.json(players);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createPlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existingPlayer = await prisma.player.findFirst({
    where: {
      teamId: parsed.data.teamId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
    },
  });

  if (existingPlayer) {
    return NextResponse.json({ error: "Un joueur avec ce nom et ce prénom existe déjà dans cette salle/équipe" }, { status: 400 });
  }

  const player = await prisma.player.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      number: parsed.data.number,
      teamId: parsed.data.teamId,
      position: parsed.data.position || null,
      photoUrl: parsed.data.photoUrl || null,
      stats: {
        create: {},
      },
    },
    include: {
      team: true,
      stats: true,
    },
  });

  return NextResponse.json(player, { status: 201 });
}
