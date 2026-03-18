import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN non configuré. Ajoutez-le dans .env.local pour Vercel Blob." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }

  const blob = await put(`inter-classe/${Date.now()}-${file.name}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}
