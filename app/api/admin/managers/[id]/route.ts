import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { firstName, password, assignedMatchIds } = body;

    const managerRef = doc(db, "managers", id);
    const updates: any = {};
    if (firstName) updates.firstName = firstName;
    if (password) updates.password = password;
    if (assignedMatchIds !== undefined) updates.assignedMatchIds = assignedMatchIds;

    await updateDoc(managerRef, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update manager" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await deleteDoc(doc(db, "managers", id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete manager" }, { status: 500 });
  }
}
