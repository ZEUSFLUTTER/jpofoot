import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateStatusSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id },
    select: { status: true, date: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  if (match.status === "FINI") {
    return NextResponse.json({ error: "Ce match est déjà terminé et validé." }, { status: 400 });
  }

  if (parsed.data.status === "LIVE") {
    if (new Date(match.date) > new Date()) {
      return NextResponse.json({ error: "Le match ne peut pas être lancé avant l'heure prévue." }, { status: 400 });
    }
  }

  const updated = await prisma.match.update({
    where: { id },
    data: {
      status: parsed.data.status,
      liveMinute: parsed.data.liveMinute ?? undefined,
    },
  });

  return NextResponse.json(updated);
}
