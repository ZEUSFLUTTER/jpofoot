import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, getDocs, collection, Timestamp, writeBatch } from "firebase/firestore";
import { updateMatchSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const matchRef = doc(db, "matches", id);
  const updateData: any = { ...parsed.data };
  
  if (parsed.data.date) {
    updateData.date = Timestamp.fromDate(new Date(parsed.data.date));
  }

  await updateDoc(matchRef, updateData);

  return NextResponse.json({ id, ...updateData });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;

  try {
    // Delete events first (subcollection)
    const eventsSnap = await getDocs(collection(db, "matches", id, "events"));
    const batch = writeBatch(db);
    eventsSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    await deleteDoc(doc(db, "matches", id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: "Impossible de supprimer le match. Assurez-vous qu'il n'est pas lié à des événements." }, { status: 400 });
  }
}
