import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateMatchSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.match.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    await prisma.match.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer le match. Assurez-vous qu'il n'est pas lié à des événements." }, { status: 400 });
  }
}
