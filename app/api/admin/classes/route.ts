import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTeamSchema } from "@/lib/validators";

export async function GET() {
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createTeamSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl || null,
      colors: parsed.data.colors || null,
    },
  });

  return NextResponse.json(team, { status: 201 });
}
