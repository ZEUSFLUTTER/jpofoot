import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  Timestamp,
  orderBy 
} from "firebase/firestore";
import { createPlayerSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    // Fetch all teams first for the join
    const teamsSnap = await getDocs(collection(db, "teams"));
    const teamsMap = new Map();
    teamsSnap.docs.forEach(d => teamsMap.set(d.id, { id: d.id, ...d.data() }));

    // Fetch players
    let playersQuery = query(collection(db, "players"));
    if (teamId) {
      playersQuery = query(collection(db, "players"), where("teamId", "==", teamId));
    }

    const playersSnap = await getDocs(playersQuery);
    const players = playersSnap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        ...data,
        team: teamsMap.get(data.teamId) || null,
      };
    }).sort((a: any, b: any) => {
      // Manual sorting to match original Prisma logic
      const teamCompare = (a.teamId || "").localeCompare(b.teamId || "");
      if (teamCompare !== 0) return teamCompare;
      return (a.number || 0) - (b.number || 0);
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("GET Players Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const playerData = {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      number: parsed.data.number,
      teamId: parsed.data.teamId,
      position: parsed.data.position || null,
      photoUrl: parsed.data.photoUrl || null,
      createdAt: Timestamp.now(),
      stats: {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        updatedAt: Timestamp.now()
      }
    };

    const docRef = await addDoc(collection(db, "players"), playerData);
    
    // Fetch team for the response to match Prisma 'include'
    const teamSnap = await getDocs(query(collection(db, "teams"), where("__name__", "==", parsed.data.teamId)));
    const team = teamSnap.empty ? null : { id: teamSnap.docs[0].id, ...teamSnap.docs[0].data() };

    return NextResponse.json({ 
      id: docRef.id, 
      ...playerData,
      team 
    }, { status: 201 });
  } catch (error) {
    console.error("POST Player Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
