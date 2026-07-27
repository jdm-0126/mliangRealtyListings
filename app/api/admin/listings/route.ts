import { NextResponse, NextRequest } from "next/server";
import { getAdminListings } from "@/lib/listings/publicListings";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const listings = await getAdminListings();

    return NextResponse.json({
      success: true,
      ...listings,
    });

  } catch (error: any) {
    console.error("GET listings error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}


export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing id" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("listings")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}