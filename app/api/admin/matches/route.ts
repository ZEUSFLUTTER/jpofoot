import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, doc, getDoc, Timestamp } from "firebase/firestore";
import { createMatchSchema } from "@/lib/validators";
import { MatchStatus } from "@/lib/types";

export async function GET() {
  const matchesSnap = await getDocs(query(collection(db, "matches"), orderBy("date", "asc")));
  
  const matches = await Promise.all(matchesSnap.docs.map(async (m) => {
    const data = m.data();
    const [teamASnap, teamBSnap, eventsSnap] = await Promise.all([
      getDoc(doc(db, "teams", data.teamAId)),
      getDoc(doc(db, "teams", data.teamBId)),
      getDocs(query(collection(db, "matches", m.id, "events"), orderBy("minute", "asc")))
    ]);

    return {
      id: m.id,
      ...data,
      date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
      teamA: { id: teamASnap.id, ...teamASnap.data() },
      teamB: { id: teamBSnap.id, ...teamBSnap.data() },
      events: eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  }));

  return NextResponse.json(matches);
}

export async function POST(request: Request) {
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
    scoreA: 0,
    scoreB: 0,
    status: MatchStatus.PREVU,
    liveMinute: 0,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, "matches"), matchData);
  
  // Return with hydrated teams for the UI if needed
  const [teamASnap, teamBSnap] = await Promise.all([
    getDoc(doc(db, "teams", parsed.data.teamAId)),
    getDoc(doc(db, "teams", parsed.data.teamBId))
  ]);

  return NextResponse.json({ 
    id: docRef.id, 
    ...matchData,
    date: new Date(parsed.data.date),
    teamA: { id: teamASnap.id, ...teamASnap.data() },
    teamB: { id: teamBSnap.id, ...teamBSnap.data() } 
  }, { status: 201 });
}
