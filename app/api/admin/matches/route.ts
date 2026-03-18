import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMatchSchema } from "@/lib/validators";

export async function GET() {
  const matches = await prisma.match.findMany({
    include: {
      teamA: true,
      teamB: true,
      events: {
        include: {
          player: true,
          relatedTo: true,
        },
        orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.teamAId === parsed.data.teamBId) {
    return NextResponse.json({ error: "Une équipe ne peut pas jouer contre elle-même" }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      teamAId: parsed.data.teamAId,
      teamBId: parsed.data.teamBId,
      date: new Date(parsed.data.date),
    },
    include: {
      teamA: true,
      teamB: true,
    },
  });

  return NextResponse.json(match, { status: 201 });
}
