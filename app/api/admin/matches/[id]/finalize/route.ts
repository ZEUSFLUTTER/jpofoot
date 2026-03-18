import { MatchStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finalizeMatchSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = finalizeMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matchExists = await prisma.match.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!matchExists) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  if (matchExists.status === MatchStatus.FINI) {
    return NextResponse.json({ error: "Ce match a déjà été validé." }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id },
    data: {
      scoreA: parsed.data.scoreA,
      scoreB: parsed.data.scoreB,
      status: MatchStatus.FINI,
      liveMinute: 90,
    },
    include: {
      teamA: true,
      teamB: true,
    },
  });

  return NextResponse.json(match);
}
