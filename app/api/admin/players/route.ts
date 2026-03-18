import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { createPlayerSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  let q = query(collection(db, "players"), orderBy("teamId", "asc"), orderBy("number", "asc"));
  if (teamId) {
    q = query(collection(db, "players"), where("teamId", "==", teamId), orderBy("number", "asc"));
  }

  const snap = await getDocs(q);
  const players = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(players);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createPlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const qExisting = query(
    collection(db, "players"),
    where("teamId", "==", parsed.data.teamId),
    where("firstName", "==", parsed.data.firstName),
    where("lastName", "==", parsed.data.lastName)
  );
  const snapExisting = await getDocs(qExisting);

  if (!snapExisting.empty) {
    return NextResponse.json({ error: "Un joueur avec ce nom et ce prénom existe déjà dans cette salle/équipe" }, { status: 400 });
  }

  const playerData = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    number: parsed.data.number,
    teamId: parsed.data.teamId,
    position: parsed.data.position || null,
    photoUrl: parsed.data.photoUrl || null,
    stats: {
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      updatedAt: Timestamp.now(),
    },
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, "players"), playerData);

  return NextResponse.json({ id: docRef.id, ...playerData }, { status: 201 });
}
