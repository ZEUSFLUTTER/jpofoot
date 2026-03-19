import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { cookies } from "next/headers";

type Context = { params: Promise<{ matchId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { matchId } = await context.params;
    const { formation, starting11, substitutes, positions, published } = await request.json();
    
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("coach_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { teamId } = session;

    // Fetch Match
    const matchRef = doc(db, "matches", matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    const matchData = matchSnap.data();
    const isTeamA = matchData.teamAId === teamId;
    const isTeamB = matchData.teamBId === teamId;

    if (!isTeamA && !isTeamB) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const lineupKey = isTeamA ? "teamA" : "teamB";
    
    // Update the specific team's lineup in the match document
    await updateDoc(matchRef, {
      [`lineups.${lineupKey}`]: {
        formation,
        starting11,
        substitutes,
        positions: positions || {},
        isPublished: !!published,
        updatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save Lineup Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
