import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection, 
  runTransaction, 
  Timestamp,
  increment,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { createEventSchema } from "@/lib/validators";
import { EventType, MatchStatus } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      const matchRef = doc(db, "matches", id);
      const matchSnap = await transaction.get(matchRef);

      if (!matchSnap.exists()) {
        throw new Error("Match introuvable");
      }

      const match = matchSnap.data();

      if (match.status !== MatchStatus.LIVE) {
        throw new Error("Le match doit être en direct pour ajouter un événement");
      }

      // Check if teamA and teamB IDs match the player's team (we'll fetch players)
      const playerRef = doc(db, "players", parsed.data.playerId);
      const playerSnap = await transaction.get(playerRef);
      if (!playerSnap.exists()) throw new Error("Joueur introuvable");
      
      const player = playerSnap.data();
      if (player.teamId !== match.teamAId && player.teamId !== match.teamBId) {
        throw new Error("Le joueur sélectionné ne fait pas partie de ce match");
      }

      const scorerIsTeamA = player.teamId === match.teamAId;

      // Event creation (addDoc doesn't work in transactions, need to use doc(collection()))
      const eventRef = doc(collection(db, "matches", id, "events"));
      const eventData = {
        playerId: parsed.data.playerId,
        minute: parsed.data.minute,
        type: parsed.data.type,
        relatedToId: parsed.data.relatedToId || null,
        createdAt: Timestamp.now(),
      };
      
      transaction.set(eventRef, eventData);

      // Update Match
      const matchUpdate: any = { liveMinute: parsed.data.minute };
      if (parsed.data.type === EventType.GOAL) {
        if (scorerIsTeamA) {
          matchUpdate.scoreA = increment(1);
        } else {
          matchUpdate.scoreB = increment(1);
        }
      }
      transaction.update(matchRef, matchUpdate);

      // Update Player Stats
      const playerUpdate: any = { 
        "stats.updatedAt": Timestamp.now() 
      };
      
      if (parsed.data.type === EventType.GOAL) playerUpdate["stats.goals"] = increment(1);
      if (parsed.data.type === EventType.YELLOW) playerUpdate["stats.yellowCards"] = increment(1);
      if (parsed.data.type === EventType.RED) playerUpdate["stats.redCards"] = increment(1);
      
      transaction.update(playerRef, playerUpdate);

      // Update assistant stats if applicable
      if (parsed.data.relatedToId) {
        const assistRef = doc(db, "players", parsed.data.relatedToId);
        transaction.update(assistRef, {
          "stats.assists": increment(1),
          "stats.updatedAt": Timestamp.now()
        });
      }

      return { id: eventRef.id, ...eventData };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
