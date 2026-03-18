import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { createMatchSchema } from "@/lib/validators";
import { MatchStatus } from "@/lib/types";

export async function GET() {
  try {
    const [matchesSnap, teamsSnap] = await Promise.all([
      getDocs(query(collection(db, "matches"), orderBy("date", "asc"))),
      getDocs(collection(db, "teams"))
    ]);

    const teamsMap = new Map();
    teamsSnap.docs.forEach(d => teamsMap.set(d.id, { id: d.id, ...d.data() }));

    const matches = await Promise.all(matchesSnap.docs.map(async (m) => {
      const data = m.data() as any;
      
      // Fetch events for each match (subcollection)
      const eventsSnap = await getDocs(query(
        collection(db, "matches", m.id, "events"),
        orderBy("minute", "asc")
      ));
      
      const events = eventsSnap.docs.map(ed => ({
        id: ed.id,
        ...ed.data()
      }));

      return {
        id: m.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        teamA: teamsMap.get(data.teamAId) || null,
        teamB: teamsMap.get(data.teamBId) || null,
        events: events
      };
    }));

    return NextResponse.json(matches);
  } catch (error) {
    console.error("GET Matches Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.teamAId === parsed.data.teamBId) {
      return NextResponse.json({ error: "Une équipe ne peut pas jouer contre elle-même" }, { status: 400 });
    }

    const matchData = {
      teamAId: parsed.data.teamAId,
      teamBId: parsed.data.teamBId,
      date: Timestamp.fromDate(new Date(parsed.data.date)),
      status: MatchStatus.PREVU,
      scoreA: 0,
      scoreB: 0,
      liveMinute: 0,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, "matches"), matchData);

    // Fetch teams for the response
    const [teamASnap, teamBSnap] = await Promise.all([
      getDocs(query(collection(db, "teams"), orderBy("__name__"), orderBy("name"))).then(s => s.docs.find(d => d.id === parsed.data.teamAId)),
      getDocs(query(collection(db, "teams"), orderBy("__name__"), orderBy("name"))).then(s => s.docs.find(d => d.id === parsed.data.teamBId))
    ]);

    return NextResponse.json({
      id: docRef.id,
      ...matchData,
      date: matchData.date.toDate(),
      teamA: teamASnap ? { id: teamASnap.id, ...teamASnap.data() } : null,
      teamB: teamBSnap ? { id: teamBSnap.id, ...teamBSnap.data() } : null,
    }, { status: 201 });
  } catch (error) {
    console.error("POST Match Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
