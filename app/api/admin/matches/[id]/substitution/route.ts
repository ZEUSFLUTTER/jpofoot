import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  runTransaction, 
  collection, 
  Timestamp 
} from "firebase/firestore";
import { EventType } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { playerId, playerInId, minute } = body;

    const matchRef = doc(db, "matches", id);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const result = await runTransaction(db, async (transaction) => {
      const eventRef = doc(collection(db, "matches", id, "events"));
      const eventData = {
        playerId,
        playerInId, // Extra field for subs
        minute: Number(minute),
        type: EventType.SUB,
        createdAt: Timestamp.now()
      };

      transaction.update(matchRef, { liveMinute: Number(minute) });
      transaction.set(eventRef, eventData);

      return { id: eventRef.id, ...eventData };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST Match Sub Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
