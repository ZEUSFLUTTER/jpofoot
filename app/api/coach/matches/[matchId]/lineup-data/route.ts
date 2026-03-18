import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { cookies } from "next/headers";

type Context = { params: Promise<{ matchId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { matchId } = await context.params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("coach_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { teamId } = session;

    // Fetch Match
    const matchSnap = await getDoc(doc(db, "matches", matchId));
    if (!matchSnap.exists()) {
      return NextResponse.json({ error: "Match non trouvé" }, { status: 404 });
    }

    const matchData = matchSnap.data();
    const isTeamA = matchData.teamAId === teamId;
    const isTeamB = matchData.teamBId === teamId;

    if (!isTeamA && !isTeamB) {
      return NextResponse.json({ error: "Vous n'êtes pas le coach d'une des équipes de ce match" }, { status: 403 });
    }

    // Fetch Coach's Team & Players — no orderBy to avoid composite index
    const teamSnap = await getDoc(doc(db, "teams", teamId));
    const playersSnap = await getDocs(query(
      collection(db, "players"), 
      where("teamId", "==", teamId)
    ));

    return NextResponse.json({
      match: { id: matchSnap.id, ...matchData },
      team: { id: teamSnap.id, ...teamSnap.data() },
      players: playersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      isTeamA
    });
  } catch (error) {
    console.error("Lineup Data Fetch Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
