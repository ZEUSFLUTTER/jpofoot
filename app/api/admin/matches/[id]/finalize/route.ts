import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { finalizeMatchSchema } from "@/lib/validators";
import { MatchStatus } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = finalizeMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matchRef = doc(db, "matches", id);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  const matchData = matchSnap.data();

  if (matchData.status === MatchStatus.FINI) {
    return NextResponse.json({ error: "Ce match a déjà été validé." }, { status: 400 });
  }

  const updatedData = {
    scoreA: parsed.data.scoreA,
    scoreB: parsed.data.scoreB,
    status: MatchStatus.FINI,
    liveMinute: 90,
  };

  await updateDoc(matchRef, updatedData);

  // Fetch teams for return object
  const [teamASnap, teamBSnap] = await Promise.all([
    getDoc(doc(db, "teams", matchData.teamAId)),
    getDoc(doc(db, "teams", matchData.teamBId))
  ]);

  return NextResponse.json({
    id,
    ...matchData,
    ...updatedData,
    teamA: { id: teamASnap.id, ...teamASnap.data() },
    teamB: { id: teamBSnap.id, ...teamBSnap.data() }
  });
}
