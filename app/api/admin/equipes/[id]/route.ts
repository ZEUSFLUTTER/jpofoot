import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, getDocs, query, collection, where, limit } from "firebase/firestore";
import { updateTeamSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateTeamSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const teamRef = doc(db, "teams", id);
  await updateDoc(teamRef, parsed.data as any);

  return NextResponse.json({ id, ...parsed.data });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    // Check if team is linked to matches
    const qA = query(collection(db, "matches"), where("teamAId", "==", id), limit(1));
    const qB = query(collection(db, "matches"), where("teamBId", "==", id), limit(1));
    const [snapA, snapB] = await Promise.all([getDocs(qA), getDocs(qB)]);

    if (!snapA.empty || !snapB.empty) {
      throw new Error("Linked to matches");
    }

    await deleteDoc(doc(db, "teams", id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer l'équipe. Assurez-vous qu'elle n'est pas liée à des matchs." }, { status: 400 });
  }
}
