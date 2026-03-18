import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateStatusSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const matchRef = doc(db, "matches", id);
    const updates: any = {
      status: parsed.data.status,
    };
    if (parsed.data.liveMinute !== undefined) {
      updates.liveMinute = parsed.data.liveMinute;
    }

    await updateDoc(matchRef, updates);

    return NextResponse.json({ id, ...updates });
  } catch (error) {
    console.error("PATCH Match Status Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
