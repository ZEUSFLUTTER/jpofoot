import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, getDocs, collection, Timestamp, writeBatch, getDoc, increment } from "firebase/firestore";
import { updateMatchSchema } from "@/lib/validators";
import { EventType } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matchRef = doc(db, "matches", id);
  const updateData: any = { ...parsed.data };
  
  if (parsed.data.date) {
    updateData.date = Timestamp.fromDate(new Date(parsed.data.date));
  }

  if (body.meetUrl !== undefined) {
    updateData.meetUrl = body.meetUrl || null;
  }

  await updateDoc(matchRef, updateData);

  return NextResponse.json({ id, ...updateData });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    // Delete events first (subcollection)
    const eventsSnap = await getDocs(collection(db, "matches", id, "events"));

    // Revert player stats for all events before deletion
    for (const docSnap of eventsSnap.docs) {
      const event = docSnap.data();
      
      // If the event doesn't have a playerId, it might be a malformed event, skip
      if (!event.playerId) continue;

      const playerRef = doc(db, "players", event.playerId);
      const playerUpdate: any = { "stats.updatedAt": Timestamp.now() };

      if (event.type === EventType.GOAL) playerUpdate["stats.goals"] = increment(-1);
      if (event.type === EventType.YELLOW) playerUpdate["stats.yellowCards"] = increment(-1);
      if (event.type === EventType.RED) {
        playerUpdate["stats.redCards"] = increment(-1);
        if (event.suspendedMatchIds && Array.isArray(event.suspendedMatchIds)) {
          try {
            const pSnap = await getDoc(playerRef);
            if (pSnap.exists()) {
               const pData = pSnap.data();
               const currentSuspensions = pData.suspensions || [];
               playerUpdate.suspensions = currentSuspensions.filter((sid: string) => !event.suspendedMatchIds.includes(sid));
            }
          } catch (e) {}
        }
      }
      
      try {
        // Skip updates if the event type didn't impact main stats we track (like SUB)
        if (Object.keys(playerUpdate).length > 1) {
          await updateDoc(playerRef, playerUpdate);
        }
      } catch (e) {
        console.error("Erreur lors de l'inversion des stats pour le joueur", event.playerId, e);
      }

      if (event.relatedToId) {
        const assistRef = doc(db, "players", event.relatedToId);
        try {
          await updateDoc(assistRef, {
            "stats.assists": increment(-1),
            "stats.updatedAt": Timestamp.now()
          });
        } catch (e) {}
      }
    }

    const batch = writeBatch(db);
    eventsSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();

    await deleteDoc(doc(db, "matches", id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer le match. Assurez-vous qu'il n'est pas lié à des événements." }, { status: 400 });
  }
}
