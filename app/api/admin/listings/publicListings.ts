import { NextRequest, NextResponse } from "next/server";
import { getAdminListings } from "@/lib/listings/publicListings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 24);

    const status = searchParams.get("status") ?? undefined;
    const location = searchParams.get("location") ?? undefined;
    const type = searchParams.get("type") ?? undefined;

    const result = await getAdminListings({
      page,
      limit,
      status,
      location,
      type,
    });
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("Admin listings API error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch listings",
      },
      {
        status: 500,
      }
    );
  }
}