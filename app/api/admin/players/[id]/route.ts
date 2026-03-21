import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc, query, collection, where, getDocs, limit } from "firebase/firestore";
import { updatePlayerSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updatePlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const playerRef = doc(db, "players", id);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
  }

  const currentPlayer = playerSnap.data();

  // Duplicate name check if firstName, lastName or teamId is updated
  if (parsed.data.firstName || parsed.data.lastName || parsed.data.teamId) {
    const firstName = parsed.data.firstName ?? currentPlayer.firstName;
    const lastName = parsed.data.lastName ?? currentPlayer.lastName;
    const teamId = parsed.data.teamId ?? currentPlayer.teamId;

    const qExisting = query(
      collection(db, "players"),
      where("teamId", "==", teamId),
      where("firstName", "==", firstName),
      where("lastName", "==", lastName),
      limit(2) // We only need to find if there's *any other* player
    );
    const snapExisting = await getDocs(qExisting);
    
    const otherPlayer = snapExisting.docs.find(doc => doc.id !== id);

    if (otherPlayer) {
      return NextResponse.json({ error: "Un joueur avec ce nom et ce prénom existe déjà dans cette salle/équipe" }, { status: 400 });
    }
  }

  const updateData: any = { ...parsed.data };
  if (updateData.firstName === "") delete updateData.firstName;
  if (updateData.lastName === "") delete updateData.lastName;

  await updateDoc(playerRef, updateData);

  return NextResponse.json({ id, ...currentPlayer, ...updateData });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    await deleteDoc(doc(db, "players", id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer le joueur." }, { status: 400 });
  }
}
