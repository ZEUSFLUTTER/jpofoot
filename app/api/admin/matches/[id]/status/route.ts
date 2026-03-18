import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { updateStatusSchema } from "@/lib/validators";
import { MatchStatus } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matchRef = doc(db, "matches", id);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  const match = matchSnap.data();

  if (match.status === MatchStatus.FINI) {
    return NextResponse.json({ error: "Ce match est déjà terminé et validé." }, { status: 400 });
  }

  if (parsed.data.status === MatchStatus.LIVE) {
    const matchDate = match.date instanceof Timestamp ? match.date.toDate() : new Date(match.date);
    if (matchDate > new Date()) {
      return NextResponse.json({ error: "Le match ne peut pas être lancé avant l'heure prévue." }, { status: 400 });
    }
  }

  const updateData: any = {
    status: parsed.data.status,
  };
  
  if (parsed.data.liveMinute !== undefined) {
    updateData.liveMinute = parsed.data.liveMinute;
  }

  await updateDoc(matchRef, updateData);

  return NextResponse.json({ id, ...match, ...updateData });
}
