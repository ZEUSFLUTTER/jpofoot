import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePlayerSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updatePlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Duplicate name check if firstName or lastName is updated
  if (parsed.data.firstName || parsed.data.lastName || parsed.data.teamId) {
    const player = await prisma.player.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, teamId: true },
    });

    if (player) {
      const firstName = parsed.data.firstName ?? player.firstName;
      const lastName = parsed.data.lastName ?? player.lastName;
      const teamId = parsed.data.teamId ?? player.teamId;

      const existingPlayer = await prisma.player.findFirst({
        where: {
          teamId,
          firstName,
          lastName,
          NOT: { id },
        },
      });

      if (existingPlayer) {
        return NextResponse.json({ error: "Un joueur avec ce nom et ce prénom existe déjà dans cette salle/équipe" }, { status: 400 });
      }
    }
  }

  const updated = await prisma.player.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    await prisma.player.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer le joueur." }, { status: 400 });
  }
}
