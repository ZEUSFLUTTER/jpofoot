import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { firstName, lastName } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Prénom et Nom sont requis" }, { status: 400 });
    }

    // Search for the team with this coach
    const teamsRef = collection(db, "teams");
    const q = query(
      teamsRef, 
      where("coachFirstName", "==", firstName),
      where("coachLastName", "==", lastName)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Coach non trouvé ou non enregistré" }, { status: 404 });
    }

    const teamDoc = querySnapshot.docs[0];
    const teamData = teamDoc.data();

    // Set Session Cookie
    const cookieStore = await cookies();
    const sessionData = JSON.stringify({
      teamId: teamDoc.id,
      teamName: teamData.name,
      coachFirstName: firstName,
      coachLastName: lastName,
    });

    cookieStore.set("coach_session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({ success: true, teamId: teamDoc.id });
  } catch (error) {
    console.error("Coach Login Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
