import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, runTransaction, Timestamp, increment } from "firebase/firestore";
import { EventType } from "@/lib/types";

type Context = { params: Promise<{ id: string; eventId: string }> };

export async function DELETE(request: Request, context: Context) {
  const { id: matchId, eventId } = await context.params;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const matchRef = doc(db, "matches", matchId);
      const eventRef = doc(db, "matches", matchId, "events", eventId);
      
      const [matchSnap, eventSnap] = await Promise.all([
        transaction.get(matchRef),
        transaction.get(eventRef)
      ]);

      if (!matchSnap.exists()) throw new Error("Match introuvable");
      if (!eventSnap.exists()) throw new Error("Événement introuvable");

      const match = matchSnap.data();
      const event = eventSnap.data();

      if (match.status === "FINI") {
        throw new Error("Impossible de modifier un match terminé et validé.");
      }

      // Update Player Stats
      const playerRef = doc(db, "players", event.playerId);
      const playerUpdate: any = { "stats.updatedAt": Timestamp.now() };

      if (event.type === EventType.GOAL) playerUpdate["stats.goals"] = increment(-1);
      if (event.type === EventType.YELLOW) playerUpdate["stats.yellowCards"] = increment(-1);
      if (event.type === EventType.RED) {
        playerUpdate["stats.redCards"] = increment(-1);
        if (event.suspendedMatchIds && Array.isArray(event.suspendedMatchIds)) {
          const playerSnap = await transaction.get(playerRef);
          const playerData = playerSnap.data() || {};
          const currentSuspensions = playerData.suspensions || [];
          playerUpdate.suspensions = currentSuspensions.filter((id: string) => !event.suspendedMatchIds.includes(id));
        }
      }

      transaction.update(playerRef, playerUpdate);

      if (event.relatedToId) {
        const assistRef = doc(db, "players", event.relatedToId);
        transaction.update(assistRef, {
          "stats.assists": increment(-1),
          "stats.updatedAt": Timestamp.now()
        });
      }

      // Update Match Score if Goal or if it was a TAB_SCORE that incorrectly updated the main score
      if (event.type === EventType.GOAL || event.type === EventType.TAB_SCORE) {
        const playerSnap = await transaction.get(playerRef);
        const player = playerSnap.data();
        if (!player) throw new Error("Joueur introuvable lors de la mise à jour du score");
        const isTeamA = player.teamId === match.teamAId;
        
        transaction.update(matchRef, {
          [isTeamA ? "scoreA" : "scoreB"]: increment(-1)
        });
      }

      transaction.delete(eventRef);

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
