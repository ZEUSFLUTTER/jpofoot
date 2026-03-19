import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  runTransaction, 
  collection, 
  getDocs,
  Timestamp, 
  increment,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { createEventSchema } from "@/lib/validators";
import { MatchStatus, EventType } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const matchRef = doc(db, "matches", id);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const matchData = matchSnap.data() as any;
    const allowedStatuses = [MatchStatus.LIVE, MatchStatus.MT, MatchStatus.MT2, MatchStatus.PROLO, MatchStatus.TAB];

    if (!allowedStatuses.includes(matchData.status)) {
      return NextResponse.json({ error: "Le match n'est pas dans un état permettant l'ajout d'événements" }, { status: 400 });
    }

    // Verify player belongs to one of the teams
    const playerRef = doc(db, "players", parsed.data.playerId);
    const playerSnap = await getDoc(playerRef);

    if (!playerSnap.exists()) {
      return NextResponse.json({ error: "Joueur introuvable" }, { status: 400 });
    }

    const playerData = playerSnap.data() as any;
    if (playerData.teamId !== matchData.teamAId && playerData.teamId !== matchData.teamBId) {
      return NextResponse.json({ error: "Le joueur sélectionné ne fait pas partie de ce match" }, { status: 400 });
    }

    const scorerIsTeamA = playerData.teamId === matchData.teamAId;

    // 0. If RED card, pre-fetch next 2 matches for suspension
    let suspendedMatchIds: string[] = [];
    if (parsed.data.type === EventType.RED) {
      const allMatchesQuery = query(
        collection(db, "matches"),
        where("date", ">", matchData.date),
        orderBy("date", "asc")
      );
      const nextMatchesSnap = await getDocs(allMatchesQuery);
      suspendedMatchIds = nextMatchesSnap.docs
        .filter(d => d.data().teamAId === playerData.teamId || d.data().teamBId === playerData.teamId)
        .slice(0, 2)
        .map(d => d.id);
    }

    const result = await runTransaction(db, async (transaction) => {
      // 1. Prepare event data
      const eventRef = doc(collection(db, "matches", id, "events"));
      const eventData: any = {
        playerId: parsed.data.playerId,
        minute: parsed.data.minute,
        type: parsed.data.type,
        relatedToId: parsed.data.relatedToId || null,
        createdAt: Timestamp.now()
      };

      if (parsed.data.type === EventType.RED) {
        eventData.suspendedMatchIds = suspendedMatchIds;
      }

      // 2. Update Match
      const matchUpdates: any = { liveMinute: parsed.data.minute };
      if (parsed.data.type === EventType.GOAL) {
        matchUpdates[scorerIsTeamA ? "scoreA" : "scoreB"] = increment(1);
      }
      transaction.update(matchRef, matchUpdates);

      // 3. Update Scoring Player Stats
      const playerUpdate: any = { "stats.updatedAt": Timestamp.now() };
      
      if (parsed.data.type === EventType.GOAL) {
        playerUpdate["stats.goals"] = increment(1);
      } else if (parsed.data.type === EventType.ASSIST) {
        playerUpdate["stats.assists"] = increment(1);
      } else if (parsed.data.type === EventType.YELLOW) {
        playerUpdate["stats.yellowCards"] = increment(1);
      } else if (parsed.data.type === EventType.RED) {
        playerUpdate["stats.redCards"] = increment(1);
        // Update suspensions
        const currentSuspensions = playerData.suspensions || [];
        playerUpdate.suspensions = [...new Set([...currentSuspensions, ...suspendedMatchIds])];
      }
      
      transaction.update(playerRef, playerUpdate);

      // 4. Update Assisting Player Stats
      if (parsed.data.type === EventType.GOAL && parsed.data.relatedToId) {
        const assistPlayerRef = doc(db, "players", parsed.data.relatedToId);
        transaction.update(assistPlayerRef, {
          "stats.assists": increment(1),
          "stats.updatedAt": Timestamp.now()
        });
      }

      // 5. Create Event
      transaction.set(eventRef, eventData);
      return { id: eventRef.id, ...eventData };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST Match Event Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
