import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  runTransaction, 
  collection, 
  Timestamp, 
  increment 
} from "firebase/firestore";
import { EventType } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { type, playerId } = body;

    const matchRef = doc(db, "matches", id);
    const playerRef = doc(db, "players", playerId);

    const [matchSnap, playerSnap] = await Promise.all([
      getDoc(matchRef),
      getDoc(playerRef)
    ]);

    if (!matchSnap.exists() || !playerSnap.exists()) {
      return NextResponse.json({ error: "Données introuvables" }, { status: 404 });
    }
    if (matchSnap.data().status === "FINI") {
      return NextResponse.json({ error: "Match terminé" }, { status: 400 });
    }

    const matchData = matchSnap.data();
    const playerData = playerSnap.data();
    const isTeamA = playerData.teamId === matchData.teamAId;

    const result = await runTransaction(db, async (transaction) => {
      const eventRef = doc(collection(db, "matches", id, "events"));
      const eventData = {
        playerId,
        type,
        createdAt: Timestamp.now(),
        isTab: true
      };

      // Note: TAB scores are derived from events, we don't increment the main match score
      // if (type === EventType.TAB_SCORE) {
      //   transaction.update(matchRef, {
      //     [isTeamA ? "scoreA" : "scoreB"]: increment(1)
      //   });
      // }

      transaction.set(eventRef, eventData);
      return { id: eventRef.id, ...eventData };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST Match TAB Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
