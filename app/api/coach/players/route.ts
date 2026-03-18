import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { cookies } from "next/headers";
import { createPlayerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("coach_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { teamId } = session;

    const body = await request.json();
    // Enforce the coach's teamId
    body.teamId = teamId;
    
    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const playerData = {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      number: parsed.data.number,
      position: parsed.data.position || null,
      photoUrl: parsed.data.photoUrl || null,
      teamId: teamId,
      createdAt: Timestamp.now(),
      stats: {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        updatedAt: Timestamp.now()
      }
    };

    const docRef = await addDoc(collection(db, "players"), playerData);

    return NextResponse.json({ id: docRef.id, ...playerData }, { status: 201 });
  } catch (error) {
    console.error("Coach Add Player Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
