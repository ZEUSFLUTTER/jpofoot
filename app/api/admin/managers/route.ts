import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "managers"));
    const managers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(managers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch managers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, password } = body;

    if (!firstName || !password) {
      return NextResponse.json({ error: "Prénom et mot de passe requis" }, { status: 400 });
    }

    const docRef = await addDoc(collection(db, "managers"), {
      firstName,
      password,
      assignedMatchIds: [],
      createdAt: Timestamp.now(),
    });

    return NextResponse.json({ id: docRef.id, firstName, assignedMatchIds: [] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create manager" }, { status: 500 });
  }
}
