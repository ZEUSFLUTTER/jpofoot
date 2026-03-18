import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { finalizeMatchSchema } from "@/lib/validators";
import { MatchStatus } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = finalizeMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const matchRef = doc(db, "matches", id);
    await updateDoc(matchRef, {
      scoreA: parsed.data.scoreA,
      scoreB: parsed.data.scoreB,
      status: MatchStatus.FINI,
      liveMinute: 90,
    });

    return NextResponse.json({ id, ...parsed.data, status: MatchStatus.FINI });
  } catch (error) {
    console.error("PATCH Finalize Match Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
