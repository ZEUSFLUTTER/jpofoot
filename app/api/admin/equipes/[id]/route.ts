import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTeamSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateTeamSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.team.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    await prisma.team.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer l'équipe. Assurez-vous qu'elle n'est pas liée à des matchs." }, { status: 400 });
  }
}
