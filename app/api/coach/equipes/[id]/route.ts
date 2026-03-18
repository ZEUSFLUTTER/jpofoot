import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("coach_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { teamId } = session;

    if (id !== teamId) {
       return NextResponse.json({ error: "Action non autorisée sur cette équipe" }, { status: 403 });
    }

    const body = await request.json();
    
    // Manual validation for simplicity or use a schema
    const updateData: any = {};
    if (body.name) updateData.name = String(body.name);
    if (body.colors) updateData.colors = String(body.colors);
    if (body.coachFirstName) updateData.coachFirstName = String(body.coachFirstName);
    if (body.coachLastName) updateData.coachLastName = String(body.coachLastName);
    
    updateData.updatedAt = new Date();

    const teamRef = doc(db, "teams", id);
    await updateDoc(teamRef, updateData);

    return NextResponse.json({ message: "Équipe mise à jour" });
  } catch (error) {
    console.error("Coach Update Team Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
