import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateStatusSchema } from "@/lib/validators";
import { MatchStatus, isMatchLive } from "@/lib/types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const matchRef = doc(db, "matches", id);
    const matchSnap = await getDoc(matchRef);
    if (!matchSnap.exists()) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }
    const matchData = matchSnap.data();

    if (matchData.status === MatchStatus.FINI) {
      return NextResponse.json({ error: "Match terminé" }, { status: 400 });
    }

    const updates: any = {
      status: parsed.data.status,
    };
    
    if (parsed.data.liveMinute !== undefined) {
      updates.liveMinute = parsed.data.liveMinute;
    }

    const wasPlaying = isMatchLive(matchData.status);
    const isPlaying = isMatchLive(parsed.data.status);

    if (isPlaying) {
      // Start or restart clock if transitioning from non-playing, or if explicitly providing a new minute
      if (!wasPlaying || parsed.data.liveMinute !== undefined) {
        updates.timerStartedAt = new Date().toISOString();
      }
    } else {
       updates.timerStartedAt = null;
       // Freeze clock when transitioning out of a live state
       if (wasPlaying && matchData.timerStartedAt) {
          const elapsed = Math.floor((Date.now() - new Date(matchData.timerStartedAt).getTime()) / 60000);
          // If manager forced a minute in the same request, we use it, otherwise use frozen time
          if (parsed.data.liveMinute === undefined) {
             updates.liveMinute = (matchData.liveMinute || 0) + elapsed;
          }
       }
    }

    await updateDoc(matchRef, updates);

    return NextResponse.json({ id, ...updates });
  } catch (error) {
    console.error("PATCH Match Status Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
