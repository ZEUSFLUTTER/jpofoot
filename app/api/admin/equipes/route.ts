import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy, Timestamp } from "firebase/firestore";
import { createTeamSchema } from "@/lib/validators";

export async function GET() {
  const teamsSnap = await getDocs(query(collection(db, "teams"), orderBy("name", "asc")));
  const teams = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createTeamSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const teamData = {
    name: parsed.data.name,
    logoUrl: parsed.data.logoUrl || null,
    colors: parsed.data.colors || null,
    coachFirstName: parsed.data.coachFirstName,
    coachLastName: parsed.data.coachLastName,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, "teams"), teamData);
  
  return NextResponse.json({ id: docRef.id, ...teamData }, { status: 201 });
}
