import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { cookies } from "next/headers";
import { createPlayerSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("coach_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { teamId } = session;

    const body = await request.json();
    const parsed = createPlayerSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const playerRef = doc(db, "players", id);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });
    }

    if (playerSnap.data().teamId !== teamId) {
      return NextResponse.json({ error: "Action non autorisée sur ce joueur" }, { status: 403 });
    }

    const updateData: any = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    if (updateData.firstName === "") delete updateData.firstName;
    if (updateData.lastName === "") delete updateData.lastName;

    await updateDoc(playerRef, updateData);

    return NextResponse.json({ message: "Joueur mis à jour" });
  } catch (error) {
    console.error("Coach Update Player Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("coach_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { teamId } = session;

    const playerRef = doc(db, "players", id);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });
    }

    if (playerSnap.data().teamId !== teamId) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    await deleteDoc(playerRef);
    return NextResponse.json({ message: "Joueur supprimé" });
  } catch (error) {
    console.error("Coach Delete Player Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
