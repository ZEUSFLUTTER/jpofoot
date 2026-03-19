import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { firstName, password } = await request.json();

    const q = query(
      collection(db, "managers"), 
      where("firstName", "==", firstName),
      where("password", "==", password)
    );
    
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ error: "Prénom ou mot de passe incorrect" }, { status: 401 });
    }

    const managerDoc = snap.docs[0];
    const managerData = managerDoc.data();

    const sessionData = {
      id: managerDoc.id,
      firstName: managerData.firstName,
      assignedMatchIds: managerData.assignedMatchIds || []
    };

    const cookieStore = await cookies();
    cookieStore.set("manager_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({ success: true, ...sessionData });
  } catch (error) {
    console.error("Manager Login Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
