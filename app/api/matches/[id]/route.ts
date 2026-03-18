import { NextRequest, NextResponse } from "next/server";
import { getMatchById } from "@/lib/tournament";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  try {
    const data = await getMatchById(id);
    if (!data) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
